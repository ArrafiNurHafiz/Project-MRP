package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/kayukwas/tracking-backend/internal/models"
	"github.com/kayukwas/tracking-backend/internal/repository"
)

type CreateDowntimeDTO struct {
	StationID          uint64  `json:"station_id"`
	WorkOrderStationID *uint64 `json:"work_order_station_id"`
	MachineName        string  `json:"machine_name"`
	ReasonCategory     string  `json:"reason_category"`
	ImpactedQty        int     `json:"impacted_qty"`
	ActionTaken        string  `json:"action_taken"`
}

type CloseDowntimeDTO struct {
	DurationMinutes int    `json:"duration_minutes"`
	ActionTaken     string `json:"action_taken"`
}

type CreateReworkOrderDTO struct {
	WorkOrderID     uint64  `json:"work_order_id"`
	SourceStationID uint64  `json:"source_station_id"`
	TargetStationID uint64  `json:"target_station_id"`
	DefectReason    string  `json:"defect_reason"`
	DefectQty       int     `json:"defect_qty"`
	AssignedMitraID *uint64 `json:"assigned_mitra_id"`
	Notes           string  `json:"notes"`
}

type UpdateReworkDTO struct {
	RecoveredQty int    `json:"recovered_qty"`
	ScrappedQty  int    `json:"scrapped_qty"`
	Status       string `json:"status"` // RECOVERED, SCRAPPED, IN_PROGRESS
	Notes        string `json:"notes"`
}

type CreateBatchLotDTO struct {
	MaterialID      uint64     `json:"material_id"`
	VendorID        uint64     `json:"vendor_id"`
	ReceivedDate    time.Time  `json:"received_date"`
	InitialQty      float64    `json:"initial_qty"`
	UnitCost        float64    `json:"unit_cost"`
	WoodOrigin      string     `json:"wood_origin"`
	MoistureContent float64    `json:"moisture_content"`
	ExpiryDate      *time.Time `json:"expiry_date"`
}

type IndustrialMRPService interface {
	// Machine Downtime
	ListDowntimes(stationID uint64, page, limit int) ([]models.MachineDowntime, int64, error)
	ReportDowntime(actorID uint64, dto CreateDowntimeDTO) (*models.MachineDowntime, error)
	ResolveDowntime(actorID, id uint64, dto CloseDowntimeDTO) error

	// Rework & Scrap Loop
	ListReworkOrders(status string, page, limit int) ([]models.ReworkOrder, int64, error)
	CreateReworkOrder(actorID uint64, dto CreateReworkOrderDTO) (*models.ReworkOrder, error)
	UpdateReworkProgress(actorID, id uint64, dto UpdateReworkDTO) error

	// Lot / Batch Tracking
	ListBatchLots(materialID uint64, search string, page, limit int) ([]models.MaterialBatchLot, int64, error)
	RegisterBatchLot(actorID uint64, dto CreateBatchLotDTO) (*models.MaterialBatchLot, error)
}

type industrialMRPService struct {
	repo      repository.IndustrialMRPRepository
	matRepo   repository.MaterialRepository
	auditServ AuditLogService
}

func NewIndustrialMRPService(
	repo repository.IndustrialMRPRepository,
	matRepo repository.MaterialRepository,
	auditServ AuditLogService,
) IndustrialMRPService {
	return &industrialMRPService{
		repo:      repo,
		matRepo:   matRepo,
		auditServ: auditServ,
	}
}

func (s *industrialMRPService) ListDowntimes(stationID uint64, page, limit int) ([]models.MachineDowntime, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.repo.ListDowntimes(stationID, limit, offset)
}

func (s *industrialMRPService) ReportDowntime(actorID uint64, dto CreateDowntimeDTO) (*models.MachineDowntime, error) {
	if dto.StationID == 0 || dto.MachineName == "" {
		return nil, errors.New("stasiun kerja dan nama mesin wajib diisi")
	}

	dt := &models.MachineDowntime{
		StationID:          dto.StationID,
		WorkOrderStationID: dto.WorkOrderStationID,
		MachineName:        dto.MachineName,
		ReasonCategory:     dto.ReasonCategory,
		StartTime:          time.Now(),
		ImpactedQty:        dto.ImpactedQty,
		ActionTaken:        dto.ActionTaken,
		ReportedByUserID:   actorID,
	}

	if err := s.repo.CreateDowntime(dt); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "REPORT_MACHINE_DOWNTIME", fmt.Sprintf("Mesin %s mengalami kendala: %s", dto.MachineName, dto.ReasonCategory))
	return dt, nil
}

