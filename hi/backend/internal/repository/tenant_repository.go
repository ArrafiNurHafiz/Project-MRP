package repository

import (
	"github.com/kayukwas/tracking-backend/internal/models"
	"gorm.io/gorm"
)

type TenantRepository interface {
	FindAll(search, planTier string, limit, offset int) ([]models.Tenant, int64, error)
	FindByID(id uint64) (*models.Tenant, error)
	FindBySlug(slug string) (*models.Tenant, error)
	Create(tenant *models.Tenant) error
	Update(tenant *models.Tenant) error
	Delete(id uint64) error
	GetOverviewStats() (map[string]interface{}, error)
}

type tenantRepository struct {
	db *gorm.DB
}

func NewTenantRepository(db *gorm.DB) TenantRepository {
	return &tenantRepository{db: db}
}

func (r *tenantRepository) FindAll(search, planTier string, limit, offset int) ([]models.Tenant, int64, error) {
	var list []models.Tenant
	var total int64
	q := r.db.Model(&models.Tenant{}).Preload("OwnerUser")
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("name LIKE ? OR slug LIKE ? OR industry LIKE ?", like, like, like)
	}
	if planTier != "" {
		q = q.Where("plan_tier = ?", planTier)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *tenantRepository) FindByID(id uint64) (*models.Tenant, error) {
	var t models.Tenant
	err := r.db.Preload("OwnerUser").First(&t, id).Error
	return &t, err
}

func (r *tenantRepository) FindBySlug(slug string) (*models.Tenant, error) {
	var t models.Tenant
	err := r.db.Preload("OwnerUser").Where("slug = ?", slug).First(&t).Error
	return &t, err
}

func (r *tenantRepository) Create(tenant *models.Tenant) error {
	return r.db.Create(tenant).Error
}

func (r *tenantRepository) Update(tenant *models.Tenant) error {
	return r.db.Save(tenant).Error
}

func (r *tenantRepository) Delete(id uint64) error {
	return r.db.Delete(&models.Tenant{}, id).Error
}

func (r *tenantRepository) GetOverviewStats() (map[string]interface{}, error) {
	var totalTenants int64
	var activeTenants int64
	var mrrTotal float64

	r.db.Model(&models.Tenant{}).Count(&totalTenants)
	r.db.Model(&models.Tenant{}).Where("status = ?", models.TenantStatusActive).Count(&activeTenants)
	r.db.Model(&models.Tenant{}).Where("status = ?", models.TenantStatusActive).Select("COALESCE(SUM(monthly_price), 0)").Scan(&mrrTotal)

	return map[string]interface{}{
		"total_companies": totalTenants,
		"active_clients":  activeTenants,
		"total_mrr_idr":   mrrTotal,
	}, nil
}
