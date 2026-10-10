package repository

import (
	"github.com/kayukwas/tracking-backend/internal/models"
	"gorm.io/gorm"
)

type DeliveryOrderRepository interface {
	Create(do *models.DeliveryOrder) error
	FindByID(id uint64) (*models.DeliveryOrder, error)
	FindByDONumber(number string) (*models.DeliveryOrder, error)
	FindAll(search, status string, limit, offset int) ([]models.DeliveryOrder, int64, error)
	Update(do *models.DeliveryOrder) error
	CreateItem(item *models.DeliveryOrderItem) error
}

type deliveryOrderRepository struct {
	db *gorm.DB
}

func NewDeliveryOrderRepository(db *gorm.DB) DeliveryOrderRepository {
	return &deliveryOrderRepository{db: db}
}

func (r *deliveryOrderRepository) Create(do *models.DeliveryOrder) error {
	return r.db.Create(do).Error
}

func (r *deliveryOrderRepository) FindByID(id uint64) (*models.DeliveryOrder, error) {
	var do models.DeliveryOrder
	err := r.db.Preload("SalesOrder.Customer").
		Preload("Customer").
		Preload("Warehouse").
		Preload("Items.Product").
		First(&do, id).Error
	if err != nil {
		return nil, err
	}
	return &do, nil
}

func (r *deliveryOrderRepository) FindByDONumber(number string) (*models.DeliveryOrder, error) {
	var do models.DeliveryOrder
	err := r.db.Preload("SalesOrder").
		Preload("Customer").
		Preload("Warehouse").
		Preload("Items.Product").
		Where("do_number = ?", number).First(&do).Error
	if err != nil {
		return nil, err
	}
	return &do, nil
}

func (r *deliveryOrderRepository) FindAll(search, status string, limit, offset int) ([]models.DeliveryOrder, int64, error) {
	var orders []models.DeliveryOrder
	var total int64

	q := r.db.Model(&models.DeliveryOrder{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if search != "" {
		s := "%" + search + "%"
		q = q.Where("do_number LIKE ? OR driver_name LIKE ? OR vehicle_plate LIKE ? OR tracking_number LIKE ?", s, s, s, s)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := q.Preload("SalesOrder").
		Preload("Customer").
		Preload("Warehouse").
		Preload("Items.Product").
		Order("id DESC").
		Limit(limit).
		Offset(offset).
		Find(&orders).Error

	return orders, total, err
}

func (r *deliveryOrderRepository) Update(do *models.DeliveryOrder) error {
	return r.db.Save(do).Error
}

func (r *deliveryOrderRepository) CreateItem(item *models.DeliveryOrderItem) error {
	return r.db.Create(item).Error
}