func (s *industrialMRPService) ResolveDowntime(actorID, id uint64, dto CloseDowntimeDTO) error {
	s.auditServ.RecordLog(&actorID, "RESOLVE_MACHINE_DOWNTIME", fmt.Sprintf("Mesin diselesaikan (%d menit): %s", dto.DurationMinutes, dto.ActionTaken))
	return s.repo.CloseDowntime(id, dto.DurationMinutes, dto.ActionTaken)
}

func (s *industrialMRPService) ListReworkOrders(status string, page, limit int) ([]models.ReworkOrder, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.repo.ListReworkOrders(status, limit, offset)
}

func (s *industrialMRPService) CreateReworkOrder(actorID uint64, dto CreateReworkOrderDTO) (*models.ReworkOrder, error) {
	if dto.WorkOrderID == 0 || dto.DefectQty <= 0 {
		return nil, errors.New("SPK dan kuantitas cacat harus valid")
	}

	now := time.Now()
	reworkNo := fmt.Sprintf("RWK-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	ro := &models.ReworkOrder{
		ReworkNumber:    reworkNo,
		WorkOrderID:     dto.WorkOrderID,
		SourceStationID: dto.SourceStationID,
		TargetStationID: dto.TargetStationID,
		DefectReason:    dto.DefectReason,
		DefectQty:       dto.DefectQty,
		AssignedMitraID: dto.AssignedMitraID,
		Status:          "IN_PROGRESS",
		Notes:           dto.Notes,
	}

	if err := s.repo.CreateReworkOrder(ro); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "CREATE_REWORK_ORDER", fmt.Sprintf("Penerbitan Surat Rework %s: %d pcs (%s)", reworkNo, dto.DefectQty, dto.DefectReason))
	return s.repo.GetReworkOrderByID(ro.ID)
}

func (s *industrialMRPService) UpdateReworkProgress(actorID, id uint64, dto UpdateReworkDTO) error {
	s.auditServ.RecordLog(&actorID, "UPDATE_REWORK_PROGRESS", fmt.Sprintf("Update Rework Order #%d: Recovered %d, Scrapped %d", id, dto.RecoveredQty, dto.ScrappedQty))
	return s.repo.UpdateReworkProgress(id, dto.RecoveredQty, dto.ScrappedQty, dto.Status, dto.Notes)
}

func (s *industrialMRPService) ListBatchLots(materialID uint64, search string, page, limit int) ([]models.MaterialBatchLot, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.repo.ListBatchLots(materialID, search, limit, offset)
}

func (s *industrialMRPService) RegisterBatchLot(actorID uint64, dto CreateBatchLotDTO) (*models.MaterialBatchLot, error) {
	if dto.MaterialID == 0 || dto.InitialQty <= 0 {
		return nil, errors.New("material dan kuantitas awal wajib diisi")
	}

	now := time.Now()
	batchNo := fmt.Sprintf("LOT-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	lot := &models.MaterialBatchLot{
		BatchNumber:     batchNo,
		MaterialID:      dto.MaterialID,
		VendorID:        dto.VendorID,
		ReceivedDate:    dto.ReceivedDate,
		InitialQty:      dto.InitialQty,
		RemainingQty:    dto.InitialQty,
		UnitCost:        dto.UnitCost,
		WoodOrigin:      dto.WoodOrigin,
		MoistureContent: dto.MoistureContent,
		ExpiryDate:      dto.ExpiryDate,
		QCStatus:        "PASSED",
	}

	if err := s.repo.CreateBatchLot(lot); err != nil {
		return nil, err
	}

	// Increment actual material stock
	_ = s.matRepo.AdjustStock(dto.MaterialID, dto.InitialQty)

	s.auditServ.RecordLog(&actorID, "REGISTER_BATCH_LOT", fmt.Sprintf("Registrasi Lot Kayu %s (Asal: %s, Qty: %.2f)", batchNo, dto.WoodOrigin, dto.InitialQty))
	return lot, nil
}
