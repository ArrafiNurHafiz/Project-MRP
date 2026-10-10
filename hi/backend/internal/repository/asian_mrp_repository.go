package repository

import (
	"github.com/kayukwas/tracking-backend/internal/models"
	"gorm.io/gorm"
)

type AsianMRPExtensionsRepository interface {
	// Landed Cost
	ListLandedCosts(limit, offset int) ([]models.LandedCost, int64, error)
	GetLandedCostByID(id uint64) (*models.LandedCost, error)
	CreateLandedCost(lc *models.LandedCost) error
	UpdateLandedCost(lc *models.LandedCost) error

	// Subcontract Reconciliation
	ListSubcontractReconciliations(mitraID uint64, status string, limit, offset int) ([]models.SubcontractReconciliation, int64, error)
	GetSubcontractReconciliationByID(id uint64) (*models.SubcontractReconciliation, error)
	CreateSubcontractReconciliation(rec *models.SubcontractReconciliation) error
	UpdateSubcontractStatus(id uint64, status string) error

	// Overhead Absorption
	ListOverheadAbsorptions(limit, offset int) ([]models.OverheadAbsorption, int64, error)
	CreateOverheadAbsorption(ov *models.OverheadAbsorption) error
}

type asianMRPExtensionsRepository struct {
	db *gorm.DB
}

func NewAsianMRPExtensionsRepository(db *gorm.DB) AsianMRPExtensionsRepository {
	return &asianMRPExtensionsRepository{db: db}
}

// ----------------- Landed Cost -----------------
func (r *asianMRPExtensionsRepository) ListLandedCosts(limit, offset int) ([]models.LandedCost, int64, error) {
	var list []models.LandedCost
	var total int64
	q := r.db.Model(&models.LandedCost{}).Preload("PurchaseOrder.Vendor").Preload("Items.Material")
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *asianMRPExtensionsRepository) GetLandedCostByID(id uint64) (*models.LandedCost, error) {
	var lc models.LandedCost
	err := r.db.Preload("PurchaseOrder.Vendor").Preload("Items.Material").First(&lc, id).Error
	return &lc, err
}

func (r *asianMRPExtensionsRepository) CreateLandedCost(lc *models.LandedCost) error {
	return r.db.Create(lc).Error
}

func (r *asianMRPExtensionsRepository) UpdateLandedCost(lc *models.LandedCost) error {
	return r.db.Save(lc).Error
}

// ----------------- Subcontract Reconciliation -----------------
func (r *asianMRPExtensionsRepository) ListSubcontractReconciliations(mitraID uint64, status string, limit, offset int) ([]models.SubcontractReconciliation, int64, error) {
	var list []models.SubcontractReconciliation
	var total int64
	q := r.db.Model(&models.SubcontractReconciliation{}).Preload("MitraUser").Preload("WorkOrder.Product")
	if mitraID > 0 {
		q = q.Where("mitra_user_id = ?", mitraID)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *asianMRPExtensionsRepository) GetSubcontractReconciliationByID(id uint64) (*models.SubcontractReconciliation, error) {
	var rec models.SubcontractReconciliation
	err := r.db.Preload("MitraUser").Preload("WorkOrder.Product").First(&rec, id).Error
	return &rec, err
}

func (r *asianMRPExtensionsRepository) CreateSubcontractReconciliation(rec *models.SubcontractReconciliation) error {
	return r.db.Create(rec).Error
}

func (r *asianMRPExtensionsRepository) UpdateSubcontractStatus(id uint64, status string) error {
	return r.db.Model(&models.SubcontractReconciliation{}).Where("id = ?", id).Update("status", status).Error
}

// ----------------- Overhead Absorption -----------------
func (r *asianMRPExtensionsRepository) ListOverheadAbsorptions(limit, offset int) ([]models.OverheadAbsorption, int64, error) {
	var list []models.OverheadAbsorption
	var total int64
	q := r.db.Model(&models.OverheadAbsorption{})
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("period_month DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *asianMRPExtensionsRepository) CreateOverheadAbsorption(ov *models.OverheadAbsorption) error {
	return r.db.Create(ov).Error
}
