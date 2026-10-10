package repository

import (
	"github.com/kayukwas/tracking-backend/internal/models"
	"gorm.io/gorm"
)

type CustomerRepository interface {
	FindAll(search string, limit, offset int) ([]models.Customer, int64, error)
	FindByID(id uint64) (*models.Customer, error)
	Create(customer *models.Customer) error
	Update(customer *models.Customer) error
	Delete(id uint64) error
}

type VendorRepository interface {
	FindAll(search string, limit, offset int) ([]models.Vendor, int64, error)
	FindByID(id uint64) (*models.Vendor, error)
	Create(vendor *models.Vendor) error
	Update(vendor *models.Vendor) error
	Delete(id uint64) error
}

type QuotationRepository interface {
	FindAll(status, search string, limit, offset int) ([]models.Quotation, int64, error)
	FindByID(id uint64) (*models.Quotation, error)
	FindByPublicToken(token string) (*models.Quotation, error)
	Create(quote *models.Quotation) error
	Update(quote *models.Quotation) error
	UpdateStatus(id uint64, status string) error
	Delete(id uint64) error
}

type SalesOrderRepository interface {
	FindAll(status, priority, search string, limit, offset int) ([]models.SalesOrder, int64, error)
	FindByID(id uint64) (*models.SalesOrder, error)
	Create(so *models.SalesOrder) error
	Update(so *models.SalesOrder) error
	UpdateStatus(id uint64, status string) error
}

type MaterialRequestRepository interface {
	FindAll(status string, limit, offset int) ([]models.MaterialRequest, int64, error)
	FindByID(id uint64) (*models.MaterialRequest, error)
	FindByWorkOrderID(woID uint64) (*models.MaterialRequest, error)
	Create(mr *models.MaterialRequest) error
	Update(mr *models.MaterialRequest) error
	UpdateStatus(id uint64, status string) error
}

type PurchaseOrderRepository interface {
	FindAll(status, search string, limit, offset int) ([]models.PurchaseOrder, int64, error)
	FindByID(id uint64) (*models.PurchaseOrder, error)
	Create(po *models.PurchaseOrder) error
	Update(po *models.PurchaseOrder) error
	UpdateStatus(id uint64, status string) error
}

type InvoiceRepository interface {
	FindAll(status, search string, limit, offset int) ([]models.Invoice, int64, error)
	FindByID(id uint64) (*models.Invoice, error)
	Create(inv *models.Invoice) error
	Update(inv *models.Invoice) error
}

// ---------------- Implementation ----------------

type customerRepository struct {
	db *gorm.DB
}

func NewCustomerRepository(db *gorm.DB) CustomerRepository {
	return &customerRepository{db: db}
}

