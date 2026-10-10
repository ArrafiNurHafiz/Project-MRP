package models

import (
	"time"
)

const (
	PlanTierTrial      = "TRIAL"
	PlanTierStarter    = "STARTER"
	PlanTierPro        = "PROFESSIONAL"
	PlanTierEnterprise = "ENTERPRISE"

	TenantStatusActive    = "ACTIVE"
	TenantStatusSuspended = "SUSPENDED"
	TenantStatusTrial     = "TRIAL"
	TenantStatusExpired   = "EXPIRED"
)

// Tenant (Perusahaan Klien SaaS)
type Tenant struct {
	ID                    uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name                  string     `gorm:"type:varchar(255);not null" json:"name"` // Nama PT / CV Klien
	Slug                  string     `gorm:"type:varchar(100);uniqueIndex;not null" json:"slug"` // Subdomain / kode unik
	Industry              string     `gorm:"type:varchar(100);not null" json:"industry"` // Furniture/Wood, F&B, Garment, Metal
	PlanTier              string     `gorm:"type:varchar(50);default:'TRIAL';not null" json:"plan_tier"`
	Status                string     `gorm:"type:varchar(50);default:'ACTIVE';not null" json:"status"`
	MonthlyPrice          float64    `gorm:"type:decimal(15,2);default:0" json:"monthly_price"`
	MaxUsers              int        `gorm:"default:5;not null" json:"max_users"`
	MaxOrdersPerMonth     int        `gorm:"default:50;not null" json:"max_orders_per_month"`
	SubscriptionExpiresAt *time.Time `json:"subscription_expires_at,omitempty"`

	// Company Details & White-label
	NPWP                  string     `gorm:"type:varchar(50)" json:"npwp"`
	Email                 string     `gorm:"type:varchar(255)" json:"email"`
	Phone                 string     `gorm:"type:varchar(50)" json:"phone"`
	Address               string     `gorm:"type:text" json:"address"`
	LogoURL               string     `gorm:"type:text" json:"logo_url,omitempty"`
	OwnerUserID           uint64     `gorm:"index" json:"owner_user_id"`
	OwnerUser             *User      `gorm:"foreignKey:OwnerUserID" json:"owner_user,omitempty"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
}

type SaaSPlanInfo struct {
	Tier              string   `json:"tier"`
	Name              string   `json:"name"`
	PriceIDRPerMonth  float64  `json:"price_idr_per_month"`
	MaxUsers          int      `json:"max_users"`
	MaxOrdersPerMonth int      `json:"max_orders_per_month"`
	Features          []string `json:"features"`
}
