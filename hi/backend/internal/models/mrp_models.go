package models

import (
	"time"
)

// Penawaran & Pesanan Status Constants
const (
	// RFQ
	RFQStatusDraft     = "DRAFT"
	RFQStatusSubmitted = "SUBMITTED"
	RFQStatusApproved  = "APPROVED"
	RFQStatusRejected  = "REJECTED"

	// Penawaran (Quotes)
	QuoteStatusDraft    = "DRAFT"
	QuoteStatusSent     = "SENT"
	QuoteStatusApproved = "APPROVED" // Acc / Disetujui
	QuoteStatusRejected = "REJECTED"
	QuoteStatusExpired  = "EXPIRED"

	// Pesanan (Orders)
	OrderStatusDraft      = "DRAFT"
	OrderStatusPublished  = "PUBLISHED"  // Diterbitkan (menentukan tanggal mulai & selesai)
	OrderStatusInProgress = "IN_PROGRESS"
	OrderStatusCompleted  = "COMPLETED"
	OrderStatusCancelled  = "CANCELLED"

	// Permintaan Material (Material Request)
	MatReqStatusDraft     = "DRAFT"
	MatReqStatusWaiting   = "WAITING_CHECK" // Gudang cek ketersediaan
	MatReqStatusAvailable = "AVAILABLE"     // Barang tersedia & siap ambil
	MatReqStatusAllocated = "ALLOCATED"     // Sudah diambil / dialokasikan
	MatReqStatusIssued    = "ISSUED"        // Sudah diserahkan ke produksi
	MatReqStatusShortage  = "SHORTAGE"      // Bahan kurang

	// Faktur (Invoices)
	InvoiceStatusUnpaid  = "UNPAID"
	InvoiceStatusPartial = "PARTIAL"
	InvoiceStatusPaid    = "PAID"
	InvoiceStatusVoid    = "VOID"

	// Purchase Orders
	POStatusDraft     = "DRAFT"
	POStatusSubmitted = "SUBMITTED"
	POStatusApproved  = "APPROVED"
	POStatusReceived  = "RECEIVED"
	POStatusCancelled = "CANCELLED"
)

