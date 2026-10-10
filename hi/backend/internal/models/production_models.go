package models

import (
	"time"
)

// Work Station Codes & Names
const (
	StationCodeWoodWorking      = "ST-1"
	StationCodePascaWoodWorking = "ST-2"
	StationCodeFinishing        = "ST-3"
	StationCodePascaFinishing   = "ST-4"
	StationCodePacking          = "ST-5"

	StationNameWoodWorking      = "Wood Working"
	StationNamePascaWoodWorking = "Pasca Wood Working"
	StationNameFinishing        = "Finishing"
	StationNamePascaFinishing   = "Pasca Finishing (Laser & Final QC)"
	StationNamePacking          = "Packing & Pelabelan"

	WOStatusDraft      = "draft"
	WOStatusInProgress = "in_progress"
	WOStatusCompleted  = "completed"
	WOStatusCancelled  = "cancelled"

	StationStatusPending    = "pending"
	StationStatusInProgress = "in_progress"
	StationStatusQCWait     = "qc_wait"
	StationStatusCompleted  = "completed"

	AssignedTypeInternal = "internal"
	AssignedTypeMitra    = "mitra"

	GateStatusKeluar = "keluar" // Gate Out
	GateStatusMasuk  = "masuk"  // Gate In

	ProductActionKirim = "kirim" // Antar bahan baku ke mitra
	ProductActionAmbil = "ambil" // Jemput hasil olahan dari mitra

	QCActionAccept        = "accept"
	QCActionReworkInhouse = "rework_inhouse"
	QCActionReworkMitra   = "rework_mitra"
	QCActionScrap         = "scrap"

	MaterialCategoryWood      = "wood"
	MaterialCategoryChemical  = "chemical"
	MaterialCategoryPackaging = "packaging"
	MaterialCategoryAccessory = "accessory"
)

