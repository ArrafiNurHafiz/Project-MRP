package repository

import (
	"github.com/kayukwas/tracking-backend/internal/models"
	"gorm.io/gorm"
)

type RFQRepository interface {
	FindAll(submissionStatus, processingStatus, search string, limit, offset int) ([]models.RFQ, int64, error)
	FindByID(id uint64) (*models.RFQ, error)
	Create(rfq *models.RFQ) error
	Update(rfq *models.RFQ) error
	UpdateStatus(id uint64, subStatus, procStatus string) error
	Delete(id uint64) error
}

type CurrencyRepository interface {
	FindAll() ([]models.CurrencyFX, error)
	FindByID(id uint64) (*models.CurrencyFX, error)
	FindByCode(code string) (*models.CurrencyFX, error)
	UpdateRate(code string, rate float64) error
}

type CompanySettingRepository interface {
	GetSetting() (*models.CompanySetting, error)
	UpdateSetting(s *models.CompanySetting) error
}

// ---------------- Implementations ----------------

type rfqRepository struct {
	db *gorm.DB
}

func NewRFQRepository(db *gorm.DB) RFQRepository {
	return &rfqRepository{db: db}
}

func (r *rfqRepository) FindAll(submissionStatus, processingStatus, search string, limit, offset int) ([]models.RFQ, int64, error) {
	var list []models.RFQ
	var total int64
	q := r.db.Model(&models.RFQ{}).Preload("Customer.PICs").Preload("Items.Product")
	if submissionStatus != "" {
		q = q.Where("submission_status = ?", submissionStatus)
	}
	if processingStatus != "" {
		q = q.Where("processing_status = ?", processingStatus)
	}
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("rfq_number LIKE ?", like)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("id DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *rfqRepository) FindByID(id uint64) (*models.RFQ, error) {
	var rfq models.RFQ
	err := r.db.Preload("Customer.PICs").Preload("Items.Product").First(&rfq, id).Error
	return &rfq, err
}

func (r *rfqRepository) Create(rfq *models.RFQ) error {
	return r.db.Create(rfq).Error
}

func (r *rfqRepository) Update(rfq *models.RFQ) error {
	return r.db.Save(rfq).Error
}

func (r *rfqRepository) UpdateStatus(id uint64, subStatus, procStatus string) error {
	updates := make(map[string]interface{})
	if subStatus != "" {
		updates["submission_status"] = subStatus
	}
	if procStatus != "" {
		updates["processing_status"] = procStatus
	}
	return r.db.Model(&models.RFQ{}).Where("id = ?", id).Updates(updates).Error
}

func (r *rfqRepository) Delete(id uint64) error {
	return r.db.Delete(&models.RFQ{}, id).Error
}

// Currency Repo
type currencyRepository struct {
	db *gorm.DB
}

func NewCurrencyRepository(db *gorm.DB) CurrencyRepository {
	return &currencyRepository{db: db}
}

func (r *currencyRepository) FindAll() ([]models.CurrencyFX, error) {
	var list []models.CurrencyFX
	err := r.db.Order("id ASC").Find(&list).Error
	return list, err
}

func (r *currencyRepository) FindByID(id uint64) (*models.CurrencyFX, error) {
	var c models.CurrencyFX
	err := r.db.First(&c, id).Error
	return &c, err
}

func (r *currencyRepository) FindByCode(code string) (*models.CurrencyFX, error) {
	var c models.CurrencyFX
	err := r.db.Where("code = ?", code).First(&c).Error
	return &c, err
}

func (r *currencyRepository) UpdateRate(code string, rate float64) error {
	return r.db.Model(&models.CurrencyFX{}).Where("code = ?", code).Update("exchange_rate", rate).Error
}

// Company Setting Repo
type companySettingRepository struct {
	db *gorm.DB
}

func NewCompanySettingRepository(db *gorm.DB) CompanySettingRepository {
	return &companySettingRepository{db: db}
}

func (r *companySettingRepository) GetSetting() (*models.CompanySetting, error) {
	var s models.CompanySetting
	err := r.db.First(&s).Error
	return &s, err
}

func (r *companySettingRepository) UpdateSetting(s *models.CompanySetting) error {
	return r.db.Save(s).Error
}

// ---------------- CPR Repository ----------------

type CPRRepository interface {
	FindAll(status, search string, limit, offset int) ([]models.CustomProductRequest, int64, error)
	FindByID(id uint64) (*models.CustomProductRequest, error)
	Create(cpr *models.CustomProductRequest) error
	Update(cpr *models.CustomProductRequest) error
	UpdateStatus(id uint64, status string) error
	Delete(id uint64) error
	SaveMaterials(cprID uint64, items []models.CPRMaterialItem) error
	SaveRoutings(cprID uint64, stages []models.CPRRoutingStage) error
}

type cprRepository struct {
	db *gorm.DB
}

func NewCPRRepository(db *gorm.DB) CPRRepository {
	return &cprRepository{db: db}
}

func (r *cprRepository) FindAll(status, search string, limit, offset int) ([]models.CustomProductRequest, int64, error) {
	var list []models.CustomProductRequest
	var total int64
	q := r.db.Model(&models.CustomProductRequest{}).
		Preload("Customer").
		Preload("RFQ").
		Preload("AssignedEng").
		Preload("Materials.Material").
		Preload("Routings.Station")

	if status != "" {
		q = q.Where("status = ?", status)
	}
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("cpr_number LIKE ? OR product_name LIKE ?", like, like)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("id DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *cprRepository) FindByID(id uint64) (*models.CustomProductRequest, error) {
	var cpr models.CustomProductRequest
	err := r.db.
		Preload("Customer.PICs").
		Preload("RFQ").
		Preload("AssignedEng").
		Preload("Materials.Material").
		Preload("Routings.Station").
		First(&cpr, id).Error
	return &cpr, err
}

func (r *cprRepository) Create(cpr *models.CustomProductRequest) error {
	return r.db.Create(cpr).Error
}

func (r *cprRepository) Update(cpr *models.CustomProductRequest) error {
	return r.db.Save(cpr).Error
}

func (r *cprRepository) UpdateStatus(id uint64, status string) error {
	return r.db.Model(&models.CustomProductRequest{}).Where("id = ?", id).Update("status", status).Error
}

func (r *cprRepository) Delete(id uint64) error {
	_ = r.db.Where("cpr_id = ?", id).Delete(&models.CPRMaterialItem{}).Error
	_ = r.db.Where("cpr_id = ?", id).Delete(&models.CPRRoutingStage{}).Error
	return r.db.Delete(&models.CustomProductRequest{}, id).Error
}

func (r *cprRepository) SaveMaterials(cprID uint64, items []models.CPRMaterialItem) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("cpr_id = ?", cprID).Delete(&models.CPRMaterialItem{}).Error; err != nil {
			return err
		}
		for i := range items {
			items[i].CPRID = cprID
			if items[i].Subtotal == 0 {
				items[i].Subtotal = items[i].QtyRequired * items[i].UnitCost
			}
			if err := tx.Create(&items[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *cprRepository) SaveRoutings(cprID uint64, stages []models.CPRRoutingStage) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("cpr_id = ?", cprID).Delete(&models.CPRRoutingStage{}).Error; err != nil {
			return err
		}
		for i := range stages {
			stages[i].CPRID = cprID
			if stages[i].Subtotal == 0 {
				stages[i].Subtotal = stages[i].EstimatedHours * stages[i].HourlyRate
			}
			if err := tx.Create(&stages[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
