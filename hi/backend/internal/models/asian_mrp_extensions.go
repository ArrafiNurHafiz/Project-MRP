package models

import (
	"time"
)

// ----------------- 1. Landed Cost Allocation (HashMicro & Deskera Standard) -----------------
type LandedCost struct {
	ID              uint64           `gorm:"primaryKey;autoIncrement" json:"id"`
	DocumentNumber  string           `gorm:"type:varchar(100);uniqueIndex;not null" json:"document_number"` // LC-2026-09-001
	PurchaseOrderID uint64           `gorm:"index;not null" json:"purchase_order_id"`
	PurchaseOrder   PurchaseOrder    `gorm:"foreignKey:PurchaseOrderID" json:"purchase_order"`
	FreightCost     float64          `gorm:"type:decimal(15,2);default:0" json:"freight_cost"`     // Ongkir Truk Kontainer / Ekspedisi
	CustomsDuty     float64          `gorm:"type:decimal(15,2);default:0" json:"customs_duty"`     // Bea Masuk / Cukai Kayu
	InsuranceFee    float64          `gorm:"type:decimal(15,2);default:0" json:"insurance_fee"`    // Asuransi Muatan
	HandlingFee     float64          `gorm:"type:decimal(15,2);default:0" json:"handling_fee"`     // Biaya Bongkar Muat Kuli
	TotalLandedCost float64          `gorm:"type:decimal(15,2);default:0" json:"total_landed_cost"`
	AllocationMethod string          `gorm:"type:varchar(50);default:'BY_VALUE'" json:"allocation_method"` // BY_VALUE, BY_QUANTITY, BY_WEIGHT
	Status          string           `gorm:"type:varchar(50);default:'DRAFT';not null" json:"status"` // DRAFT, ALLOCATED, POSTED
	Items           []LandedCostItem `gorm:"foreignKey:LandedCostID" json:"items,omitempty"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
}

type LandedCostItem struct {
	ID                 uint64   `gorm:"primaryKey;autoIncrement" json:"id"`
	LandedCostID       uint64   `gorm:"index;not null" json:"landed_cost_id"`
	MaterialID         uint64   `gorm:"index;not null" json:"material_id"`
	Material           Material `gorm:"foreignKey:MaterialID" json:"material"`
	BasePurchasedCost  float64  `gorm:"type:decimal(15,2);not null" json:"base_purchased_cost"`
	AllocatedExtraCost float64  `gorm:"type:decimal(15,2);not null" json:"allocated_extra_cost"`
	FinalTrueUnitCost  float64  `gorm:"type:decimal(15,2);not null" json:"final_true_unit_cost"`
}

// ----------------- 2. Subcontracting / Maklon Material Reconcile (HashMicro Standard) -----------------
type SubcontractReconciliation struct {
	ID                uint64              `gorm:"primaryKey;autoIncrement" json:"id"`
	ReconcileNumber   string              `gorm:"type:varchar(100);uniqueIndex;not null" json:"reconcile_number"` // REC-2026-09-001
	MitraUserID       uint64              `gorm:"index;not null" json:"mitra_user_id"`
	MitraUser         User                `gorm:"foreignKey:MitraUserID" json:"mitra_user"`
	WorkOrderID       uint64              `gorm:"index;not null" json:"work_order_id"`
	WorkOrder         WorkOrder           `gorm:"foreignKey:WorkOrderID" json:"work_order"`
	SentQuantity      int                 `gorm:"not null" json:"sent_quantity"`      // Unit barang mentah dikirim ke bengkel mitra
	ReceivedQuantity  int                 `gorm:"not null" json:"received_quantity"`  // Unit barang jadi hasil maklon
	RejectQuantity    int                 `gorm:"default:0" json:"reject_quantity"`   // Unit rusak di pihak mitra
	MaterialYieldPct  float64             `gorm:"type:decimal(5,2);not null" json:"material_yield_pct"` // % Efisiensi Rendemen Kayu
	MitraFeePayable   float64             `gorm:"type:decimal(15,2);not null" json:"mitra_fee_payable"` // Total Tagihan Jasa Borongan
	PenaltyDeduction  float64             `gorm:"type:decimal(15,2);default:0" json:"penalty_deduction"` // Denda jika merusak material
	FinalPayoutAmount float64             `gorm:"type:decimal(15,2);not null" json:"final_payout_amount"`
	Status            string              `gorm:"type:varchar(50);default:'RECONCILED';not null" json:"status"` // PENDING, RECONCILED, PAID
	Notes             string              `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt         time.Time           `json:"created_at"`
	UpdatedAt         time.Time           `json:"updated_at"`
}

// ----------------- 3. Factory Electricity & Overhead Cost Absorption (Kledo / Equine Standard) -----------------
type OverheadAbsorption struct {
	ID                  uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	PeriodMonth         string    `gorm:"type:varchar(20);not null" json:"period_month"` // e.g. "2026-09"
	ElectricityCost     float64   `gorm:"type:decimal(15,2);default:0" json:"electricity_cost"` // Tagihan Listrik PLN Pabrik
	FactoryRentCost     float64   `gorm:"type:decimal(15,2);default:0" json:"factory_rent_cost"` // Biaya Sewa Kompleks Pabrik
	DepreciationCost    float64   `gorm:"type:decimal(15,2);default:0" json:"depreciation_cost"` // Penyusutan Mesin CNC/Spindle
	ConsumableCost      float64   `gorm:"type:decimal(15,2);default:0" json:"consumable_cost"` // Oli, Baut, Sarung Tangan, Lakban
	TotalOverheadCost   float64   `gorm:"type:decimal(15,2);default:0" json:"total_overhead_cost"`
	TotalProductionQty  int       `gorm:"default:0;not null" json:"total_production_qty"`
	OverheadRatePerUnit float64   `gorm:"type:decimal(12,2);not null" json:"overhead_rate_per_unit"`
	Status              string    `gorm:"type:varchar(50);default:'ALLOCATED';not null" json:"status"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}
