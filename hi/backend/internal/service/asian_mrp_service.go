package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/kayukwas/tracking-backend/internal/models"
	"github.com/kayukwas/tracking-backend/internal/repository"
)

// DTOs
type CreateLandedCostDTO struct {
	PurchaseOrderID  uint64  `json:"purchase_order_id"`
	FreightCost      float64 `json:"freight_cost"`
	CustomsDuty      float64 `json:"customs_duty"`
	InsuranceFee     float64 `json:"insurance_fee"`
	HandlingFee      float64 `json:"handling_fee"`
	AllocationMethod string  `json:"allocation_method"` // BY_VALUE, BY_QUANTITY
}

type CreateSubcontractReconcileDTO struct {
	MitraUserID      uint64  `json:"mitra_user_id"`
	WorkOrderID      uint64  `json:"work_order_id"`
	SentQuantity     int     `json:"sent_quantity"`
	ReceivedQuantity int     `json:"received_quantity"`
	RejectQuantity   int     `json:"reject_quantity"`
	PieceRate        float64 `json:"piece_rate"`
	PenaltyPerReject float64 `json:"penalty_per_reject"`
	Notes            string  `json:"notes"`
}

type CreateOverheadAbsorptionDTO struct {
	PeriodMonth        string  `json:"period_month"` // e.g. "2026-09"
	ElectricityCost    float64 `json:"electricity_cost"`
	FactoryRentCost    float64 `json:"factory_rent_cost"`
	DepreciationCost   float64 `json:"depreciation_cost"`
	ConsumableCost     float64 `json:"consumable_cost"`
	TotalProductionQty int     `json:"total_production_qty"`
}

type AsianMRPExtensionsService interface {
	// Landed Cost
	ListLandedCosts(page, limit int) ([]models.LandedCost, int64, error)
	GetLandedCostByID(id uint64) (*models.LandedCost, error)
	CreateLandedCost(actorID uint64, dto CreateLandedCostDTO) (*models.LandedCost, error)
	PostLandedCost(actorID, id uint64) error

	// Subcontract Reconciliation
	ListSubcontractReconciliations(mitraID uint64, status string, page, limit int) ([]models.SubcontractReconciliation, int64, error)
	CreateSubcontractReconciliation(actorID uint64, dto CreateSubcontractReconcileDTO) (*models.SubcontractReconciliation, error)
	PaySubcontractReconciliation(actorID, id uint64) error

	// Factory Overhead Absorption
	ListOverheadAbsorptions(page, limit int) ([]models.OverheadAbsorption, int64, error)
	CalculateAndStoreOverhead(actorID uint64, dto CreateOverheadAbsorptionDTO) (*models.OverheadAbsorption, error)
}

type asianMRPExtensionsService struct {
	repo      repository.AsianMRPExtensionsRepository
	poRepo    repository.PurchaseOrderRepository
	matRepo   repository.MaterialRepository
	auditServ AuditLogService
}

func NewAsianMRPExtensionsService(
	repo repository.AsianMRPExtensionsRepository,
	poRepo repository.PurchaseOrderRepository,
	matRepo repository.MaterialRepository,
	auditServ AuditLogService,
) AsianMRPExtensionsService {
	return &asianMRPExtensionsService{
		repo:      repo,
		poRepo:    poRepo,
		matRepo:   matRepo,
		auditServ: auditServ,
	}
}

// ----------------- Landed Cost Implementation -----------------
func (s *asianMRPExtensionsService) ListLandedCosts(page, limit int) ([]models.LandedCost, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.repo.ListLandedCosts(limit, offset)
}

func (s *asianMRPExtensionsService) GetLandedCostByID(id uint64) (*models.LandedCost, error) {
	return s.repo.GetLandedCostByID(id)
}

func (s *asianMRPExtensionsService) CreateLandedCost(actorID uint64, dto CreateLandedCostDTO) (*models.LandedCost, error) {
	po, err := s.poRepo.FindByID(dto.PurchaseOrderID)
	if err != nil || po == nil {
		return nil, errors.New("Purchase Order pengadaan bahan tidak ditemukan")
	}

	totalExtra := dto.FreightCost + dto.CustomsDuty + dto.InsuranceFee + dto.HandlingFee
	now := time.Now()
	docNo := fmt.Sprintf("LC-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	items := make([]models.LandedCostItem, 0, len(po.Items))
	for _, it := range po.Items {
		// Proportionate allocation by PO item subtotal
		ratio := 1.0 / float64(len(po.Items))
		if po.TotalAmount > 0 {
			ratio = it.Subtotal / po.TotalAmount
		}
		allocatedShare := totalExtra * ratio
		finalUnitCost := it.UnitCost + (allocatedShare / it.Qty)

		items = append(items, models.LandedCostItem{
			MaterialID:         it.MaterialID,
			BasePurchasedCost:  it.UnitCost,
			AllocatedExtraCost: allocatedShare / it.Qty,
			FinalTrueUnitCost:  finalUnitCost,
		})
	}

	lc := &models.LandedCost{
		DocumentNumber:   docNo,
		PurchaseOrderID:  dto.PurchaseOrderID,
		FreightCost:      dto.FreightCost,
		CustomsDuty:      dto.CustomsDuty,
		InsuranceFee:     dto.InsuranceFee,
		HandlingFee:      dto.HandlingFee,
		TotalLandedCost:  totalExtra,
		AllocationMethod: dto.AllocationMethod,
		Status:           "ALLOCATED",
		Items:            items,
	}

	if err := s.repo.CreateLandedCost(lc); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "CREATE_LANDED_COST", fmt.Sprintf("Alokasi Biaya Landed Cost: %s (Total Ekstra: Rp %.2f)", docNo, totalExtra))
	return s.repo.GetLandedCostByID(lc.ID)
}