type WorkStation struct {
	ID                uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	StationCode       string    `gorm:"type:varchar(20);uniqueIndex;not null" json:"station_code"`
	Name              string    `gorm:"type:varchar(150);not null" json:"name"`
	SequenceOrder     int       `gorm:"not null" json:"sequence_order"`
	IsExternalAllowed bool      `gorm:"default:false;not null" json:"is_external_allowed"` // True: 1-3, False: 4-5
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type Product struct {
	ID             uint64       `gorm:"primaryKey;autoIncrement" json:"id"`
	ProductName    string       `gorm:"type:varchar(255);not null" json:"product_name"`
	ProductCode    string       `gorm:"type:varchar(100);uniqueIndex;not null" json:"product_code"`
	IsActive       bool         `gorm:"default:true;not null" json:"is_active"`
	IsSubAssembly  bool         `gorm:"default:false;not null" json:"is_sub_assembly"`
	BOMItems       []ProductBOM `gorm:"foreignKey:ProductID" json:"bom_items,omitempty"`
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
}

// ----------------- Modular MRP: Bill of Materials & Materials -----------------

type Material struct {
	ID           uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	MaterialCode string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"material_code"`
	Name         string    `gorm:"type:varchar(255);not null" json:"name"`
	Category     string    `gorm:"type:varchar(50);default:'wood';not null" json:"category"` // wood, chemical, packaging, accessory
	Unit         string    `gorm:"type:varchar(50);not null" json:"unit"`                    // pcs, batang, kg, liter, dus
	StockQty     float64   `gorm:"type:decimal(12,2);default:0;not null" json:"stock_qty"`
	MinimumStock float64   `gorm:"type:decimal(12,2);default:0;not null" json:"minimum_stock"`
	CostPerUnit  float64   `gorm:"type:decimal(12,2);default:0;not null" json:"cost_per_unit"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ProductBOM struct {
	ID                   uint64       `gorm:"primaryKey;autoIncrement" json:"id"`
	ProductID            uint64       `gorm:"index;not null" json:"product_id"`
	Product              Product      `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	MaterialID           uint64       `gorm:"index;default:0" json:"material_id"`
	Material             *Material    `gorm:"foreignKey:MaterialID" json:"material,omitempty"`
	SubAssemblyProductID *uint64      `gorm:"index" json:"sub_assembly_product_id,omitempty"`
	SubAssemblyProduct   *Product     `gorm:"foreignKey:SubAssemblyProductID" json:"sub_assembly_product,omitempty"`
	StationID            uint64       `gorm:"index;not null" json:"station_id"`
	Station              WorkStation  `gorm:"foreignKey:StationID" json:"station,omitempty"`
	Quantity             float64      `gorm:"type:decimal(12,4);not null" json:"quantity"` // Konsumsi per 1 pcs produk jadi
	WastePct             float64      `gorm:"type:decimal(5,2);default:0;not null" json:"waste_pct"` // % susut / scrap allowance
	Notes                string       `gorm:"type:varchar(255)" json:"notes,omitempty"`
	CreatedAt            time.Time    `json:"created_at"`
	UpdatedAt            time.Time    `json:"updated_at"`
}

func (ProductBOM) TableName() string {
	return "product_boms"
}

type WorkOrder struct {
	ID                 uint64             `gorm:"primaryKey;autoIncrement" json:"id"`
	SPKNumber          string             `gorm:"type:varchar(100);uniqueIndex;not null" json:"spk_number"`
	ProductID          uint64             `gorm:"index;not null" json:"product_id"`
	Product            Product            `gorm:"foreignKey:ProductID" json:"product"`
	TotalTargetQty     int                `gorm:"not null" json:"total_target_qty"`
	Priority           string             `gorm:"type:varchar(20);default:'normal';not null" json:"priority"` // normal, urgent
	Status             string             `gorm:"type:varchar(50);default:'draft';not null" json:"status"`    // draft, in_progress, completed, cancelled
	StartDate          *time.Time         `json:"start_date,omitempty"`
	DeadlineDate       *time.Time         `json:"deadline_date,omitempty"`
	ParentWorkOrderID  *uint64            `gorm:"index" json:"parent_work_order_id,omitempty"`
	SalesOrderID       *uint64            `gorm:"index" json:"sales_order_id,omitempty"`
	Stations           []WorkOrderStation `gorm:"foreignKey:WorkOrderID" json:"stations,omitempty"`
	CreatedAt          time.Time          `json:"created_at"`
	UpdatedAt          time.Time          `json:"updated_at"`
}

type WorkOrderStation struct {
	ID             uint64          `gorm:"primaryKey;autoIncrement" json:"id"`
	WorkOrderID    uint64          `gorm:"index;not null" json:"work_order_id"`
	StationID      uint64          `gorm:"index;not null" json:"station_id"`
	Station        WorkStation     `gorm:"foreignKey:StationID" json:"station"`
	SequenceOrder  int             `gorm:"not null" json:"sequence_order"`
	AssignedType   string          `gorm:"type:varchar(20);default:'internal';not null" json:"assigned_type"` // internal, mitra
	AssignedUserID *uint64         `gorm:"index" json:"assigned_user_id,omitempty"`
	AssignedUser   *User           `gorm:"foreignKey:AssignedUserID" json:"assigned_user,omitempty"`
	Status         string          `gorm:"type:varchar(50);default:'pending';not null" json:"status"` // pending, in_progress, qc_wait, completed
	InputQty       int             `gorm:"default:0;not null" json:"input_qty"`
	CompletedQty   int             `gorm:"default:0;not null" json:"completed_qty"`
	RejectQty      int             `gorm:"default:0;not null" json:"reject_qty"`
	ReworkQty      int             `gorm:"default:0;not null" json:"rework_qty"`
	Notes          string          `gorm:"type:text" json:"notes,omitempty"`
	Logs           []ProductionLog `gorm:"foreignKey:WorkOrderStationID" json:"logs,omitempty"`
	QCLogs         []QCLog         `gorm:"foreignKey:WorkOrderStationID" json:"qc_logs,omitempty"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type ProductionLog struct {
	ID                 uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	WorkOrderStationID uint64    `gorm:"index;not null" json:"work_order_station_id"`
	UserID             uint64    `gorm:"index;not null" json:"user_id"`
	User               User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Channel            string    `gorm:"type:varchar(20);default:'web';not null" json:"channel"` // whatsapp, web
	LogType            string    `gorm:"type:varchar(50);not null" json:"log_type"`              // start, progress_report, finish, issue
	ReportedQtyPass    int       `gorm:"default:0;not null" json:"reported_qty_pass"`
	ReportedQtyReject  int       `gorm:"default:0;not null" json:"reported_qty_reject"`
	RejectBreakdown    string    `gorm:"type:text" json:"reject_breakdown,omitempty"` // JSON string
	Notes              string    `gorm:"type:text" json:"notes,omitempty"`
	RawPayload         string    `gorm:"type:text" json:"raw_payload,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type QCLog struct {
	ID                 uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	WorkOrderStationID uint64    `gorm:"index;not null" json:"work_order_station_id"`
	InspectorUserID    uint64    `gorm:"index;not null" json:"inspector_user_id"`
	InspectorUser      User      `gorm:"foreignKey:InspectorUserID" json:"inspector_user,omitempty"`
	InspectionModel    string    `gorm:"type:varchar(50);default:'in_house'" json:"inspection_model"` // in_house, pickup_joint_model_a, onsite_autonomous_model_b
	SampleQty          int       `gorm:"default:0;not null" json:"sample_qty"`
	PassQty            int       `gorm:"default:0;not null" json:"pass_qty"`
	RejectQty          int       `gorm:"default:0;not null" json:"reject_qty"`
	RejectMinorQty     int       `gorm:"default:0;not null" json:"reject_minor_qty"` // Bisa diperbaiki tidak berubah banyak
	RejectMajorQty     int       `gorm:"default:0;not null" json:"reject_major_qty"` // Harus bongkar
	RejectScrapQty     int       `gorm:"default:0;not null" json:"reject_scrap_qty"` // Harus ganti
	DefectCategories   string    `gorm:"type:varchar(255)" json:"defect_categories,omitempty"`
	ActionTaken        string    `gorm:"type:varchar(50);default:'accept'" json:"action_taken"` // accept, rework_inhouse, rework_mitra, scrap
	Notes              string    `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type MitraProductStationAssignment struct {
	ID                    uint64      `gorm:"primaryKey;autoIncrement" json:"id"`
	MitraUserID           uint64      `gorm:"index;not null" json:"mitra_user_id"`
	MitraUser             User        `gorm:"foreignKey:MitraUserID" json:"mitra_user,omitempty"`
	ProductID             uint64      `gorm:"index;not null" json:"product_id"`
	Product               Product     `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	StationID             uint64      `gorm:"index;not null" json:"station_id"`
	Station               WorkStation `gorm:"foreignKey:StationID" json:"station,omitempty"`
	PieceRateFee          float64     `gorm:"type:decimal(12,2);default:0;not null" json:"piece_rate_fee"`
	DailyCapacityEstimate int         `gorm:"default:0;not null" json:"daily_capacity_estimate"`
	IsPrimary             bool        `gorm:"default:true;not null" json:"is_primary"`
	Notes                 string      `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt             time.Time   `json:"created_at"`
	UpdatedAt             time.Time   `json:"updated_at"`
}

func (MitraProductStationAssignment) TableName() string {
	return "mitra_product_station_assignments"
}

type MitraShipment struct {
	ID                uint64              `gorm:"primaryKey;autoIncrement" json:"id"`
	SJNumber          string              `gorm:"type:varchar(100);uniqueIndex;not null" json:"sj_number"`
	VehicleGateStatus string              `gorm:"type:varchar(20);not null" json:"vehicle_gate_status"` // keluar, masuk
	ProductAction     string              `gorm:"type:varchar(20);not null" json:"product_action"`     // kirim, ambil
	MovementDate      string              `gorm:"type:varchar(50);not null" json:"movement_date"`
	MovementTime      string              `gorm:"type:varchar(50);not null" json:"movement_time"`
	DriverName        string              `gorm:"type:varchar(100);not null" json:"driver_name"`
	HelperName        string              `gorm:"type:varchar(100)" json:"helper_name,omitempty"`
	QCInspectorName   *string             `gorm:"type:varchar(100)" json:"qc_inspector_name,omitempty"`
	VehicleType       string              `gorm:"type:varchar(50);default:'L300'" json:"vehicle_type"`
	LicensePlate      string              `gorm:"type:varchar(50);default:'AD 8623 KW'" json:"license_plate"`
	MitraID           *uint64             `gorm:"index" json:"mitra_id,omitempty"`
	Mitra             *User               `gorm:"foreignKey:MitraID" json:"mitra,omitempty"`
	Notes             string              `gorm:"type:text" json:"notes,omitempty"`
	Items             []MitraShipmentItem `gorm:"foreignKey:ShipmentID" json:"items,omitempty"`
	CreatedAt         time.Time           `json:"created_at"`
	UpdatedAt         time.Time           `json:"updated_at"`
}

type MitraShipmentItem struct {
	ID             uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	ShipmentID     uint64    `gorm:"index;not null" json:"shipment_id"`
	ProductID      *uint64   `gorm:"index" json:"product_id,omitempty"`
	Product        *Product  `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	RawItemName    string    `gorm:"type:varchar(255);not null" json:"raw_item_name"`
	Qty            int       `gorm:"not null" json:"qty"`
	StatusCategory string    `gorm:"type:varchar(50);default:'revisi_total';not null" json:"status_category"` // revisi_total, revisi_jamur, revisi_cacat_lain
	Notes          string    `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
