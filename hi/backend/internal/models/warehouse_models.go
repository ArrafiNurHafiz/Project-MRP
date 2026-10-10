package models

import (
	"time"
)

// Warehouse represents physical or logical storage locations in an enterprise
type Warehouse struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	TenantID    uint64    `gorm:"index;default:1" json:"tenant_id"`
	Code        string    `gorm:"size:50;not null;uniqueIndex" json:"code"` // e.g. WH-RAW-01, WH-FG-01
	Name        string    `gorm:"size:100;not null" json:"name"`
	Type        string    `gorm:"size:50;not null;default:'raw_materials'" json:"type"` // raw_materials, finished_goods, wip, quarantine, subcontractor
	Location    string    `gorm:"size:100" json:"location"`
	Address     string    `gorm:"type:text" json:"address"`
	CapacityM3  float64   `gorm:"default:0" json:"capacity_m3"`
	ManagerName string    `gorm:"size:100" json:"manager_name"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Stocks []WarehouseStock `gorm:"foreignKey:WarehouseID" json:"stocks,omitempty"`
}

// WarehouseStock tracks inventory quantity of specific materials inside a specific warehouse
type WarehouseStock struct {
	ID           uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	WarehouseID  uint64    `gorm:"index;not null" json:"warehouse_id"`
	Warehouse    Warehouse `gorm:"foreignKey:WarehouseID" json:"warehouse,omitempty"`
	MaterialID   uint64    `gorm:"index;not null" json:"material_id"`
	Material     Material  `gorm:"foreignKey:MaterialID" json:"material,omitempty"`
	Quantity     float64   `gorm:"default:0" json:"quantity"`
	ReservedQty  float64   `gorm:"default:0" json:"reserved_qty"` // Allocated for ongoing SPK
	MinStock     float64   `gorm:"default:0" json:"min_stock"`
	MaxStock     float64   `gorm:"default:0" json:"max_stock"`
	LastStockDate time.Time `json:"last_stock_date"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// StockTransfer tracks movement of inventory between two warehouses
type StockTransfer struct {
	ID              uint64              `gorm:"primaryKey;autoIncrement" json:"id"`
	TenantID        uint64              `gorm:"index;default:1" json:"tenant_id"`
	TransferNumber  string              `gorm:"size:50;not null;uniqueIndex" json:"transfer_number"` // TRF-2026-XXXX
	FromWarehouseID uint64              `gorm:"index;not null" json:"from_warehouse_id"`
	FromWarehouse   Warehouse           `gorm:"foreignKey:FromWarehouseID" json:"from_warehouse,omitempty"`
	ToWarehouseID   uint64              `gorm:"index;not null" json:"to_warehouse_id"`
	ToWarehouse     Warehouse           `gorm:"foreignKey:ToWarehouseID" json:"to_warehouse,omitempty"`
	TransferDate    time.Time           `json:"transfer_date"`
	DriverName      string              `gorm:"size:100" json:"driver_name"`
	VehicleNumber   string              `gorm:"size:50" json:"vehicle_number"`
	Notes           string              `gorm:"type:text" json:"notes"`
	Status          string              `gorm:"size:30;default:'draft'" json:"status"` // draft, in_transit, completed, cancelled
	CreatedBy       uint64              `json:"created_by"`
	CreatedAt       time.Time           `json:"created_at"`
	UpdatedAt       time.Time           `json:"updated_at"`

	Items []StockTransferItem `gorm:"foreignKey:StockTransferID" json:"items,omitempty"`
}

// StockTransferItem line items in a transfer
type StockTransferItem struct {
	ID              uint64        `gorm:"primaryKey;autoIncrement" json:"id"`
	StockTransferID uint64        `gorm:"index;not null" json:"stock_transfer_id"`
	MaterialID      uint64        `gorm:"index;not null" json:"material_id"`
	Material        Material      `gorm:"foreignKey:MaterialID" json:"material,omitempty"`
	RequestedQty    float64       `gorm:"not null" json:"requested_qty"`
	TransferredQty  float64       `gorm:"default:0" json:"transferred_qty"`
	UnitCost        float64       `gorm:"default:0" json:"unit_cost"`
}

// StockAdjustment records physical inventory count differences (Stock Opname)
type StockAdjustment struct {
	ID               uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	TenantID         uint64    `gorm:"index;default:1" json:"tenant_id"`
	AdjustmentNumber string    `gorm:"size:50;not null;uniqueIndex" json:"adjustment_number"` // ADJ-2026-XXXX
	WarehouseID      uint64    `gorm:"index;not null" json:"warehouse_id"`
	Warehouse        Warehouse `gorm:"foreignKey:WarehouseID" json:"warehouse,omitempty"`
	MaterialID       uint64    `gorm:"index;not null" json:"material_id"`
	Material         Material  `gorm:"foreignKey:MaterialID" json:"material,omitempty"`
	RecordedQty      float64   `gorm:"not null" json:"recorded_qty"`
	CountedQty       float64   `gorm:"not null" json:"counted_qty"`
	DiscrepancyQty   float64   `gorm:"not null" json:"discrepancy_qty"` // Counted - Recorded
	Reason           string    `gorm:"size:50;not null" json:"reason"` // damaged, expired, count_difference, audit_adjustment
	Notes            string    `gorm:"type:text" json:"notes"`
	Status           string    `gorm:"size:30;default:'draft'" json:"status"` // draft, approved, rejected
	AdjustedBy       uint64    `json:"adjusted_by"`
	ApprovedBy       *uint64   `json:"approved_by,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}
