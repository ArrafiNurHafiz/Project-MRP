package models

import (
	"time"
)

// ----------------- 1. Engineering Change Orders (ECO) - Odoo / Infor standard -----------------
type EngineeringChangeOrder struct {
	ID             uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	ECONumber      string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"eco_number"` // ECO-2026-09-001
	ProductID      uint64    `gorm:"index;not null" json:"product_id"`
	Product        Product   `gorm:"foreignKey:ProductID" json:"product"`
	Title          string    `gorm:"type:varchar(255);not null" json:"title"`
	ChangeType     string    `gorm:"type:varchar(50);not null" json:"change_type"` // BOM_CHANGE, ROUTING_CHANGE, SPEC_UPDATE
	Reason         string    `gorm:"type:text;not null" json:"reason"`
	EffectiveDate  time.Time `json:"effective_date"`
	VersionFrom    string    `gorm:"type:varchar(50);default:'v1.0'" json:"version_from"`
	VersionTo      string    `gorm:"type:varchar(50);default:'v1.1'" json:"version_to"`
	Status         string    `gorm:"type:varchar(50);default:'DRAFT';not null" json:"status"` // DRAFT, IN_REVIEW, APPROVED, APPLIED, REJECTED
	ApprovedByUserID *uint64 `gorm:"index" json:"approved_by_user_id,omitempty"`
	ApprovedByUser *User     `gorm:"foreignKey:ApprovedByUserID" json:"approved_by_user,omitempty"`
	Items          []ECOItem `gorm:"foreignKey:ECOID" json:"items,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type ECOItem struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	ECOID       uint64    `gorm:"index;not null" json:"eco_id"`
	MaterialID  uint64    `gorm:"index;not null" json:"material_id"`
	Material    Material  `gorm:"foreignKey:MaterialID" json:"material"`
	ActionType  string    `gorm:"type:varchar(50);not null" json:"action_type"` // ADD_MATERIAL, REMOVE_MATERIAL, UPDATE_QTY
	OldQuantity float64   `gorm:"type:decimal(12,4);default:0" json:"old_quantity"`
	NewQuantity float64   `gorm:"type:decimal(12,4);default:0" json:"new_quantity"`
	Notes       string    `gorm:"type:text" json:"notes,omitempty"`
}

// ----------------- 2. Shop Floor Live Operator Kiosk - Katana / MRPeasy standard -----------------
type ShopFloorLog struct {
	ID                 uint64          `gorm:"primaryKey;autoIncrement" json:"id"`
	WorkOrderStationID uint64          `gorm:"index;not null" json:"work_order_station_id"`
	WorkOrderStation   WorkOrderStation `gorm:"foreignKey:WorkOrderStationID" json:"work_order_station"`
	OperatorUserID     uint64          `gorm:"index;not null" json:"operator_user_id"`
	OperatorUser       User            `gorm:"foreignKey:OperatorUserID" json:"operator_user"`
	MachineName        string          `gorm:"type:varchar(150)" json:"machine_name,omitempty"`
	ClockInTime        time.Time       `json:"clock_in_time"`
	ClockOutTime       *time.Time      `json:"clock_out_time,omitempty"`
	DurationMinutes    int             `gorm:"default:0" json:"duration_minutes"`
	GoodQtyProduced    int             `gorm:"default:0" json:"good_qty_produced"`
	ScrapQtyProduced   int             `gorm:"default:0" json:"scrap_qty_produced"`
	Status             string          `gorm:"type:varchar(50);default:'RUNNING';not null" json:"status"` // RUNNING, PAUSED, COMPLETED
	CreatedAt          time.Time       `json:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at"`
}

// ----------------- 3. Preventive & Corrective Maintenance - Infor / ECOUNT standard -----------------
type MaintenanceTask struct {
	ID               uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	TaskNumber       string     `gorm:"type:varchar(100);uniqueIndex;not null" json:"task_number"` // MNT-2026-09-001
	StationID        uint64     `gorm:"index;not null" json:"station_id"`
	Station          WorkStation `gorm:"foreignKey:StationID" json:"station"`
	MachineName      string     `gorm:"type:varchar(150);not null" json:"machine_name"`
	TaskType         string     `gorm:"type:varchar(50);default:'PREVENTIVE';not null" json:"task_type"` // PREVENTIVE, CORRECTIVE, CALIBRATION
	ScheduledDate    time.Time  `json:"scheduled_date"`
	CompletedDate    *time.Time `json:"completed_date,omitempty"`
	TechnicianUserID uint64     `gorm:"index;not null" json:"technician_user_id"`
	TechnicianUser   User       `gorm:"foreignKey:TechnicianUserID" json:"technician_user"`
	SparePartNotes   string     `gorm:"type:text" json:"spare_part_notes,omitempty"`
	CostEstimated    float64    `gorm:"type:decimal(15,2);default:0" json:"cost_estimated"`
	Status           string     `gorm:"type:varchar(50);default:'SCHEDULED';not null" json:"status"` // SCHEDULED, IN_PROGRESS, COMPLETED, OVERDUE
	ActionLog        string     `gorm:"type:text" json:"action_log,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// ----------------- 4. Unbuild / Disassembly Orders - Odoo MRP standard -----------------
type UnbuildOrder struct {
	ID               uint64        `gorm:"primaryKey;autoIncrement" json:"id"`
	UnbuildNumber    string        `gorm:"type:varchar(100);uniqueIndex;not null" json:"unbuild_number"` // UNB-2026-09-001
	ProductID        uint64        `gorm:"index;not null" json:"product_id"`
	Product          Product       `gorm:"foreignKey:ProductID" json:"product"`
	DisassemblyQty   int           `gorm:"not null" json:"disassembly_qty"`
	Reason           string        `gorm:"type:varchar(255);not null" json:"reason"` // CUSTOMER_RETURN, DEFECTIVE_REPURPOSE, OBSOLETE_STOCK
	Status           string        `gorm:"type:varchar(50);default:'DRAFT';not null" json:"status"` // DRAFT, DISASSEMBLED, CANCELLED
	PerformedByUserID uint64       `gorm:"index;not null" json:"performed_by_user_id"`
	PerformedByUser  User          `gorm:"foreignKey:PerformedByUserID" json:"performed_by_user"`
	RecoveredItems   []UnbuildItem `gorm:"foreignKey:UnbuildID" json:"recovered_items,omitempty"`
	CreatedAt        time.Time     `json:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at"`
}

type UnbuildItem struct {
	ID           uint64   `gorm:"primaryKey;autoIncrement" json:"id"`
	UnbuildID    uint64   `gorm:"index;not null" json:"unbuild_id"`
	MaterialID   uint64   `gorm:"index;not null" json:"material_id"`
	Material     Material `gorm:"foreignKey:MaterialID" json:"material"`
	RecoveredQty float64  `gorm:"type:decimal(12,4);not null" json:"recovered_qty"`
	Condition    string   `gorm:"type:varchar(50);default:'REUSABLE'" json:"condition"` // REUSABLE, SCRAP, DOWNGRADED
	CreatedAt    time.Time `json:"created_at"`
}
