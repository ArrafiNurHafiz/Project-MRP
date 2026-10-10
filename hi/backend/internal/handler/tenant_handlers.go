package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/kayukwas/tracking-backend/internal/service"
	"github.com/kayukwas/tracking-backend/internal/utils"
)

type TenantSaaSHandlers struct {
	saasServ service.TenantSaaSService
}

func NewTenantSaaSHandlers(saasServ service.TenantSaaSService) *TenantSaaSHandlers {
	return &TenantSaaSHandlers{saasServ: saasServ}
}

// ---------------- Public & Admin SaaS Endpoints ----------------

func (h *TenantSaaSHandlers) GetPricingPlans(c *fiber.Ctx) error {
	plans := h.saasServ.GetPricingPlans()
	return utils.JSONSuccess(c, fiber.StatusOK, "Paket harga langganan SaaS MRP", plans)
}

func (h *TenantSaaSHandlers) GetSaaSOverview(c *fiber.Ctx) error {
	stats, err := h.saasServ.GetSaaSOverview()
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil data ringkasan SaaS", err.Error())
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Ringkasan metrik SaaS Platform", stats)
}

func (h *TenantSaaSHandlers) ListTenants(c *fiber.Ctx) error {
	search := c.Query("search", "")
	tier := c.Query("tier", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	tenants, total, err := h.saasServ.ListTenants(search, tier, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar klien tenant", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar perusahaan klien SaaS", fiber.Map{
		"tenants": tenants,
		"total":   total,
		"page":    page,
		"limit":   limit,
	})
}

func (h *TenantSaaSHandlers) GetTenantByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID tenant tidak valid", nil)
	}

	tenant, err := h.saasServ.GetTenantByID(id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "Perusahaan klien tidak ditemukan", nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Detail tenant", tenant)
}

func (h *TenantSaaSHandlers) CreateTenant(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateTenantDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	tenant, err := h.saasServ.CreateTenant(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Perusahaan klien baru berhasil didaftarkan", tenant)
}

func (h *TenantSaaSHandlers) UpdateSubscription(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID tenant tidak valid", nil)
	}

	var dto service.UpdateTenantSubscriptionDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	tenant, err := h.saasServ.UpdateSubscription(actorID, id, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Status langganan tenant berhasil diperbarui", tenant)
}
