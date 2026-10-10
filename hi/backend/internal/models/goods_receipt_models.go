package models

import (
	"time"
)

// GoodsReceipt represents a formal Inbound Goods Receipt Note (GRN) from a vendor Purchase Order
type GoodsReceipt struct {
	ID                 uint64             `gorm:"primaryKey;autoIncrement" json:"id"`
	TenantID           uint64             `gorm:"index;default:1" json:"tenant_id"`
	ReceiptNumber      string             `gorm:"type:varchar(100);uniqueIndex;not null" json:"receipt_number"` // GRN-2026-09-0001
	PurchaseOrderID    uint64             `gorm:"index;not null" json:"purchase_order_id"`
	PurchaseOrder      *PurchaseOrder     `gorm:"foreignKey:PurchaseOrderID" json:"purchase_order,omitempty"`
	WarehouseID        uint64             `gorm:"index;not null" json:"warehouse_id"`
	Warehouse          *Warehouse         `gorm:"foreignKey:WarehouseID" json:"warehouse,omitempty"`
	VendorID           uint64             `gorm:"index;not null" json:"vendor_id"`
	Vendor             *Vendor            `gorm:"foreignKey:VendorID" json:"vendor,omitempty"`
	ReceivedDate       time.Time          `json:"received_date"`
	ReceivedByUserID   uint64             `gorm:"index;not null" json:"received_by_user_id"`
	ReceivedByUser     *User              `gorm:"foreignKey:ReceivedByUserID" json:"received_by_user,omitempty"`
	VendorDeliveryNote string             `gorm:"type:varchar(150)" json:"vendor_delivery_note"` // No. Surat Jalan Vendor
	Status             string             `gorm:"type:varchar(50);default:'RECEIVED';not null" json:"status"` // DRAFT, RECEIVED, INSPECTED, CANCELLED
	Notes              string             `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt          time.Time          `json:"created_at"`
	UpdatedAt          time.Time          `json:"updated_at"`

	Items []GoodsReceiptItem `gorm:"foreignKey:GoodsReceiptID" json:"items,omitempty"`
}

// GoodsReceiptItem line item of incoming material
type GoodsReceiptItem struct {
	ID                  uint64            `gorm:"primaryKey;autoIncrement" json:"id"`
	GoodsReceiptID      uint64            `gorm:"index;not null" json:"goods_receipt_id"`
	PurchaseOrderItemID *uint64           `gorm:"index" json:"purchase_order_item_id,omitempty"`
	MaterialID          uint64            `gorm:"index;not null" json:"material_id"`
	Material            *Material         `gorm:"foreignKey:MaterialID" json:"material,omitempty"`
	OrderedQty          float64           `gorm:"type:decimal(12,2);not null" json:"ordered_qty"`
	ReceivedQty         float64           `gorm:"type:decimal(12,2);not null" json:"received_qty"`
	AcceptedQty         float64           `gorm:"type:decimal(12,2);not null" json:"accepted_qty"`
	RejectedQty         float64           `gorm:"type:decimal(12,2);default:0" json:"rejected_qty"`
	UnitCost            float64           `gorm:"type:decimal(12,2);not null" json:"unit_cost"`
	BatchLotNumber      string            `gorm:"type:varchar(100);not null" json:"batch_lot_number"`
	BatchLotID          *uint64           `gorm:"index" json:"batch_lot_id,omitempty"`
	BatchLot            *MaterialBatchLot `gorm:"foreignKey:BatchLotID" json:"batch_lot,omitempty"`
	MoistureContent     float64           `gorm:"type:decimal(5,2);default:12.0" json:"moisture_content"`
	QCStatus            string            `gorm:"type:varchar(50);default:'PASSED';not null" json:"qc_status"` // PASSED, QUARANTINE, REJECTED
	WoodOrigin          string            `gorm:"type:varchar(150)" json:"wood_origin,omitempty"`
	Notes               string            `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt           time.Time         `json:"created_at"`
}
