package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/kayukwas/tracking-backend/internal/models"
	"github.com/kayukwas/tracking-backend/internal/repository"
)

// DTOs
type CreateECOItemDTO struct {
	MaterialID  uint64  `json:"material_id"`
	ActionType  string  `json:"action_type"` // ADD_MATERIAL, REMOVE_MATERIAL, UPDATE_QTY
	OldQuantity float64 `json:"old_quantity"`
	NewQuantity float64 `json:"new_quantity"`
	Notes       string  `json:"notes"`
}

type CreateECODTO struct {
	ProductID     uint64             `json:"product_id"`
	Title         string             `json:"title"`
	ChangeType    string             `json:"change_type"`
	Reason        string             `json:"reason"`
	EffectiveDate time.Time          `json:"effective_date"`
	VersionFrom   string             `json:"version_from"`
	VersionTo     string             `json:"version_to"`
	Items         []CreateECOItemDTO `json:"items"`
}

type ClockInShopFloorDTO struct {
	WorkOrderStationID uint64 `json:"work_order_station_id"`
	MachineName        string `json:"machine_name"`
}

type ClockOutShopFloorDTO struct {
	DurationMinutes  int `json:"duration_minutes"`
	GoodQtyProduced  int `json:"good_qty_produced"`
	ScrapQtyProduced int `json:"scrap_qty_produced"`
}

type CreateMaintenanceTaskDTO struct {
	StationID        uint64    `json:"station_id"`
	MachineName      string    `json:"machine_name"`
	TaskType         string    `json:"task_type"` // PREVENTIVE, CORRECTIVE
	ScheduledDate    time.Time `json:"scheduled_date"`
	TechnicianUserID uint64    `json:"technician_user_id"`
	SparePartNotes   string    `json:"spare_part_notes"`
	CostEstimated    float64   `json:"cost_estimated"`
}

type CreateUnbuildOrderDTO struct {
	ProductID      uint64 `json:"product_id"`
	DisassemblyQty int    `json:"disassembly_qty"`
	Reason         string `json:"reason"`
}

type EnterpriseExtensionsService interface {
	// ECO
	ListECOs(status string, page, limit int) ([]models.EngineeringChangeOrder, int64, error)
	GetECOByID(id uint64) (*models.EngineeringChangeOrder, error)
	CreateECO(actorID uint64, dto CreateECODTO) (*models.EngineeringChangeOrder, error)
	ApproveAndApplyECO(actorID, id uint64) error

	// ShopFloor Kiosk
	ListShopFloorLogs(wosID uint64, status string, page, limit int) ([]models.ShopFloorLog, int64, error)
	ClockInShopFloor(actorID uint64, dto ClockInShopFloorDTO) (*models.ShopFloorLog, error)
	ClockOutShopFloor(actorID, id uint64, dto ClockOutShopFloorDTO) error

	// Maintenance
	ListMaintenanceTasks(status, taskType string, page, limit int) ([]models.MaintenanceTask, int64, error)
	CreateMaintenanceTask(actorID uint64, dto CreateMaintenanceTaskDTO) (*models.MaintenanceTask, error)
	CompleteMaintenanceTask(actorID, id uint64, actionLog string) error

	// Unbuild / Disassembly
	ListUnbuildOrders(page, limit int) ([]models.UnbuildOrder, int64, error)
	GetUnbuildByID(id uint64) (*models.UnbuildOrder, error)
	CreateUnbuildOrder(actorID uint64, dto CreateUnbuildOrderDTO) (*models.UnbuildOrder, error)
	ExecuteUnbuild(actorID, id uint64) error
}

type enterpriseExtensionsService struct {
	repo      repository.EnterpriseExtensionsRepository
	bomRepo   repository.BOMRepository
	matRepo   repository.MaterialRepository
	prodRepo  repository.ProductRepository
	auditServ AuditLogService
}

func NewEnterpriseExtensionsService(
	repo repository.EnterpriseExtensionsRepository,
	bomRepo repository.BOMRepository,
	matRepo repository.MaterialRepository,
	prodRepo repository.ProductRepository,
	auditServ AuditLogService,
) EnterpriseExtensionsService {
	return &enterpriseExtensionsService{
		repo:      repo,
		bomRepo:   bomRepo,
		matRepo:   matRepo,
		prodRepo:  prodRepo,
		auditServ: auditServ,
	}
}