func (s *asianMRPExtensionsService) PostLandedCost(actorID, id uint64) error {
	lc, err := s.repo.GetLandedCostByID(id)
	if err != nil {
		return err
	}

	// Update material CostPerUnit with real true Landed Cost
	for _, it := range lc.Items {
		mat, errM := s.matRepo.FindByID(it.MaterialID)
		if errM == nil && mat != nil {
			mat.CostPerUnit = it.FinalTrueUnitCost
			_ = s.matRepo.Update(mat)
		}
	}

	lc.Status = "POSTED"
	s.auditServ.RecordLog(&actorID, "POST_LANDED_COST", fmt.Sprintf("Posting HPP Landed Cost %s ke Master Bahan Baku", lc.DocumentNumber))
	return s.repo.UpdateLandedCost(lc)
}

// ----------------- Subcontract Maklon Implementation -----------------
func (s *asianMRPExtensionsService) ListSubcontractReconciliations(mitraID uint64, status string, page, limit int) ([]models.SubcontractReconciliation, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.repo.ListSubcontractReconciliations(mitraID, status, limit, offset)
}

func (s *asianMRPExtensionsService) CreateSubcontractReconciliation(actorID uint64, dto CreateSubcontractReconcileDTO) (*models.SubcontractReconciliation, error) {
	if dto.SentQuantity <= 0 {
		return nil, errors.New("kuantitas kirim harus lebih dari 0")
	}

	yieldPct := (float64(dto.ReceivedQuantity) / float64(dto.SentQuantity)) * 100.0
	grossFee := float64(dto.ReceivedQuantity) * dto.PieceRate
	penalty := float64(dto.RejectQuantity) * dto.PenaltyPerReject
	netPayout := grossFee - penalty
	if netPayout < 0 {
		netPayout = 0
	}

	now := time.Now()
	recNo := fmt.Sprintf("REC-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	rec := &models.SubcontractReconciliation{
		ReconcileNumber:   recNo,
		MitraUserID:       dto.MitraUserID,
		WorkOrderID:       dto.WorkOrderID,
		SentQuantity:      dto.SentQuantity,
		ReceivedQuantity:  dto.ReceivedQuantity,
		RejectQuantity:    dto.RejectQuantity,
		MaterialYieldPct:  yieldPct,
		MitraFeePayable:   grossFee,
		PenaltyDeduction:  penalty,
		FinalPayoutAmount: netPayout,
		Status:            "RECONCILED",
		Notes:             dto.Notes,
	}

	if err := s.repo.CreateSubcontractReconciliation(rec); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "CREATE_SUBCONTRACT_RECONCILE", fmt.Sprintf("Rekonsiliasi Maklon %s: Rendemen %.2f%%, Bersih Dibayar Rp %.2f", recNo, yieldPct, netPayout))
	return s.repo.GetSubcontractReconciliationByID(rec.ID)
}

func (s *asianMRPExtensionsService) PaySubcontractReconciliation(actorID, id uint64) error {
	s.auditServ.RecordLog(&actorID, "PAY_SUBCONTRACT_RECONCILE", fmt.Sprintf("Pelunasan Pembayaran Borongan Maklon ID #%d", id))
	return s.repo.UpdateSubcontractStatus(id, "PAID")
}

// ----------------- Overhead Absorption Implementation -----------------
func (s *asianMRPExtensionsService) ListOverheadAbsorptions(page, limit int) ([]models.OverheadAbsorption, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.repo.ListOverheadAbsorptions(limit, offset)
}

func (s *asianMRPExtensionsService) CalculateAndStoreOverhead(actorID uint64, dto CreateOverheadAbsorptionDTO) (*models.OverheadAbsorption, error) {
	if dto.TotalProductionQty <= 0 {
		return nil, errors.New("total output produksi pabrik harus lebih dari 0")
	}

	totalOverhead := dto.ElectricityCost + dto.FactoryRentCost + dto.DepreciationCost + dto.ConsumableCost
	ratePerUnit := totalOverhead / float64(dto.TotalProductionQty)

	ov := &models.OverheadAbsorption{
		PeriodMonth:         dto.PeriodMonth,
		ElectricityCost:     dto.ElectricityCost,
		FactoryRentCost:     dto.FactoryRentCost,
		DepreciationCost:    dto.DepreciationCost,
		ConsumableCost:      dto.ConsumableCost,
		TotalOverheadCost:   totalOverhead,
		TotalProductionQty:  dto.TotalProductionQty,
		OverheadRatePerUnit: ratePerUnit,
		Status:              "ALLOCATED",
	}

	if err := s.repo.CreateOverheadAbsorption(ov); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "CALCULATE_OVERHEAD", fmt.Sprintf("Absorpsi Biaya Overhead Pabrik Periode %s: Rp %.2f / unit", dto.PeriodMonth, ratePerUnit))
	return ov, nil
}
