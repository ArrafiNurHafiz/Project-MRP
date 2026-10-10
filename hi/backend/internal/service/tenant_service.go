package service

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/kayukwas/tracking-backend/internal/models"
	"github.com/kayukwas/tracking-backend/internal/repository"
)

type CreateTenantDTO struct {
	Name              string  `json:"name"`
	Slug              string  `json:"slug"`
	Industry          string  `json:"industry"`
	PlanTier          string  `json:"plan_tier"` // STARTER, PROFESSIONAL, ENTERPRISE
	MonthlyPrice      float64 `json:"monthly_price"`
	NPWP              string  `json:"npwp"`
	Email             string  `json:"email"`
	Phone             string  `json:"phone"`
	Address           string  `json:"address"`
	OwnerName         string  `json:"owner_name"`
	OwnerEmail        string  `json:"owner_email"`
	OwnerPhone        string  `json:"owner_phone"`
}

type UpdateTenantSubscriptionDTO struct {
	PlanTier          string `json:"plan_tier"`
	Status            string `json:"status"` // ACTIVE, SUSPENDED, EXPIRED
	MonthsToAdd       int    `json:"months_to_add"`
	MonthlyPrice      float64 `json:"monthly_price"`
}

type TenantSaaSService interface {
	ListTenants(search, planTier string, page, limit int) ([]models.Tenant, int64, error)
	GetTenantByID(id uint64) (*models.Tenant, error)
	GetTenantBySlug(slug string) (*models.Tenant, error)
	CreateTenant(actorID uint64, dto CreateTenantDTO) (*models.Tenant, error)
	UpdateSubscription(actorID, id uint64, dto UpdateTenantSubscriptionDTO) (*models.Tenant, error)
	GetPricingPlans() []models.SaaSPlanInfo
	GetSaaSOverview() (map[string]interface{}, error)
}

type tenantSaaSService struct {
	repo      repository.TenantRepository
	userRepo  repository.UserRepository
	roleRepo  repository.RoleRepository
	auditServ AuditLogService
}

func NewTenantSaaSService(
	repo repository.TenantRepository,
	userRepo repository.UserRepository,
	roleRepo repository.RoleRepository,
	auditServ AuditLogService,
) TenantSaaSService {
	return &tenantSaaSService{
		repo:      repo,
		userRepo:  userRepo,
		roleRepo:  roleRepo,
		auditServ: auditServ,
	}
}

func (s *tenantSaaSService) GetPricingPlans() []models.SaaSPlanInfo {
	return []models.SaaSPlanInfo{
		{
			Tier:              models.PlanTierTrial,
			Name:              "14-Day Free Industrial Trial",
			PriceIDRPerMonth:  0,
			MaxUsers:          3,
			MaxOrdersPerMonth: 20,
			Features: []string{
				"Order Simulation Engine (BOM Explosion)",
				"Work Orders (SPK 5-Stasiun)",
				"WhatsApp Notification Notifier",
				"Dasar Pengelolaan Bahan & Stok ROP",
			},
		},
		{
			Tier:              models.PlanTierStarter,
			Name:              "Starter SME (Pabrik Skala Kecil)",
			PriceIDRPerMonth:  1499000,
			MaxUsers:          10,
			MaxOrdersPerMonth: 100,
			Features: []string{
				"Semua Fitur Trial",
				"Multi-PIC Customer & Vendor Directory",
				"Perintah Kerja & Upah Borongan Mitra",
				"Surat Jalan & Manifest Logistik",
				"Invoice Down Payment (DP) & Pelunasan",
			},
		},
		{
			Tier:              models.PlanTierPro,
			Name:              "Professional (Manufaktur Berkembang)",
			PriceIDRPerMonth:  3499000,
			MaxUsers:          30,
			MaxOrdersPerMonth: 500,
			Features: []string{
				"Semua Fitur Starter",
				"3-Tier QC Inspection & Rework Defect Loop",
				"Shopfloor Machine Downtime & OEE Analytics",
				"Batch / Lot Tracking (Kadar Air & SVLK)",
				"Multi-Currency FX & Incoterms FOB/CIF",
				"Bulk Import Template CSV di Semua Modul",
			},
		},
		{
			Tier:              models.PlanTierEnterprise,
			Name:              "Enterprise Multi-Plant",
			PriceIDRPerMonth:  7999000,
			MaxUsers:          100,
			MaxOrdersPerMonth: 5000,
			Features: []string{
				"Semua Fitur Professional",
				"White-label Custom Domain & Branding Logo",
				"Dedicated WhatsApp AI Agentic Automation",
				"Unlimited Historical Audit Trail",
				"SLA 99.9% Support & Onsite Training",
			},
		},
	}
}

