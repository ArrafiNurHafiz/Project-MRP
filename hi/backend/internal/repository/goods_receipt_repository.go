package repository

import (
	"github.com/kayukwas/tracking-backend/internal/models"
	"gorm.io/gorm"
)

type GoodsReceiptRepository interface {
	Create(gr *models.GoodsReceipt) error
	FindByID(id uint64) (*models.GoodsReceipt, error)
	FindByReceiptNumber(number string) (*models.GoodsReceipt, error)
	FindAll(search, status string, limit, offset int) ([]models.GoodsReceipt, int64, error)
	Update(gr *models.GoodsReceipt) error
	CreateItem(item *models.GoodsReceiptItem) error
}

type goodsReceiptRepository struct {
	db *gorm.DB
}

func NewGoodsReceiptRepository(db *gorm.DB) GoodsReceiptRepository {
	return &goodsReceiptRepository{db: db}
}

func (r *goodsReceiptRepository) Create(gr *models.GoodsReceipt) error {
	return r.db.Create(gr).Error
}

func (r *goodsReceiptRepository) FindByID(id uint64) (*models.GoodsReceipt, error) {
	var gr models.GoodsReceipt
	err := r.db.Preload("PurchaseOrder.Vendor").
		Preload("Warehouse").
		Preload("Vendor").
		Preload("ReceivedByUser").
		Preload("Items.Material").
		Preload("Items.BatchLot").
		First(&gr, id).Error
	if err != nil {
		return nil, err
	}
	return &gr, nil
}

func (r *goodsReceiptRepository) FindByReceiptNumber(number string) (*models.GoodsReceipt, error) {
	var gr models.GoodsReceipt
	err := r.db.Preload("PurchaseOrder").
		Preload("Warehouse").
		Preload("Vendor").
		Preload("Items.Material").
		Where("receipt_number = ?", number).First(&gr).Error
	if err != nil {
		return nil, err
	}
	return &gr, nil
}

func (r *goodsReceiptRepository) FindAll(search, status string, limit, offset int) ([]models.GoodsReceipt, int64, error) {
	var receipts []models.GoodsReceipt
	var total int64

	q := r.db.Model(&models.GoodsReceipt{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if search != "" {
		s := "%" + search + "%"
		q = q.Where("receipt_number LIKE ? OR vendor_delivery_note LIKE ?", s, s)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := q.Preload("PurchaseOrder").
		Preload("Warehouse").
		Preload("Vendor").
		Preload("ReceivedByUser").
		Preload("Items.Material").
		Order("id DESC").
		Limit(limit).
		Offset(offset).
		Find(&receipts).Error

	return receipts, total, err
}

func (r *goodsReceiptRepository) Update(gr *models.GoodsReceipt) error {
	return r.db.Save(gr).Error
}

func (r *goodsReceiptRepository) CreateItem(item *models.GoodsReceiptItem) error {
	return r.db.Create(item).Error
}
