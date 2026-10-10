package service

import (
	"fmt"
	"time"

	"github.com/kayukwas/tracking-backend/internal/models"
	"github.com/kayukwas/tracking-backend/internal/repository"
)

type CreateWarehouseDTO struct {
	TenantID    uint64  `json:"tenant_id"`
	Code        string  `json:"code"`
	Name        string  `json:"name"`
	Type        string  `json:"type"`
	Location    string  `json:"location"`
	Address     string  `json:"address"`
	CapacityM3  float64 `json:"capacity_m3"`
	ManagerName string  `json:"manager_name"`
	IsActive    bool    `json:"is_active"`
}

type CreateStockTransferItemDTO struct {
	MaterialID     uint64  `json:"material_id"`
	RequestedQty   float64 `json:"requested_qty"`
	TransferredQty float64 `json:"transferred_qty"`
	UnitCost       float64 `json:"unit_cost"`
}

type CreateStockTransferDTO struct {
	TenantID        uint64                       `json:"tenant_id"`
	FromWarehouseID uint64                       `json:"from_warehouse_id"`
	ToWarehouseID   uint64                       `json:"to_warehouse_id"`
	DriverName      string                       `json:"driver_name"`
	VehicleNumber   string                       `json:"vehicle_number"`
	Notes           string                       `json:"notes"`
	Items           []CreateStockTransferItemDTO `json:"items"`
}

type CreateStockAdjustmentDTO struct {
	TenantID    uint64  `json:"tenant_id"`
	WarehouseID uint64  `json:"warehouse_id"`
	MaterialID  uint64  `json:"material_id"`
	RecordedQty float64 `json:"recorded_qty"`
	CountedQty  float64 `json:"counted_qty"`
	Reason      string  `json:"reason"`
	Notes       string  `json:"notes"`
}

type WarehouseService interface {
	ListWarehouses(tenantID uint64, search string) ([]models.Warehouse, error)
	GetWarehouseByID(id uint64) (*models.Warehouse, error)
	CreateWarehouse(actorID uint64, dto CreateWarehouseDTO) (*models.Warehouse, error)
	UpdateWarehouse(actorID uint64, id uint64, dto CreateWarehouseDTO) (*models.Warehouse, error)
	DeleteWarehouse(actorID uint64, id uint64) error

	ListStockTransfers(tenantID uint64, search string) ([]models.StockTransfer, error)
	GetStockTransferByID(id uint64) (*models.StockTransfer, error)
	CreateStockTransfer(actorID uint64, dto CreateStockTransferDTO) (*models.StockTransfer, error)
	CompleteStockTransfer(actorID uint64, id uint64) error
	CancelStockTransfer(actorID uint64, id uint64) error

	ListStockAdjustments(tenantID uint64) ([]models.StockAdjustment, error)
	CreateStockAdjustment(actorID uint64, dto CreateStockAdjustmentDTO) (*models.StockAdjustment, error)
	ApproveStockAdjustment(actorID uint64, id uint64) error
}

type warehouseService struct {
	repo     repository.WarehouseRepository
	auditSvc AuditLogService
}

func NewWarehouseService(repo repository.WarehouseRepository, auditSvc AuditLogService) WarehouseService {
	return &warehouseService{repo: repo, auditSvc: auditSvc}
}

// ----------------- Warehouses -----------------
func (s *warehouseService) ListWarehouses(tenantID uint64, search string) ([]models.Warehouse, error) {
	return s.repo.ListWarehouses(tenantID, search)
}

func (s *warehouseService) GetWarehouseByID(id uint64) (*models.Warehouse, error) {
	return s.repo.GetWarehouseByID(id)
}

func (s *warehouseService) CreateWarehouse(actorID uint64, dto CreateWarehouseDTO) (*models.Warehouse, error) {
	if dto.Code == "" || dto.Name == "" {
		return nil, fmt.Errorf("kode dan nama gudang wajib diisi")
	}

	wh := &models.Warehouse{
		TenantID:    dto.TenantID,
		Code:        dto.Code,
		Name:        dto.Name,
		Type:        dto.Type,
		Location:    dto.Location,
		Address:     dto.Address,
		CapacityM3:  dto.CapacityM3,
		ManagerName: dto.ManagerName,
		IsActive:    true,
	}

	if err := s.repo.CreateWarehouse(wh); err != nil {
		return nil, err
	}

	if s.auditSvc != nil {
		s.auditSvc.RecordLog(&actorID, "create_warehouse", fmt.Sprintf("Membuat gudang baru: %s (%s)", wh.Name, wh.Code))
	}

	return wh, nil
}

func (s *warehouseService) UpdateWarehouse(actorID uint64, id uint64, dto CreateWarehouseDTO) (*models.Warehouse, error) {
	wh, err := s.repo.GetWarehouseByID(id)
	if err != nil {
		return nil, err
	}

	wh.Name = dto.Name
	wh.Type = dto.Type
	wh.Location = dto.Location
	wh.Address = dto.Address
	wh.CapacityM3 = dto.CapacityM3
	wh.ManagerName = dto.ManagerName
	wh.IsActive = dto.IsActive

	if err := s.repo.UpdateWarehouse(wh); err != nil {
		return nil, err
	}

	if s.auditSvc != nil {
		s.auditSvc.RecordLog(&actorID, "update_warehouse", fmt.Sprintf("Memperbarui gudang: %s", wh.Name))
	}

	return wh, nil
}

