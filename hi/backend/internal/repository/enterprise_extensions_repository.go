package repository

import (
	"github.com/kayukwas/tracking-backend/internal/models"
	"gorm.io/gorm"
)

type EnterpriseExtensionsRepository interface {
	// ECO
	ListECOs(status string, limit, offset int) ([]models.EngineeringChangeOrder, int64, error)
	GetECOByID(id uint64) (*models.EngineeringChangeOrder, error)
	CreateECO(eco *models.EngineeringChangeOrder) error
	UpdateECOStatus(id uint64, status string, approverID uint64) error

	// Shopfloor Kiosk
	ListShopFloorLogs(wosID uint64, status string, limit, offset int) ([]models.ShopFloorLog, int64, error)
	ClockInShopFloor(log *models.ShopFloorLog) error
	ClockOutShopFloor(id uint64, durationMinutes, goodQty, scrapQty int) error

	// Maintenance
	ListMaintenanceTasks(status, taskType string, limit, offset int) ([]models.MaintenanceTask, int64, error)
	CreateMaintenanceTask(t *models.MaintenanceTask) error
	CompleteMaintenanceTask(id uint64, actionLog string) error

	// Unbuild / Disassembly
	ListUnbuildOrders(limit, offset int) ([]models.UnbuildOrder, int64, error)
	GetUnbuildByID(id uint64) (*models.UnbuildOrder, error)
	CreateUnbuildOrder(ub *models.UnbuildOrder) error
	ExecuteUnbuild(id uint64) error
}

type enterpriseExtensionsRepository struct {
	db *gorm.DB
}

func NewEnterpriseExtensionsRepository(db *gorm.DB) EnterpriseExtensionsRepository {
	return &enterpriseExtensionsRepository{db: db}
}

// ----------------- ECO -----------------
func (r *enterpriseExtensionsRepository) ListECOs(status string, limit, offset int) ([]models.EngineeringChangeOrder, int64, error) {
	var list []models.EngineeringChangeOrder
	var total int64
	q := r.db.Model(&models.EngineeringChangeOrder{}).Preload("Product").Preload("ApprovedByUser").Preload("Items.Material")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *enterpriseExtensionsRepository) GetECOByID(id uint64) (*models.EngineeringChangeOrder, error) {
	var eco models.EngineeringChangeOrder
	err := r.db.Preload("Product").Preload("ApprovedByUser").Preload("Items.Material").First(&eco, id).Error
	return &eco, err
}

func (r *enterpriseExtensionsRepository) CreateECO(eco *models.EngineeringChangeOrder) error {
	return r.db.Create(eco).Error
}

func (r *enterpriseExtensionsRepository) UpdateECOStatus(id uint64, status string, approverID uint64) error {
	updates := map[string]interface{}{
		"status": status,
	}
	if approverID > 0 {
		updates["approved_by_user_id"] = approverID
	}
	return r.db.Model(&models.EngineeringChangeOrder{}).Where("id = ?", id).Updates(updates).Error
}

// ----------------- ShopFloor Kiosk -----------------
func (r *enterpriseExtensionsRepository) ListShopFloorLogs(wosID uint64, status string, limit, offset int) ([]models.ShopFloorLog, int64, error) {
	var list []models.ShopFloorLog
	var total int64
	q := r.db.Model(&models.ShopFloorLog{}).Preload("WorkOrderStation.Station").Preload("WorkOrderStation.WorkOrder.Product").Preload("OperatorUser")
	if wosID > 0 {
		q = q.Where("work_order_station_id = ?", wosID)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("clock_in_time DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *enterpriseExtensionsRepository) ClockInShopFloor(log *models.ShopFloorLog) error {
	return r.db.Create(log).Error
}

func (r *enterpriseExtensionsRepository) ClockOutShopFloor(id uint64, durationMinutes, goodQty, scrapQty int) error {
	return r.db.Model(&models.ShopFloorLog{}).Where("id = ?", id).Updates(map[string]interface{}{
		"clock_out_time":    gorm.Expr("CURRENT_TIMESTAMP"),
		"duration_minutes":   durationMinutes,
		"good_qty_produced":  goodQty,
		"scrap_qty_produced": scrapQty,
		"status":             "COMPLETED",
	}).Error
}

// ----------------- Maintenance -----------------
func (r *enterpriseExtensionsRepository) ListMaintenanceTasks(status, taskType string, limit, offset int) ([]models.MaintenanceTask, int64, error) {
	var list []models.MaintenanceTask
	var total int64
	q := r.db.Model(&models.MaintenanceTask{}).Preload("Station").Preload("TechnicianUser")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if taskType != "" {
		q = q.Where("task_type = ?", taskType)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("scheduled_date ASC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *enterpriseExtensionsRepository) CreateMaintenanceTask(t *models.MaintenanceTask) error {
	return r.db.Create(t).Error
}

func (r *enterpriseExtensionsRepository) CompleteMaintenanceTask(id uint64, actionLog string) error {
	return r.db.Model(&models.MaintenanceTask{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":         "COMPLETED",
		"completed_date": gorm.Expr("CURRENT_TIMESTAMP"),
		"action_log":     actionLog,
	}).Error
}

// ----------------- Unbuild -----------------
func (r *enterpriseExtensionsRepository) ListUnbuildOrders(limit, offset int) ([]models.UnbuildOrder, int64, error) {
	var list []models.UnbuildOrder
	var total int64
	q := r.db.Model(&models.UnbuildOrder{}).Preload("Product").Preload("PerformedByUser").Preload("RecoveredItems.Material")
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *enterpriseExtensionsRepository) GetUnbuildByID(id uint64) (*models.UnbuildOrder, error) {
	var ub models.UnbuildOrder
	err := r.db.Preload("Product").Preload("PerformedByUser").Preload("RecoveredItems.Material").First(&ub, id).Error
	return &ub, err
}

func (r *enterpriseExtensionsRepository) CreateUnbuildOrder(ub *models.UnbuildOrder) error {
	return r.db.Create(ub).Error
}

func (r *enterpriseExtensionsRepository) ExecuteUnbuild(id uint64) error {
	return r.db.Model(&models.UnbuildOrder{}).Where("id = ?", id).Update("status", "DISASSEMBLED").Error
}
