package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/kayukwas/tracking-backend/internal/service"
	"github.com/kayukwas/tracking-backend/internal/utils"
)

type AsianMRPExtensionsHandlers struct {
	serv service.AsianMRPExtensionsService
}

func NewAsianMRPExtensionsHandlers(serv service.AsianMRPExtensionsService) *AsianMRPExtensionsHandlers {
	return &AsianMRPExtensionsHandlers{serv: serv}
}

// ----------------- Landed Cost -----------------
func (h *AsianMRPExtensionsHandlers) ListLandedCosts(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	list, total, err := h.serv.ListLandedCosts(page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil data landed cost", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar alokasi landed cost", fiber.Map{
		"landed_costs": list,
		"total":        total,
		"page":         page,
		"limit":        limit,
	})
}

func (h *AsianMRPExtensionsHandlers) GetLandedCostByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID tidak valid", nil)
	}

	lc, err := h.serv.GetLandedCostByID(id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "Landed cost tidak ditemukan", nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Detail landed cost", lc)
}

func (h *AsianMRPExtensionsHandlers) CreateLandedCost(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateLandedCostDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	lc, err := h.serv.CreateLandedCost(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Landed cost berhasil dialokasikan", lc)
}

func (h *AsianMRPExtensionsHandlers) PostLandedCost(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID tidak valid", nil)
	}

	if err := h.serv.PostLandedCost(actorID, id); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Landed cost berhasil diposting ke Master Bahan Baku", nil)
}

// ----------------- Subcontract Reconciliation -----------------
func (h *AsianMRPExtensionsHandlers) ListSubcontractReconciliations(c *fiber.Ctx) error {
	mitraID, _ := strconv.ParseUint(c.Query("mitra_id", "0"), 10, 64)
	status := c.Query("status", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	list, total, err := h.serv.ListSubcontractReconciliations(mitraID, status, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil data rekonsiliasi maklon", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar rekonsiliasi maklon mitra", fiber.Map{
		"reconciliations": list,
		"total":           total,
		"page":            page,
		"limit":           limit,
	})
}

func (h *AsianMRPExtensionsHandlers) CreateSubcontractReconciliation(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateSubcontractReconcileDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	rec, err := h.serv.CreateSubcontractReconciliation(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Rekonsiliasi maklon berhasil disimpan", rec)
}

func (h *AsianMRPExtensionsHandlers) PaySubcontractReconciliation(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID tidak valid", nil)
	}

	if err := h.serv.PaySubcontractReconciliation(actorID, id); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Borongan maklon berhasil ditandai lunas", nil)
}

// ----------------- Overhead Absorption -----------------
func (h *AsianMRPExtensionsHandlers) ListOverheadAbsorptions(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	list, total, err := h.serv.ListOverheadAbsorptions(page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil data overhead", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar alokasi overhead pabrik", fiber.Map{
		"overheads": list,
		"total":     total,
		"page":      page,
		"limit":     limit,
	})
}

func (h *AsianMRPExtensionsHandlers) CalculateAndStoreOverhead(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateOverheadAbsorptionDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	ov, err := h.serv.CalculateAndStoreOverhead(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Absorpsi overhead pabrik berhasil dihitung", ov)
}