func (s *tenantSaaSService) ListTenants(search, planTier string, page, limit int) ([]models.Tenant, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.repo.FindAll(search, planTier, limit, offset)
}

func (s *tenantSaaSService) GetTenantByID(id uint64) (*models.Tenant, error) {
	return s.repo.FindByID(id)
}

func (s *tenantSaaSService) GetTenantBySlug(slug string) (*models.Tenant, error) {
	return s.repo.FindBySlug(slug)
}

func (s *tenantSaaSService) CreateTenant(actorID uint64, dto CreateTenantDTO) (*models.Tenant, error) {
	if dto.Name == "" || dto.Slug == "" {
		return nil, errors.New("nama perusahaan dan slug unik wajib diisi")
	}

	slug := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(dto.Slug), " ", "-"))
	existing, _ := s.repo.FindBySlug(slug)
	if existing != nil && existing.ID > 0 {
		return nil, errors.New("slug/subdomain perusahaan sudah terdaftar")
	}

	maxUsers := 10
	maxOrders := 100
	tier := dto.PlanTier
	if tier == "" {
		tier = models.PlanTierStarter
	}
	if tier == models.PlanTierPro {
		maxUsers = 30
		maxOrders = 500
	} else if tier == models.PlanTierEnterprise {
		maxUsers = 100
		maxOrders = 5000
	}

	expires := time.Now().AddDate(0, 1, 0) // 1 Month active by default

	tenant := &models.Tenant{
		Name:                  dto.Name,
		Slug:                  slug,
		Industry:              dto.Industry,
		PlanTier:              tier,
		Status:                models.TenantStatusActive,
		MonthlyPrice:          dto.MonthlyPrice,
		MaxUsers:              maxUsers,
		MaxOrdersPerMonth:     maxOrders,
		SubscriptionExpiresAt: &expires,
		NPWP:                  dto.NPWP,
		Email:                 dto.Email,
		Phone:                 dto.Phone,
		Address:               dto.Address,
	}

	if err := s.repo.Create(tenant); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "CREATE_SAAS_TENANT", fmt.Sprintf("Pendaftaran Klien SaaS Baru: %s (Paket %s, MRR Rp %.2f)", dto.Name, tier, dto.MonthlyPrice))
	return tenant, nil
}

func (s *tenantSaaSService) UpdateSubscription(actorID, id uint64, dto UpdateTenantSubscriptionDTO) (*models.Tenant, error) {
	t, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if dto.PlanTier != "" {
		t.PlanTier = dto.PlanTier
	}
	if dto.Status != "" {
		t.Status = dto.Status
	}
	if dto.MonthlyPrice > 0 {
		t.MonthlyPrice = dto.MonthlyPrice
	}
	if dto.MonthsToAdd > 0 {
		base := time.Now()
		if t.SubscriptionExpiresAt != nil && t.SubscriptionExpiresAt.After(base) {
			base = *t.SubscriptionExpiresAt
		}
		newExp := base.AddDate(0, dto.MonthsToAdd, 0)
		t.SubscriptionExpiresAt = &newExp
		t.Status = models.TenantStatusActive
	}

	if err := s.repo.Update(t); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "UPDATE_SAAS_SUBSCRIPTION", fmt.Sprintf("Perpanjangan Langganan %s: Paket %s s.d %v", t.Name, t.PlanTier, t.SubscriptionExpiresAt))
	return t, nil
}

func (s *tenantSaaSService) GetSaaSOverview() (map[string]interface{}, error) {
	return s.repo.GetOverviewStats()
}