func (r *customerRepository) FindAll(search string, limit, offset int) ([]models.Customer, int64, error) {
	var list []models.Customer
	var total int64
	q := r.db.Model(&models.Customer{}).Preload("PICs")
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("name LIKE ? OR email LIKE ? OR phone LIKE ?", like, like, like)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("id DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *customerRepository) FindByID(id uint64) (*models.Customer, error) {
	var c models.Customer
	err := r.db.Preload("PICs").First(&c, id).Error
	return &c, err
}

func (r *customerRepository) Create(customer *models.Customer) error {
	return r.db.Create(customer).Error
}

func (r *customerRepository) Update(customer *models.Customer) error {
	return r.db.Save(customer).Error
}

func (r *customerRepository) Delete(id uint64) error {
	return r.db.Delete(&models.Customer{}, id).Error
}

// Vendor Repo
type vendorRepository struct {
	db *gorm.DB
}

func NewVendorRepository(db *gorm.DB) VendorRepository {
	return &vendorRepository{db: db}
}

func (r *vendorRepository) FindAll(search string, limit, offset int) ([]models.Vendor, int64, error) {
	var list []models.Vendor
	var total int64
	q := r.db.Model(&models.Vendor{})
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("name LIKE ? OR alias LIKE ? OR pic_name LIKE ?", like, like, like)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("id DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *vendorRepository) FindByID(id uint64) (*models.Vendor, error) {
	var v models.Vendor
	err := r.db.First(&v, id).Error
	return &v, err
}

func (r *vendorRepository) Create(vendor *models.Vendor) error {
	return r.db.Create(vendor).Error
}

func (r *vendorRepository) Update(vendor *models.Vendor) error {
	return r.db.Save(vendor).Error
}

func (r *vendorRepository) Delete(id uint64) error {
	return r.db.Delete(&models.Vendor{}, id).Error
}

// Quotation Repo
type quotationRepository struct {
	db *gorm.DB
}

func NewQuotationRepository(db *gorm.DB) QuotationRepository {
	return &quotationRepository{db: db}
}

func (r *quotationRepository) FindAll(status, search string, limit, offset int) ([]models.Quotation, int64, error) {
	var list []models.Quotation
	var total int64
	q := r.db.Model(&models.Quotation{}).Preload("Customer").Preload("CreatedByUser").Preload("Items.Product")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("quote_number LIKE ?", like)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("id DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *quotationRepository) FindByID(id uint64) (*models.Quotation, error) {
	var quote models.Quotation
	err := r.db.Preload("Customer.PICs").Preload("CreatedByUser").Preload("Items.Product").First(&quote, id).Error
	return &quote, err
}

func (r *quotationRepository) FindByPublicToken(token string) (*models.Quotation, error) {
	var quote models.Quotation
	err := r.db.Preload("Customer.PICs").Preload("CreatedByUser").Preload("Items.Product").Where("public_token = ?", token).First(&quote).Error
	return &quote, err
}

func (r *quotationRepository) Create(quote *models.Quotation) error {
	return r.db.Create(quote).Error
}

func (r *quotationRepository) Update(quote *models.Quotation) error {
	return r.db.Save(quote).Error
}

func (r *quotationRepository) UpdateStatus(id uint64, status string) error {
	return r.db.Model(&models.Quotation{}).Where("id = ?", id).Update("status", status).Error
}

func (r *quotationRepository) Delete(id uint64) error {
	return r.db.Delete(&models.Quotation{}, id).Error
}

// SalesOrder Repo
type salesOrderRepository struct {
	db *gorm.DB
}

func NewSalesOrderRepository(db *gorm.DB) SalesOrderRepository {
	return &salesOrderRepository{db: db}
}

func (r *salesOrderRepository) FindAll(status, priority, search string, limit, offset int) ([]models.SalesOrder, int64, error) {
	var list []models.SalesOrder
	var total int64
	q := r.db.Model(&models.SalesOrder{}).Preload("Customer").Preload("Quotation").Preload("CreatedByUser").Preload("Items.Product")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if priority != "" {
		q = q.Where("priority = ?", priority)
	}
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("order_number LIKE ?", like)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("id DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *salesOrderRepository) FindByID(id uint64) (*models.SalesOrder, error) {
	var so models.SalesOrder
	err := r.db.Preload("Customer.PICs").Preload("Quotation").Preload("CreatedByUser").Preload("Items.Product.BOMItems.Material").First(&so, id).Error
	return &so, err
}

func (r *salesOrderRepository) Create(so *models.SalesOrder) error {
	return r.db.Create(so).Error
}

func (r *salesOrderRepository) Update(so *models.SalesOrder) error {
	return r.db.Save(so).Error
}

func (r *salesOrderRepository) UpdateStatus(id uint64, status string) error {
	return r.db.Model(&models.SalesOrder{}).Where("id = ?", id).Update("status", status).Error
}

// MaterialRequest Repo
type materialRequestRepository struct {
	db *gorm.DB
}

func NewMaterialRequestRepository(db *gorm.DB) MaterialRequestRepository {
	return &materialRequestRepository{db: db}
}

func (r *materialRequestRepository) FindAll(status string, limit, offset int) ([]models.MaterialRequest, int64, error) {
	var list []models.MaterialRequest
	var total int64
	q := r.db.Model(&models.MaterialRequest{}).
		Preload("WorkOrder.Product").
		Preload("RequestedBy").
		Preload("CheckedBy").
		Preload("Items.Material")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("id DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *materialRequestRepository) FindByID(id uint64) (*models.MaterialRequest, error) {
	var mr models.MaterialRequest
	err := r.db.Preload("WorkOrder.Product").
		Preload("RequestedBy").
		Preload("CheckedBy").
		Preload("Items.Material").
		First(&mr, id).Error
	return &mr, err
}

func (r *materialRequestRepository) FindByWorkOrderID(woID uint64) (*models.MaterialRequest, error) {
	var mr models.MaterialRequest
	err := r.db.Preload("WorkOrder.Product").
		Preload("RequestedBy").
		Preload("CheckedBy").
		Preload("Items.Material").
		Where("work_order_id = ?", woID).First(&mr).Error
	return &mr, err
}

func (r *materialRequestRepository) Create(mr *models.MaterialRequest) error {
	return r.db.Create(mr).Error
}

func (r *materialRequestRepository) Update(mr *models.MaterialRequest) error {
	if err := r.db.Save(mr).Error; err != nil {
		return err
	}
	for i := range mr.Items {
		if err := r.db.Save(&mr.Items[i]).Error; err != nil {
			return err
		}
	}
	return nil
}

func (r *materialRequestRepository) UpdateStatus(id uint64, status string) error {
	return r.db.Model(&models.MaterialRequest{}).Where("id = ?", id).Update("status", status).Error
}

// PurchaseOrder Repo
type purchaseOrderRepository struct {
	db *gorm.DB
}

func NewPurchaseOrderRepository(db *gorm.DB) PurchaseOrderRepository {
	return &purchaseOrderRepository{db: db}
}

func (r *purchaseOrderRepository) FindAll(status, search string, limit, offset int) ([]models.PurchaseOrder, int64, error) {
	var list []models.PurchaseOrder
	var total int64
	q := r.db.Model(&models.PurchaseOrder{}).Preload("Vendor").Preload("CreatedByUser").Preload("Items.Material")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("po_number LIKE ?", like)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("id DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *purchaseOrderRepository) FindByID(id uint64) (*models.PurchaseOrder, error) {
	var po models.PurchaseOrder
	err := r.db.Preload("Vendor").Preload("CreatedByUser").Preload("Items.Material").First(&po, id).Error
	return &po, err
}

func (r *purchaseOrderRepository) Create(po *models.PurchaseOrder) error {
	return r.db.Create(po).Error
}

func (r *purchaseOrderRepository) Update(po *models.PurchaseOrder) error {
	return r.db.Save(po).Error
}

func (r *purchaseOrderRepository) UpdateStatus(id uint64, status string) error {
	return r.db.Model(&models.PurchaseOrder{}).Where("id = ?", id).Update("status", status).Error
}

// Invoice Repo
type invoiceRepository struct {
	db *gorm.DB
}

func NewInvoiceRepository(db *gorm.DB) InvoiceRepository {
	return &invoiceRepository{db: db}
}

func (r *invoiceRepository) FindAll(status, search string, limit, offset int) ([]models.Invoice, int64, error) {
	var list []models.Invoice
	var total int64
	q := r.db.Model(&models.Invoice{}).Preload("SalesOrder.Customer")
	if status != "" {
		q = q.Where("payment_status = ?", status)
	}
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("invoice_number LIKE ?", like)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("id DESC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}

func (r *invoiceRepository) FindByID(id uint64) (*models.Invoice, error) {
	var inv models.Invoice
	err := r.db.Preload("SalesOrder.Customer").Preload("SalesOrder.Items.Product").First(&inv, id).Error
	return &inv, err
}

func (r *invoiceRepository) Create(inv *models.Invoice) error {
	return r.db.Create(inv).Error
}

func (r *invoiceRepository) Update(inv *models.Invoice) error {
	return r.db.Save(inv).Error
}