// ----------------- ECO Implementation -----------------
func (s *enterpriseExtensionsService) ListECOs(status string, page, limit int) ([]models.EngineeringChangeOrder, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.repo.ListECOs(status, limit, offset)
}

func (s *enterpriseExtensionsService) GetECOByID(id uint64) (*models.EngineeringChangeOrder, error) {
	return s.repo.GetECOByID(id)
}

func (s *enterpriseExtensionsService) CreateECO(actorID uint64, dto CreateECODTO) (*models.EngineeringChangeOrder, error) {
	if dto.ProductID == 0 || dto.Title == "" {
		return nil, errors.New("produk dan judul revisi ECO wajib diisi")
	}

	now := time.Now()
	ecoNo := fmt.Sprintf("ECO-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	items := make([]models.ECOItem, 0, len(dto.Items))
	for _, it := range dto.Items {
		items = append(items, models.ECOItem{
			MaterialID:  it.MaterialID,
			ActionType:  it.ActionType,
			OldQuantity: it.OldQuantity,
			NewQuantity: it.NewQuantity,
			Notes:       it.Notes,
		})
	}

	eco := &models.EngineeringChangeOrder{
		ECONumber:     ecoNo,
		ProductID:     dto.ProductID,
		Title:         dto.Title,
		ChangeType:    dto.ChangeType,
		Reason:        dto.Reason,
		EffectiveDate: dto.EffectiveDate,
		VersionFrom:   dto.VersionFrom,
		VersionTo:     dto.VersionTo,
		Status:        "DRAFT",
		Items:         items,
	}

	if err := s.repo.CreateECO(eco); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "CREATE_ECO", fmt.Sprintf("Penerbitan Revisi Desain & BOM: %s (%s)", ecoNo, dto.Title))
	return s.repo.GetECOByID(eco.ID)
}

func (s *enterpriseExtensionsService) ApproveAndApplyECO(actorID, id uint64) error {
	eco, err := s.repo.GetECOByID(id)
	if err != nil {
		return err
	}

	// Apply items to actual BOM
	for _, it := range eco.Items {
		if it.ActionType == "UPDATE_QTY" || it.ActionType == "ADD_MATERIAL" {
			bom := &models.ProductBOM{
				ProductID:  eco.ProductID,
				MaterialID: it.MaterialID,
				StationID:  1, // Default Station
				Quantity:   it.NewQuantity,
				WastePct:   2.0,
				Notes:      fmt.Sprintf("Revisi melalui %s", eco.ECONumber),
			}
			_ = s.bomRepo.CreateOrUpdate(bom)
		}
	}

	s.auditServ.RecordLog(&actorID, "APPLY_ECO", fmt.Sprintf("Pemberlakuan Resmi Perubahan Resep BOM: %s", eco.ECONumber))
	return s.repo.UpdateECOStatus(id, "APPLIED", actorID)
}

// ----------------- Shopfloor Kiosk Implementation -----------------
func (s *enterpriseExtensionsService) ListShopFloorLogs(wosID uint64, status string, page, limit int) ([]models.ShopFloorLog, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.repo.ListShopFloorLogs(wosID, status, limit, offset)
}

func (s *enterpriseExtensionsService) ClockInShopFloor(actorID uint64, dto ClockInShopFloorDTO) (*models.ShopFloorLog, error) {
	if dto.WorkOrderStationID == 0 {
		return nil, errors.New("stasiun SPK wajib dipilih")
	}

	log := &models.ShopFloorLog{
		WorkOrderStationID: dto.WorkOrderStationID,
		OperatorUserID:     actorID,
		MachineName:        dto.MachineName,
		ClockInTime:        time.Now(),
		Status:             "RUNNING",
	}

	if err := s.repo.ClockInShopFloor(log); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "SHOPFLOOR_CLOCK_IN", fmt.Sprintf("Operator mulai kerja pada stasiun SPK #%d", dto.WorkOrderStationID))
	return log, nil
}

func (s *enterpriseExtensionsService) ClockOutShopFloor(actorID, id uint64, dto ClockOutShopFloorDTO) error {
	s.auditServ.RecordLog(&actorID, "SHOPFLOOR_CLOCK_OUT", fmt.Sprintf("Operator selesai shift: %d unit lolos, %d unit scrap (%d menit)", dto.GoodQtyProduced, dto.ScrapQtyProduced, dto.DurationMinutes))
	return s.repo.ClockOutShopFloor(id, dto.DurationMinutes, dto.GoodQtyProduced, dto.ScrapQtyProduced)
}

