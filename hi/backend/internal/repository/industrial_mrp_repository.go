package repository

import (
	"github.com/kayukwas/tracking-backend/internal/models"
	"gorm.io/gorm"
)

type IndustrialMRPRepository interface {
	// Machine Downtime
	ListDowntimes(stationID uint64, limit, offset int) ([]models.MachineDowntime, int64, error)
	CreateDowntime(dt *models.MachineDowntime) error
	CloseDowntime(id uint64, durationMinutes int, actionTaken string) error

	// Rework Orders
	ListReworkOrders(status string, limit, offset int) ([]models.ReworkOrder, int64, error)
	GetReworkOrderByID(id uint64) (*models.ReworkOrder, error)
	CreateReworkOrder(ro *models.ReworkOrder) error
	UpdateReworkProgress(id uint64, recoveredQty, scrappedQty int, status, notes string) error

	// Batch / Lot Tracking
	ListBatchLots(materialID uint64, search string, limit, offset int) ([]models.MaterialBatchLot, int64, error)
	FindAvailableActiveLots(materialID uint64) ([]models.MaterialBatchLot, error)
	CreateBatchLot(lot *models.MaterialBatchLot) error
	DeductBatchStock(batchNumber string, qtyDelta float64) error
}

type industrialMRPRepository struct {
	db *gorm.DB
}

func NewIndustrialMRPRepository(db *gorm.DB) IndustrialMRPRepository {
	return &industrialMRPRepository{db: db}
}

func (r *industrialMRPRepository) ListDowntimes(stationID uint64, limit, offset int) ([]models.MachineDowntime, int64, error) {
	var list []models.MachineDowntime
	var total int64
	q := r.db.Model(&models.MachineDowntime{}).Preload("Station").Preload("ReportedByUser")
	if stationID > 0 {
		q = q.Where("station_id = ?", stationID)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *industrialMRPRepository) CreateDowntime(dt *models.MachineDowntime) error {
	return r.db.Create(dt).Error
}

func (r *industrialMRPRepository) CloseDowntime(id uint64, durationMinutes int, actionTaken string) error {
	return r.db.Model(&models.MachineDowntime{}).Where("id = ?", id).Updates(map[string]interface{}{
		"duration_minutes": durationMinutes,
		"action_taken":     actionTaken,
		"end_time":         gorm.Expr("CURRENT_TIMESTAMP"),
	}).Error
}

func (r *industrialMRPRepository) ListReworkOrders(status string, limit, offset int) ([]models.ReworkOrder, int64, error) {
	var list []models.ReworkOrder
	var total int64
	q := r.db.Model(&models.ReworkOrder{}).Preload("WorkOrder.Product").Preload("SourceStation").Preload("TargetStation").Preload("AssignedMitra")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *industrialMRPRepository) GetReworkOrderByID(id uint64) (*models.ReworkOrder, error) {
	var ro models.ReworkOrder
	err := r.db.Preload("WorkOrder.Product").Preload("SourceStation").Preload("TargetStation").Preload("AssignedMitra").First(&ro, id).Error
	return &ro, err
}

func (r *industrialMRPRepository) CreateReworkOrder(ro *models.ReworkOrder) error {
	return r.db.Create(ro).Error
}

func (r *industrialMRPRepository) UpdateReworkProgress(id uint64, recoveredQty, scrappedQty int, status, notes string) error {
	updates := map[string]interface{}{
		"recovered_qty": recoveredQty,
		"scrapped_qty":  scrappedQty,
		"status":        status,
		"notes":         notes,
	}
	return r.db.Model(&models.ReworkOrder{}).Where("id = ?", id).Updates(updates).Error
}

func (r *industrialMRPRepository) ListBatchLots(materialID uint64, search string, limit, offset int) ([]models.MaterialBatchLot, int64, error) {
	var list []models.MaterialBatchLot
	var total int64
	q := r.db.Model(&models.MaterialBatchLot{}).Preload("Material").Preload("Vendor")
	if materialID > 0 {
		q = q.Where("material_id = ?", materialID)
	}
	if search != "" {
		q = q.Where("batch_number LIKE ? OR wood_origin LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("received_date DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *industrialMRPRepository) FindAvailableActiveLots(materialID uint64) ([]models.MaterialBatchLot, error) {
	var list []models.MaterialBatchLot
	err := r.db.Where("material_id = ? AND qc_status = 'PASSED' AND remaining_qty > 0", materialID).
		Order("received_date ASC, id ASC").
		Find(&list).Error
	return list, err
}

func (r *industrialMRPRepository) CreateBatchLot(lot *models.MaterialBatchLot) error {
	return r.db.Create(lot).Error
}

func (r *industrialMRPRepository) DeductBatchStock(batchNumber string, qtyDelta float64) error {
	return r.db.Model(&models.MaterialBatchLot{}).Where("batch_number = ?", batchNumber).
		Update("remaining_qty", gorm.Expr("remaining_qty - ?", qtyDelta)).Error
}
