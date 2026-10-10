package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/kayukwas/tracking-backend/internal/service"
	"github.com/kayukwas/tracking-backend/internal/utils"
)

type IndustrialMRPHandlers struct {
	serv service.IndustrialMRPService
}

func NewIndustrialMRPHandlers(serv service.IndustrialMRPService) *IndustrialMRPHandlers {
	return &IndustrialMRPHandlers{serv: serv}
}

// ----------------- Machine Downtime (OEE) -----------------
func (h *IndustrialMRPHandlers) ListDowntimes(c *fiber.Ctx) error {
	stationID, _ := strconv.ParseUint(c.Query("station_id", "0"), 10, 64)
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	list, total, err := h.serv.ListDowntimes(stationID, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil data downtime mesin", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar kendala mesin produksi", fiber.Map{
		"downtimes": list,
		"total":     total,
		"page":      page,
		"limit":     limit,
	})
}

func (h *IndustrialMRPHandlers) ReportDowntime(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateDowntimeDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	dt, err := h.serv.ReportDowntime(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Kendala mesin berhasil dilaporkan", dt)
}

func (h *IndustrialMRPHandlers) ResolveDowntime(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID downtime tidak valid", nil)
	}

	var dto service.CloseDowntimeDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	if err := h.serv.ResolveDowntime(actorID, id, dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Kendala mesin berhasil ditutup dan mesin kembali beroperasi", nil)
}

// ----------------- Rework Orders -----------------
func (h *IndustrialMRPHandlers) ListReworkOrders(c *fiber.Ctx) error {
	status := c.Query("status", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	list, total, err := h.serv.ListReworkOrders(status, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil data rework order", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar perintah rework perbaikan cacat", fiber.Map{
		"rework_orders": list,
		"total":         total,
		"page":          page,
		"limit":         limit,
	})
}

func (h *IndustrialMRPHandlers) CreateReworkOrder(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateReworkOrderDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	ro, err := h.serv.CreateReworkOrder(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Surat perintah rework berhasil diterbitkan", ro)
}

func (h *IndustrialMRPHandlers) UpdateReworkProgress(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID rework tidak valid", nil)
	}

	var dto service.UpdateReworkDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	if err := h.serv.UpdateReworkProgress(actorID, id, dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Progres rework berhasil diperbarui", nil)
}

// ----------------- Batch / Lot Tracking -----------------
func (h *IndustrialMRPHandlers) ListBatchLots(c *fiber.Ctx) error {
	materialID, _ := strconv.ParseUint(c.Query("material_id", "0"), 10, 64)
	search := c.Query("search", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	list, total, err := h.serv.ListBatchLots(materialID, search, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil data lot material", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar lot kedatangan material kayu & kimia", fiber.Map{
		"lots":  list,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *IndustrialMRPHandlers) RegisterBatchLot(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateBatchLotDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	lot, err := h.serv.RegisterBatchLot(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Registrasi lot kayu berhasil disimpan", lot)
}