// ----------------- Maintenance Implementation -----------------
func (s *enterpriseExtensionsService) ListMaintenanceTasks(status, taskType string, page, limit int) ([]models.MaintenanceTask, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.repo.ListMaintenanceTasks(status, taskType, limit, offset)
}

func (s *enterpriseExtensionsService) CreateMaintenanceTask(actorID uint64, dto CreateMaintenanceTaskDTO) (*models.MaintenanceTask, error) {
	if dto.StationID == 0 || dto.MachineName == "" {
		return nil, errors.New("stasiun dan nama mesin wajib diisi")
	}

	now := time.Now()
	taskNo := fmt.Sprintf("MNT-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	t := &models.MaintenanceTask{
		TaskNumber:       taskNo,
		StationID:        dto.StationID,
		MachineName:      dto.MachineName,
		TaskType:         dto.TaskType,
		ScheduledDate:    dto.ScheduledDate,
		TechnicianUserID: dto.TechnicianUserID,
		SparePartNotes:   dto.SparePartNotes,
		CostEstimated:    dto.CostEstimated,
		Status:           "SCHEDULED",
	}

	if err := s.repo.CreateMaintenanceTask(t); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "CREATE_MAINTENANCE_TASK", fmt.Sprintf("Jadwal Perawatan Mesin: %s (%s)", taskNo, dto.MachineName))
	return t, nil
}

func (s *enterpriseExtensionsService) CompleteMaintenanceTask(actorID, id uint64, actionLog string) error {
	s.auditServ.RecordLog(&actorID, "COMPLETE_MAINTENANCE_TASK", fmt.Sprintf("Tugas Perawatan Mesin #%d Selesai: %s", id, actionLog))
	return s.repo.CompleteMaintenanceTask(id, actionLog)
}

// ----------------- Unbuild Implementation -----------------
func (s *enterpriseExtensionsService) ListUnbuildOrders(page, limit int) ([]models.UnbuildOrder, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.repo.ListUnbuildOrders(limit, offset)
}

func (s *enterpriseExtensionsService) GetUnbuildByID(id uint64) (*models.UnbuildOrder, error) {
	return s.repo.GetUnbuildByID(id)
}

func (s *enterpriseExtensionsService) CreateUnbuildOrder(actorID uint64, dto CreateUnbuildOrderDTO) (*models.UnbuildOrder, error) {
	if dto.ProductID == 0 || dto.DisassemblyQty <= 0 {
		return nil, errors.New("produk dan kuantitas bongkar harus valid")
	}

	now := time.Now()
	unbNo := fmt.Sprintf("UNB-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	// Fetch BOM to populate recovered items
	bomList, _ := s.bomRepo.FindByProductID(dto.ProductID)
	recovered := make([]models.UnbuildItem, 0, len(bomList))
	for _, b := range bomList {
		recovered = append(recovered, models.UnbuildItem{
			MaterialID:   b.MaterialID,
			RecoveredQty: b.Quantity * float64(dto.DisassemblyQty),
			Condition:    "REUSABLE",
		})
	}

	ub := &models.UnbuildOrder{
		UnbuildNumber:     unbNo,
		ProductID:         dto.ProductID,
		DisassemblyQty:    dto.DisassemblyQty,
		Reason:            dto.Reason,
		Status:            "DRAFT",
		PerformedByUserID: actorID,
		RecoveredItems:    recovered,
	}

	if err := s.repo.CreateUnbuildOrder(ub); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "CREATE_UNBUILD_ORDER", fmt.Sprintf("Perintah Bongkar Produk Jadi (Unbuild) %s: %d unit", unbNo, dto.DisassemblyQty))
	return s.repo.GetUnbuildByID(ub.ID)
}

func (s *enterpriseExtensionsService) ExecuteUnbuild(actorID, id uint64) error {
	ub, err := s.repo.GetUnbuildByID(id)
	if err != nil {
		return err
	}

	// Restock recovered materials
	for _, it := range ub.RecoveredItems {
		if it.Condition == "REUSABLE" {
			_ = s.matRepo.AdjustStock(it.MaterialID, it.RecoveredQty)
		}
	}

	s.auditServ.RecordLog(&actorID, "EXECUTE_UNBUILD_ORDER", fmt.Sprintf("Eksekusi Pembongkaran %s: Material dikembalikan ke stok gudang", ub.UnbuildNumber))
	return s.repo.ExecuteUnbuild(id)
}