// Customer entity
type Customer struct {
	ID        uint64        `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string        `gorm:"type:varchar(255);not null" json:"name"`
	Email     string        `gorm:"type:varchar(255)" json:"email"`
	Phone     string        `gorm:"type:varchar(50)" json:"phone"`
	Address   string        `gorm:"type:text" json:"address"`
	Tag       string        `gorm:"type:varchar(100)" json:"tag"`
	PICs      []CustomerPIC `gorm:"foreignKey:CustomerID" json:"pics,omitempty"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

type CustomerPIC struct {
	ID         uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	CustomerID uint64    `gorm:"index;not null" json:"customer_id"`
	Name       string    `gorm:"type:varchar(255);not null" json:"name"`
	Email      string    `gorm:"type:varchar(255)" json:"email"`
	Phone      string    `gorm:"type:varchar(50)" json:"phone"`
	Role       string    `gorm:"type:varchar(100)" json:"role"`
	IsPrimary  bool      `gorm:"default:false;not null" json:"is_primary"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// Vendor entity
type Vendor struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"type:varchar(255);not null" json:"name"`
	Alias     string    `gorm:"type:varchar(100)" json:"alias"`
	PICName   string    `gorm:"type:varchar(255)" json:"pic_name"`
	PICEmail  string    `gorm:"type:varchar(255)" json:"pic_email"`
	PICPhone  string    `gorm:"type:varchar(50)" json:"pic_phone"`
	Address   string    `gorm:"type:text" json:"address"`
	IsActive  bool      `gorm:"default:true;not null" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Penawaran / Quotation
type Quotation struct {
	ID              uint64          `gorm:"primaryKey;autoIncrement" json:"id"`
	QuoteNumber     string          `gorm:"type:varchar(100);uniqueIndex;not null" json:"quote_number"`
	PublicToken     string          `gorm:"type:varchar(100);uniqueIndex" json:"public_token,omitempty"`
	CustomerID      uint64          `gorm:"index;not null" json:"customer_id"`
	Customer        Customer        `gorm:"foreignKey:CustomerID" json:"customer"`
	CreatedByUserID uint64          `gorm:"index;not null" json:"created_by_user_id"`
	CreatedByUser   User            `gorm:"foreignKey:CreatedByUserID" json:"created_by_user"`
	Currency        string          `gorm:"type:varchar(10);default:'IDR';not null" json:"currency"`
	DownPaymentPct  float64         `gorm:"type:decimal(5,2);default:0" json:"down_payment_pct"`
	ValidUntil      *time.Time      `json:"valid_until,omitempty"`
	PaymentTerms    string          `gorm:"type:varchar(150)" json:"payment_terms"`
	Incoterms       string          `gorm:"type:varchar(50);default:'EXW'" json:"incoterms,omitempty"`
	RiskLevel       string          `gorm:"type:varchar(50);default:'LOW'" json:"risk_level,omitempty"`
	ClauseNotes     string          `gorm:"type:text" json:"clause_notes,omitempty"`
	CustomerSignedBy string         `gorm:"type:varchar(255)" json:"customer_signed_by,omitempty"`
	CustomerSignedAt *time.Time     `json:"customer_signed_at,omitempty"`
	Status          string          `gorm:"type:varchar(50);default:'DRAFT';not null" json:"status"` // DRAFT, SENT, APPROVED, REJECTED, NEED_REVISION
	Subtotal        float64         `gorm:"type:decimal(15,2);default:0;not null" json:"subtotal"`
	TaxRate         float64         `gorm:"type:decimal(5,2);default:11;not null" json:"tax_rate"`
	TaxAmount       float64         `gorm:"type:decimal(15,2);default:0;not null" json:"tax_amount"`
	ShippingFee     float64         `gorm:"type:decimal(15,2);default:0;not null" json:"shipping_fee"`
	OtherFee        float64         `gorm:"type:decimal(15,2);default:0;not null" json:"other_fee"`
	TotalAmount     float64         `gorm:"type:decimal(15,2);default:0;not null" json:"total_amount"`
	CustomerNotes   string          `gorm:"type:text" json:"customer_notes,omitempty"`
	InternalNotes   string          `gorm:"type:text" json:"internal_notes,omitempty"`
	Items           []QuotationItem `gorm:"foreignKey:QuotationID" json:"items,omitempty"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
}

type QuotationItem struct {
	ID          uint64   `gorm:"primaryKey;autoIncrement" json:"id"`
	QuotationID uint64   `gorm:"index;not null" json:"quotation_id"`
	ProductID   *uint64  `gorm:"index" json:"product_id,omitempty"`
	Product     *Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	ItemName    string   `gorm:"type:varchar(255);not null" json:"item_name"`
	Description string   `gorm:"type:text" json:"description,omitempty"`
	Qty         int      `gorm:"not null" json:"qty"`
	Unit        string   `gorm:"type:varchar(50);default:'pcs';not null" json:"unit"`
	UnitPrice   float64  `gorm:"type:decimal(15,2);not null" json:"unit_price"`
	DiscountPct float64  `gorm:"type:decimal(5,2);default:0;not null" json:"discount_pct"`
	TotalPrice  float64  `gorm:"type:decimal(15,2);not null" json:"total_price"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Pesanan / Sales Order
type SalesOrder struct {
	ID              uint64           `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderNumber     string           `gorm:"type:varchar(100);uniqueIndex;not null" json:"order_number"`
	QuotationID     *uint64          `gorm:"index" json:"quotation_id,omitempty"`
	Quotation       *Quotation       `gorm:"foreignKey:QuotationID" json:"quotation,omitempty"`
	CustomerID      uint64           `gorm:"index;not null" json:"customer_id"`
	Customer        Customer         `gorm:"foreignKey:CustomerID" json:"customer"`
	CreatedByUserID uint64           `gorm:"index;not null" json:"created_by_user_id"`
	CreatedByUser   User             `gorm:"foreignKey:CreatedByUserID" json:"created_by_user"`
	Priority        string           `gorm:"type:varchar(20);default:'normal';not null" json:"priority"` // low, normal, high, urgent
	PlannedStart    *time.Time       `json:"planned_start,omitempty"`
	PlannedEnd      *time.Time       `json:"planned_end,omitempty"`
	ActualStart     *time.Time       `json:"actual_start,omitempty"`
	ActualEnd       *time.Time       `json:"actual_end,omitempty"`
	Status          string           `gorm:"type:varchar(50);default:'DRAFT';not null" json:"status"` // DRAFT, PUBLISHED, IN_PROGRESS, COMPLETED
	TotalAmount     float64          `gorm:"type:decimal(15,2);default:0;not null" json:"total_amount"`
	Remarks         string           `gorm:"type:text" json:"remarks,omitempty"`
	Items           []SalesOrderItem `gorm:"foreignKey:SalesOrderID" json:"items,omitempty"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
}

type SalesOrderItem struct {
	ID           uint64   `gorm:"primaryKey;autoIncrement" json:"id"`
	SalesOrderID uint64   `gorm:"index;not null" json:"sales_order_id"`
	ProductID    uint64   `gorm:"index;not null" json:"product_id"`
	Product      Product  `gorm:"foreignKey:ProductID" json:"product"`
	Qty          int      `gorm:"not null" json:"qty"`
	UnitPrice    float64  `gorm:"type:decimal(15,2);not null" json:"unit_price"`
	TotalPrice   float64  `gorm:"type:decimal(15,2);not null" json:"total_price"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Permintaan Material (Gudang & Produksi)
type MaterialRequest struct {
	ID              uint64                `gorm:"primaryKey;autoIncrement" json:"id"`
	RequestNumber   string                `gorm:"type:varchar(100);uniqueIndex;not null" json:"request_number"`
	WorkOrderID     uint64                `gorm:"index;not null" json:"work_order_id"`
	WorkOrder       WorkOrder             `gorm:"foreignKey:WorkOrderID" json:"work_order"`
	RequestedByID   uint64                `gorm:"index;not null" json:"requested_by_id"`
	RequestedBy     User                  `gorm:"foreignKey:RequestedByID" json:"requested_by"`
	CheckedByID     *uint64               `gorm:"index" json:"checked_by_id,omitempty"`
	CheckedBy       *User                 `gorm:"foreignKey:CheckedByID" json:"checked_by,omitempty"`
	Status          string                `gorm:"type:varchar(50);default:'DRAFT';not null" json:"status"` // DRAFT, WAITING_CHECK, AVAILABLE, ALLOCATED, ISSUED, SHORTAGE
	RequestDate     time.Time             `json:"request_date"`
	AllocationDate  *time.Time            `json:"allocation_date,omitempty"`
	Notes           string                `gorm:"type:text" json:"notes,omitempty"`
	Items           []MaterialRequestItem `gorm:"foreignKey:MaterialRequestID" json:"items,omitempty"`
	CreatedAt       time.Time             `json:"created_at"`
	UpdatedAt       time.Time             `json:"updated_at"`
}

type MaterialRequestItem struct {
	ID                uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	MaterialRequestID uint64    `gorm:"index;not null" json:"material_request_id"`
	MaterialID        uint64    `gorm:"index;not null" json:"material_id"`
	Material          Material  `gorm:"foreignKey:MaterialID" json:"material"`
	RequiredQty       float64   `gorm:"type:decimal(12,4);not null" json:"required_qty"`
	AvailableQty      float64   `gorm:"type:decimal(12,4);default:0;not null" json:"available_qty"`
	AllocatedQty      float64   `gorm:"type:decimal(12,4);default:0;not null" json:"allocated_qty"`
	Unit              string    `gorm:"type:varchar(50);not null" json:"unit"`
	Status            string    `gorm:"type:varchar(50);default:'PENDING';not null" json:"status"` // PENDING, READY, SHORTAGE, TAKEN
	Notes             string    `gorm:"type:varchar(255)" json:"notes,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// Purchase Order
type PurchaseOrder struct {
	ID              uint64              `gorm:"primaryKey;autoIncrement" json:"id"`
	PONumber        string              `gorm:"type:varchar(100);uniqueIndex;not null" json:"po_number"`
	VendorID        uint64              `gorm:"index;not null" json:"vendor_id"`
	Vendor          Vendor              `gorm:"foreignKey:VendorID" json:"vendor"`
	CreatedByUserID uint64              `gorm:"index;not null" json:"created_by_user_id"`
	CreatedByUser   User                `gorm:"foreignKey:CreatedByUserID" json:"created_by_user"`
	PODate          time.Time           `json:"po_date"`
	ExpectedDate    *time.Time          `json:"expected_date,omitempty"`
	Status          string              `gorm:"type:varchar(50);default:'DRAFT';not null" json:"status"`
	TotalAmount     float64             `gorm:"type:decimal(15,2);default:0;not null" json:"total_amount"`
	Notes           string              `gorm:"type:text" json:"notes,omitempty"`
	Items           []PurchaseOrderItem `gorm:"foreignKey:PurchaseOrderID" json:"items,omitempty"`
	CreatedAt       time.Time           `json:"created_at"`
	UpdatedAt       time.Time           `json:"updated_at"`
}

type PurchaseOrderItem struct {
	ID              uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	PurchaseOrderID uint64    `gorm:"index;not null" json:"purchase_order_id"`
	MaterialID      uint64    `gorm:"index;not null" json:"material_id"`
	Material        Material  `gorm:"foreignKey:MaterialID" json:"material"`
	Qty             float64   `gorm:"type:decimal(12,2);not null" json:"qty"`
	UnitCost        float64   `gorm:"type:decimal(15,2);not null" json:"unit_cost"`
	Subtotal        float64   `gorm:"type:decimal(15,2);not null" json:"subtotal"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// Invoice entity
type Invoice struct {
	ID              uint64        `gorm:"primaryKey;autoIncrement" json:"id"`
	InvoiceNumber   string        `gorm:"type:varchar(100);uniqueIndex;not null" json:"invoice_number"`
	SalesOrderID    uint64        `gorm:"index;not null" json:"sales_order_id"`
	SalesOrder      SalesOrder    `gorm:"foreignKey:SalesOrderID" json:"sales_order"`
	InvoiceType     string        `gorm:"type:varchar(50);default:'DOWN_PAYMENT';not null" json:"invoice_type"` // DOWN_PAYMENT, FULL_PAYMENT, FINAL_SETTLEMENT
	IssueDate       time.Time     `json:"issue_date"`
	DueDate         time.Time     `json:"due_date"`
	TotalAmount     float64       `gorm:"type:decimal(15,2);not null" json:"total_amount"`
	PaidAmount      float64       `gorm:"type:decimal(15,2);default:0;not null" json:"paid_amount"`
	PaymentStatus   string        `gorm:"type:varchar(50);default:'UNPAID';not null" json:"payment_status"` // UNPAID, PARTIAL, PAID
	Notes           string        `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
}