func (s *warehouseService) DeleteWarehouse(actorID uint64, id uint64) error {
	if err := s.repo.DeleteWarehouse(id); err != nil {
		return err
	}
	if s.auditSvc != nil {
		s.auditSvc.RecordLog(&actorID, "delete_warehouse", fmt.Sprintf("Menghapus gudang ID %d", id))
	}
	return nil
}

// ----------------- Stock Transfers -----------------
func (s *warehouseService) ListStockTransfers(tenantID uint64, search string) ([]models.StockTransfer, error) {
	return s.repo.ListStockTransfers(tenantID, search)
}

func (s *warehouseService) GetStockTransferByID(id uint64) (*models.StockTransfer, error) {
	return s.repo.GetStockTransferByID(id)
}

func (s *warehouseService) CreateStockTransfer(actorID uint64, dto CreateStockTransferDTO) (*models.StockTransfer, error) {
	if dto.FromWarehouseID == 0 || dto.ToWarehouseID == 0 {
		return nil, fmt.Errorf("gudang asal dan gudang tujuan harus dipilih")
	}
	if dto.FromWarehouseID == dto.ToWarehouseID {
		return nil, fmt.Errorf("gudang asal dan tujuan tidak boleh sama")
	}
	if len(dto.Items) == 0 {
		return nil, fmt.Errorf("minimal 1 barang harus ditransfer")
	}

	trfNumber := fmt.Sprintf("TRF-%s-%04d", time.Now().Format("20060102"), time.Now().UnixNano()%10000)

	st := &models.StockTransfer{
		TenantID:        dto.TenantID,
		TransferNumber:  trfNumber,
		FromWarehouseID: dto.FromWarehouseID,
		ToWarehouseID:   dto.ToWarehouseID,
		TransferDate:    time.Now(),
		DriverName:      dto.DriverName,
		VehicleNumber:   dto.VehicleNumber,
		Notes:           dto.Notes,
		Status:          "in_transit",
		CreatedBy:       actorID,
	}

	for _, it := range dto.Items {
		st.Items = append(st.Items, models.StockTransferItem{
			MaterialID:     it.MaterialID,
			RequestedQty:   it.RequestedQty,
			TransferredQty: it.RequestedQty,
			UnitCost:       it.UnitCost,
		})
	}

	if err := s.repo.CreateStockTransfer(st); err != nil {
		return nil, err
	}

	if s.auditSvc != nil {
		s.auditSvc.RecordLog(&actorID, "create_stock_transfer", fmt.Sprintf("Membuat mutasi transfer stok: %s", st.TransferNumber))
	}

	return st, nil
}

func (s *warehouseService) CompleteStockTransfer(actorID uint64, id uint64) error {
	if err := s.repo.CompleteStockTransfer(id); err != nil {
		return err
	}
	if s.auditSvc != nil {
		s.auditSvc.RecordLog(&actorID, "complete_stock_transfer", fmt.Sprintf("Menyelesaikan transfer stok ID %d", id))
	}
	return nil
}

func (s *warehouseService) CancelStockTransfer(actorID uint64, id uint64) error {
	if err := s.repo.CancelStockTransfer(id); err != nil {
		return err
	}
	if s.auditSvc != nil {
		s.auditSvc.RecordLog(&actorID, "cancel_stock_transfer", fmt.Sprintf("Membatalkan transfer stok ID %d", id))
	}
	return nil
}

// ----------------- Stock Adjustments -----------------
func (s *warehouseService) ListStockAdjustments(tenantID uint64) ([]models.StockAdjustment, error) {
	return s.repo.ListStockAdjustments(tenantID)
}

func (s *warehouseService) CreateStockAdjustment(actorID uint64, dto CreateStockAdjustmentDTO) (*models.StockAdjustment, error) {
	if dto.WarehouseID == 0 || dto.MaterialID == 0 {
		return nil, fmt.Errorf("gudang dan material harus dipilih")
	}

	adjNumber := fmt.Sprintf("ADJ-%s-%04d", time.Now().Format("20060102"), time.Now().UnixNano()%10000)
	discrepancy := dto.CountedQty - dto.RecordedQty

	adj := &models.StockAdjustment{
		TenantID:         dto.TenantID,
		AdjustmentNumber: adjNumber,
		WarehouseID:      dto.WarehouseID,
		MaterialID:       dto.MaterialID,
		RecordedQty:      dto.RecordedQty,
		CountedQty:       dto.CountedQty,
		DiscrepancyQty:   discrepancy,
		Reason:           dto.Reason,
		Notes:            dto.Notes,
		Status:           "draft",
		AdjustedBy:       actorID,
	}

	if err := s.repo.CreateStockAdjustment(adj); err != nil {
		return nil, err
	}

	if s.auditSvc != nil {
		s.auditSvc.RecordLog(&actorID, "create_stock_adjustment", fmt.Sprintf("Membuat penyesuaian stok: %s (Selisih: %.2f)", adj.AdjustmentNumber, discrepancy))
	}

	return adj, nil
}

func (s *warehouseService) ApproveStockAdjustment(actorID uint64, id uint64) error {
	if err := s.repo.ApproveStockAdjustment(id, actorID); err != nil {
		return err
	}
	if s.auditSvc != nil {
		s.auditSvc.RecordLog(&actorID, "approve_stock_adjustment", fmt.Sprintf("Menyetujui penyesuaian stok ID %d", id))
	}
	return nil
}
