package models

import (
	"time"
)

// Request For Quotation (RFQ)
type RFQ struct {
	ID               uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	RFQNumber        string     `gorm:"type:varchar(100);uniqueIndex;not null" json:"rfq_number"`
	CustomerID       uint64     `gorm:"index;not null" json:"customer_id"`
	Customer         Customer   `gorm:"foreignKey:CustomerID" json:"customer"`
	SubmissionStatus string     `gorm:"type:varchar(50);default:'DRAFT';not null" json:"submission_status"` // DRAFT, SUBMITTED, APPROVED, REJECTED
	ProcessingStatus string     `gorm:"type:varchar(50);default:'ANALYSIS_PENDING';not null" json:"processing_status"` // ANALYSIS_PENDING, READY_TO_QUOTE, QUOTED
	IsCustomProduct  bool       `gorm:"default:false;not null" json:"is_custom_product"`
	TargetDate       *time.Time `json:"target_date,omitempty"`
	CustomerNotes    string     `gorm:"type:text" json:"customer_notes,omitempty"`
	InternalNotes    string     `gorm:"type:text" json:"internal_notes,omitempty"`
	Items            []RFQItem  `gorm:"foreignKey:RFQID" json:"items,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type RFQItem struct {
	ID             uint64   `gorm:"primaryKey;autoIncrement" json:"id"`
	RFQID          uint64   `gorm:"index;not null" json:"rfq_id"`
	ProductID      *uint64  `gorm:"index" json:"product_id,omitempty"`
	Product        *Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	CustomName     string   `gorm:"type:varchar(255)" json:"custom_name"`
	TargetQuantity int      `gorm:"not null" json:"target_quantity"`
	TargetBudget   float64  `gorm:"type:decimal(15,2);default:0" json:"target_budget"`
	SpecsNotes     string   `gorm:"type:text" json:"specs_notes,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// Order Simulation Capacity Engine (MPS / CRP)
type OrderSimulationResult struct {
	OrderRequiredDate string                     `json:"order_required_date"`
	FeasibilityStatus string                     `json:"feasibility_status"` // FEASIBLE, PARTIAL_SHORTAGE, LEAD_TIME_CRITICAL
	ForecastedRevenue float64                    `json:"forecasted_revenue"`
	TotalGrossCOGS    float64                    `json:"total_gross_cogs"`
	EstimatedMargin   float64                    `json:"estimated_margin"`
	MaterialDemands   []MaterialDemandBreakdown  `json:"material_demands"`
	StationCapacities []StationCapacityBreakdown `json:"station_capacities"`
	PurchaseRecommends []PORecommendation        `json:"purchase_recommendations"`
}

type MaterialDemandBreakdown struct {
	MaterialID      uint64  `json:"material_id"`
	MaterialCode    string  `json:"material_code"`
	Name            string  `json:"name"`
	Category        string  `json:"category"`
	CurrentStockQty float64 `json:"current_stock_qty"`
	RequiredGrossQty float64 `json:"required_gross_qty"`
	NetShortageQty  float64 `json:"net_shortage_qty"`
	Unit            string  `json:"unit"`
	CostPerUnit     float64 `json:"cost_per_unit"`
	TotalDemandCost float64 `json:"total_demand_cost"`
	IsShortage      bool    `json:"is_shortage"`
}

type StationCapacityBreakdown struct {
	StationCode       string  `json:"station_code"`
	StationName       string  `json:"station_name"`
	EstimatedLoadHours float64 `json:"estimated_load_hours"`
	MaxCapacityHours  float64 `json:"max_capacity_hours"`
	UtilizationPct    float64 `json:"utilization_pct"`
	IsOverloaded      bool    `json:"is_overloaded"`
}

type PORecommendation struct {
	MaterialID      uint64  `json:"material_id"`
	MaterialName    string  `json:"material_name"`
	RecommendedQty  float64 `json:"recommended_qty"`
	EstimatedUnitCost float64 `json:"estimated_unit_cost"`
	EstimatedTotalCost float64 `json:"estimated_total_cost"`
	SuggestedLeadDays int     `json:"suggested_lead_days"`
}

// Foreign Exchange (FX) Currency Setting
type CurrencyFX struct {
	ID           uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Code         string    `gorm:"type:varchar(10);uniqueIndex;not null" json:"code"` // IDR, USD, EUR, SGD
	Name         string    `gorm:"type:varchar(100);not null" json:"name"`
	Symbol       string    `gorm:"type:varchar(10);not null" json:"symbol"`
	ExchangeRate float64   `gorm:"type:decimal(15,4);default:1;not null" json:"exchange_rate"` // Rate to Base Currency (IDR)
	IsActive     bool      `gorm:"default:true;not null" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Company / Tenant Setting
type CompanySetting struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	CompanyName string    `gorm:"type:varchar(255);not null" json:"company_name"`
	NPWP        string    `gorm:"type:varchar(50)" json:"npwp"`
	Email       string    `gorm:"type:varchar(255)" json:"email"`
	Phone       string    `gorm:"type:varchar(50)" json:"phone"`
	Address     string    `gorm:"type:text" json:"address"`
	LogoURL     string    `gorm:"type:text" json:"logo_url,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ----------------- Custom Product Request (CPR) Module -----------------

const (
	CPRStatusNew          = "NEW"
	CPRStatusInProgress   = "IN_PROGRESS"
	CPRStatusNeedRevision = "NEED_REVISION"
	CPRStatusApproved     = "APPROVED"
	CPRStatusCompleted    = "COMPLETED"
	CPRStatusRejected     = "REJECTED"
)

type CustomProductRequest struct {
	ID                uint64            `gorm:"primaryKey;autoIncrement" json:"id"`
	CPRNumber         string            `gorm:"type:varchar(100);uniqueIndex;not null" json:"cpr_number"`
	RFQID             *uint64           `gorm:"index" json:"rfq_id,omitempty"`
	RFQ               *RFQ              `gorm:"foreignKey:RFQID" json:"rfq,omitempty"`
	CustomerID        uint64            `gorm:"index;not null" json:"customer_id"`
	Customer          Customer          `gorm:"foreignKey:CustomerID" json:"customer"`
	AssignedEngID     *uint64           `gorm:"index" json:"assigned_eng_id,omitempty"`
	AssignedEng       *User             `gorm:"foreignKey:AssignedEngID" json:"assigned_eng,omitempty"`
	ProductName       string            `gorm:"type:varchar(255);not null" json:"product_name"`
	Category          string            `gorm:"type:varchar(100);default:'custom';not null" json:"category"`
	Unit              string            `gorm:"type:varchar(50);default:'pcs';not null" json:"unit"`
	RequestedQty      int               `gorm:"not null" json:"requested_qty"`
	TargetBudget      float64           `gorm:"type:decimal(15,2);default:0" json:"target_budget"`
	BasePriceHPP      float64           `gorm:"type:decimal(15,2);default:0" json:"base_price_hpp"`
	SuggestedPrice    float64           `gorm:"type:decimal(15,2);default:0" json:"suggested_price"`
	EstimatedLeadDays int               `gorm:"default:14;not null" json:"estimated_lead_days"`
	CADFileURL        string            `gorm:"type:text" json:"cad_file_url,omitempty"`
	TechnicalSpecs    string            `gorm:"type:text" json:"technical_specs,omitempty"`
	EngineeringNotes  string            `gorm:"type:text" json:"engineering_notes,omitempty"`
	Status            string            `gorm:"type:varchar(50);default:'NEW';not null" json:"status"`
	Materials         []CPRMaterialItem `gorm:"foreignKey:CPRID" json:"materials,omitempty"`
	Routings          []CPRRoutingStage `gorm:"foreignKey:CPRID" json:"routings,omitempty"`
	CreatedAt         time.Time         `json:"created_at"`
	UpdatedAt         time.Time         `json:"updated_at"`
}

type CPRMaterialItem struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	CPRID       uint64    `gorm:"index;not null" json:"cpr_id"`
	MaterialID  *uint64   `gorm:"index" json:"material_id,omitempty"`
	Material    *Material `gorm:"foreignKey:MaterialID" json:"material,omitempty"`
	ItemName    string    `gorm:"type:varchar(255);not null" json:"item_name"`
	QtyRequired float64   `gorm:"type:decimal(12,4);not null" json:"qty_required"`
	Unit        string    `gorm:"type:varchar(50);not null" json:"unit"`
	UnitCost    float64   `gorm:"type:decimal(15,2);default:0;not null" json:"unit_cost"`
	Subtotal    float64   `gorm:"type:decimal(15,2);default:0;not null" json:"subtotal"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CPRRoutingStage struct {
	ID             uint64       `gorm:"primaryKey;autoIncrement" json:"id"`
	CPRID          uint64       `gorm:"index;not null" json:"cpr_id"`
	StationID      *uint64      `gorm:"index" json:"station_id,omitempty"`
	Station        *WorkStation `gorm:"foreignKey:StationID" json:"station,omitempty"`
	StageName      string       `gorm:"type:varchar(150);not null" json:"stage_name"`
	SequenceOrder  int          `gorm:"not null" json:"sequence_order"`
	EstimatedHours float64      `gorm:"type:decimal(8,2);default:1;not null" json:"estimated_hours"`
	HourlyRate     float64      `gorm:"type:decimal(15,2);default:0;not null" json:"hourly_rate"`
	Subtotal       float64      `gorm:"type:decimal(15,2);default:0;not null" json:"subtotal"`
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
}
