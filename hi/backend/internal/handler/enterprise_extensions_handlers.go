package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/kayukwas/tracking-backend/internal/service"
	"github.com/kayukwas/tracking-backend/internal/utils"
)

type EnterpriseExtensionsHandlers struct {
	extServ service.EnterpriseExtensionsService
}

func NewEnterpriseExtensionsHandlers(extServ service.EnterpriseExtensionsService) *EnterpriseExtensionsHandlers {
	return &EnterpriseExtensionsHandlers{extServ: extServ}
}

// ----------------- Engineering Change Orders (ECO) -----------------
func (h *EnterpriseExtensionsHandlers) ListECOs(c *fiber.Ctx) error {
	status := c.Query("status", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	list, total, err := h.extServ.ListECOs(status, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar ECO", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar Engineering Change Orders (ECO)", fiber.Map{
		"ecos":  list,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *EnterpriseExtensionsHandlers) GetECOByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID ECO tidak valid", nil)
	}

	eco, err := h.extServ.GetECOByID(id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "ECO tidak ditemukan", nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Detail ECO", eco)
}

func (h *EnterpriseExtensionsHandlers) CreateECO(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateECODTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	eco, err := h.extServ.CreateECO(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Engineering Change Order berhasil dibuat", eco)
}

func (h *EnterpriseExtensionsHandlers) ApproveAndApplyECO(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID ECO tidak valid", nil)
	}

	if err := h.extServ.ApproveAndApplyECO(actorID, id); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "ECO disetujui & resep BOM otomatis diperbarui ke versi baru", nil)
}

// ----------------- ShopFloor Live Kiosk -----------------
func (h *EnterpriseExtensionsHandlers) ListShopFloorLogs(c *fiber.Ctx) error {
	wosID, _ := strconv.ParseUint(c.Query("wos_id", "0"), 10, 64)
	status := c.Query("status", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	list, total, err := h.extServ.ListShopFloorLogs(wosID, status, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil log operator", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar log operator mesin shopfloor", fiber.Map{
		"logs":  list,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *EnterpriseExtensionsHandlers) ClockInShopFloor(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.ClockInShopFloorDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	log, err := h.extServ.ClockInShopFloor(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Operator berhasil Clock-In ke stasiun pengerjaan", log)
}

func (h *EnterpriseExtensionsHandlers) ClockOutShopFloor(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID log tidak valid", nil)
	}

	var dto service.ClockOutShopFloorDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	if err := h.extServ.ClockOutShopFloor(actorID, id, dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Clock-Out shift operator berhasil dicatat", nil)
}

// ----------------- Preventive Maintenance -----------------
func (h *EnterpriseExtensionsHandlers) ListMaintenanceTasks(c *fiber.Ctx) error {
	status := c.Query("status", "")
	taskType := c.Query("type", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	list, total, err := h.extServ.ListMaintenanceTasks(status, taskType, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil jadwal perawatan", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar jadwal perawatan mesin pabrik", fiber.Map{
		"tasks": list,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *EnterpriseExtensionsHandlers) CreateMaintenanceTask(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateMaintenanceTaskDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	task, err := h.extServ.CreateMaintenanceTask(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Jadwal perawatan mesin berhasil dibuat", task)
}

func (h *EnterpriseExtensionsHandlers) CompleteMaintenanceTask(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID tugas tidak valid", nil)
	}

	type payload struct {
		ActionLog string `json:"action_log"`
	}
	var p payload
	_ = c.BodyParser(&p)

	if err := h.extServ.CompleteMaintenanceTask(actorID, id, p.ActionLog); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Perawatan mesin ditandai selesai", nil)
}

// ----------------- Unbuild Orders -----------------
func (h *EnterpriseExtensionsHandlers) ListUnbuildOrders(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	list, total, err := h.extServ.ListUnbuildOrders(page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar unbuild", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar unbuild / pembongkaran produk jadi", fiber.Map{
		"unbuild_orders": list,
		"total":          total,
		"page":           page,
		"limit":          limit,
	})
}

func (h *EnterpriseExtensionsHandlers) GetUnbuildByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID unbuild tidak valid", nil)
	}

	ub, err := h.extServ.GetUnbuildByID(id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "Data unbuild tidak ditemukan", nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Detail unbuild", ub)
}

func (h *EnterpriseExtensionsHandlers) CreateUnbuildOrder(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateUnbuildOrderDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	ub, err := h.extServ.CreateUnbuildOrder(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Perintah pembongkaran berhasil dibuat", ub)
}

func (h *EnterpriseExtensionsHandlers) ExecuteUnbuild(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID unbuild tidak valid", nil)
	}

	if err := h.extServ.ExecuteUnbuild(actorID, id); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Pembongkaran selesai: komponen material berhasil dikembalikan ke stok gudang", nil)
}
