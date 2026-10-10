package models

import (
	"time"
)

// ----------------- Industrial Shop-floor & Quality Upgrades -----------------

// Machine Downtime Tracking (OEE Support)
type MachineDowntime struct {
	ID                 uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	StationID          uint64    `gorm:"index;not null" json:"station_id"`
	Station            WorkStation `gorm:"foreignKey:StationID" json:"station"`
	WorkOrderStationID *uint64   `gorm:"index" json:"work_order_station_id,omitempty"`
	MachineName        string    `gorm:"type:varchar(150);not null" json:"machine_name"` // e.g. CNC Router, Spindle Moulder, Spray Booth
	ReasonCategory     string    `gorm:"type:varchar(100);not null" json:"reason_category"` // BREAKDOWN, TOOLING_CHANGE, POWER_OUTAGE, MAINTENANCE, MATERIAL_WAIT
	StartTime          time.Time `json:"start_time"`
	EndTime            *time.Time `json:"end_time,omitempty"`
	DurationMinutes    int       `gorm:"default:0" json:"duration_minutes"`
	ImpactedQty        int       `gorm:"default:0" json:"impacted_qty"`
	ActionTaken        string    `gorm:"type:text" json:"action_taken,omitempty"`
	ReportedByUserID   uint64    `gorm:"index;not null" json:"reported_by_user_id"`
	ReportedByUser     User      `gorm:"foreignKey:ReportedByUserID" json:"reported_by_user,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// Rework Loop & Scrap Tracking
type ReworkOrder struct {
	ID                 uint64      `gorm:"primaryKey;autoIncrement" json:"id"`
	ReworkNumber       string      `gorm:"type:varchar(100);uniqueIndex;not null" json:"rework_number"`
	WorkOrderID        uint64      `gorm:"index;not null" json:"work_order_id"`
	WorkOrder          WorkOrder   `gorm:"foreignKey:WorkOrderID" json:"work_order"`
	SourceStationID    uint64      `gorm:"index;not null" json:"source_station_id"`
	SourceStation      WorkStation `gorm:"foreignKey:SourceStationID" json:"source_station"`
	TargetStationID    uint64      `gorm:"index;not null" json:"target_station_id"`
	TargetStation      WorkStation `gorm:"foreignKey:TargetStationID" json:"target_station"`
	DefectReason       string      `gorm:"type:varchar(255);not null" json:"defect_reason"` // JAMUR, RETAK_KAYU, WARNA_BELANG, UKURAN_MELENCENG, SALAH_GRAFIR
	DefectQty          int         `gorm:"not null" json:"defect_qty"`
	RecoveredQty       int         `gorm:"default:0" json:"recovered_qty"`
	ScrappedQty        int         `gorm:"default:0" json:"scrapped_qty"`
	Status             string      `gorm:"type:varchar(50);default:'IN_PROGRESS';not null" json:"status"` // IN_PROGRESS, RECOVERED, SCRAPPED
	AssignedMitraID    *uint64     `gorm:"index" json:"assigned_mitra_id,omitempty"`
	AssignedMitra      *User       `gorm:"foreignKey:AssignedMitraID" json:"assigned_mitra,omitempty"`
	Notes              string      `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt          time.Time   `json:"created_at"`
	UpdatedAt          time.Time   `json:"updated_at"`
}

// Traceable Batch & Lot Tracking (FIFO & Kayu Asal Perhutani)
type MaterialBatchLot struct {
	ID              uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	BatchNumber     string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"batch_number"` // LOT-2026-09-001
	MaterialID      uint64    `gorm:"index;not null" json:"material_id"`
	Material        Material  `gorm:"foreignKey:MaterialID" json:"material"`
	VendorID        uint64    `gorm:"index;not null" json:"vendor_id"`
	Vendor          Vendor    `gorm:"foreignKey:VendorID" json:"vendor"`
	ReceivedDate    time.Time `json:"received_date"`
	InitialQty      float64   `gorm:"type:decimal(12,2);not null" json:"initial_qty"`
	RemainingQty    float64   `gorm:"type:decimal(12,2);not null" json:"remaining_qty"`
	UnitCost        float64   `gorm:"type:decimal(12,2);not null" json:"unit_cost"`
	WoodOrigin      string    `gorm:"type:varchar(150)" json:"wood_origin"` // e.g. Perhutani KPH Randublatung, Sertifikat SVLK
	MoistureContent float64   `gorm:"type:decimal(5,2);default:12.0" json:"moisture_content"` // % Kadar Air Kayu (MC)
	ExpiryDate      *time.Time `json:"expiry_date,omitempty"` // For chemical / glue shelf life
	QCStatus        string    `gorm:"type:varchar(50);default:'PASSED';not null" json:"qc_status"` // PASSED, QUARANTINE, REJECTED
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
