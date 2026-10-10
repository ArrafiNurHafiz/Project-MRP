package models

import (
	"time"
)

// DeliveryOrder represents a physical shipping document (Surat Jalan Pengiriman) to a customer
type DeliveryOrder struct {
	ID              uint64              `gorm:"primaryKey;autoIncrement" json:"id"`
	TenantID        uint64              `gorm:"index;default:1" json:"tenant_id"`
	DONumber        string              `gorm:"type:varchar(100);uniqueIndex;not null" json:"do_number"` // SJ-2026-09-0001
	SalesOrderID    uint64              `gorm:"index;not null" json:"sales_order_id"`
	SalesOrder      *SalesOrder         `gorm:"foreignKey:SalesOrderID" json:"sales_order,omitempty"`
	CustomerID      uint64              `gorm:"index;not null" json:"customer_id"`
	Customer        *Customer           `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	WarehouseID     uint64              `gorm:"index;not null" json:"warehouse_id"`
	Warehouse       *Warehouse          `gorm:"foreignKey:WarehouseID" json:"warehouse,omitempty"`
	DeliveryDate    time.Time           `json:"delivery_date"`
	DriverName      string              `gorm:"type:varchar(150)" json:"driver_name"`
	VehiclePlate    string              `gorm:"type:varchar(50)" json:"vehicle_plate"`
	Expedition      string              `gorm:"type:varchar(150)" json:"expedition"` // Ekspedisi Truk, JNE, Kontainer 40ft
	TrackingNumber  string              `gorm:"type:varchar(150)" json:"tracking_number,omitempty"`
	RecipientName   string              `gorm:"type:varchar(150)" json:"recipient_name"`
	ShippingAddress string              `gorm:"type:text" json:"shipping_address"`
	Status          string              `gorm:"type:varchar(50);default:'DRAFT';not null" json:"status"` // DRAFT, PACKED, SHIPPED, DELIVERED, CANCELLED
	ShippedAt       *time.Time          `json:"shipped_at,omitempty"`
	DeliveredAt     *time.Time          `json:"delivered_at,omitempty"`
	Notes           string              `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt       time.Time           `json:"created_at"`
	UpdatedAt       time.Time           `json:"updated_at"`

	Items []DeliveryOrderItem `gorm:"foreignKey:DeliveryOrderID" json:"items,omitempty"`
}

// DeliveryOrderItem line item of shipped finished goods
type DeliveryOrderItem struct {
	ID               uint64          `gorm:"primaryKey;autoIncrement" json:"id"`
	DeliveryOrderID  uint64          `gorm:"index;not null" json:"delivery_order_id"`
	SalesOrderItemID *uint64         `gorm:"index" json:"sales_order_item_id,omitempty"`
	ProductID        uint64          `gorm:"index;not null" json:"product_id"`
	Product          *Product        `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	OrderedQty       int             `gorm:"not null" json:"ordered_qty"`
	ShippedQty       int             `gorm:"not null" json:"shipped_qty"`
	Notes            string          `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt        time.Time       `json:"created_at"`
}
