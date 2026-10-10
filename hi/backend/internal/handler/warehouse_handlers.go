package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/kayukwas/tracking-backend/internal/service"
	"github.com/kayukwas/tracking-backend/internal/utils"
)

type WarehouseHandlers struct {
	whService service.WarehouseService
}

func NewWarehouseHandlers(whService service.WarehouseService) *WarehouseHandlers {
	return &WarehouseHandlers{whService: whService}
}

// ----------------- Warehouses -----------------
func (h *WarehouseHandlers) ListWarehouses(c *fiber.Ctx) error {
	tenantID, _ := strconv.ParseUint(c.Get("X-Tenant-ID", "0"), 10, 64)
	if tenantID == 0 {
		tenantID, _ = strconv.ParseUint(c.Query("tenant_id", "0"), 10, 64)
	}
	search := c.Query("search", "")

	list, err := h.whService.ListWarehouses(tenantID, search)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar gudang", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar gudang", fiber.Map{
		"warehouses": list,
		"total":      len(list),
	})
}

func (h *WarehouseHandlers) GetWarehouseByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID gudang tidak valid", nil)
	}

	wh, err := h.whService.GetWarehouseByID(id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "Gudang tidak ditemukan", nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Detail gudang", wh)
}

func (h *WarehouseHandlers) CreateWarehouse(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateWarehouseDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Payload tidak valid", err.Error())
	}

	if dto.TenantID == 0 {
		tID, _ := strconv.ParseUint(c.Get("X-Tenant-ID", "1"), 10, 64)
		if tID > 0 {
			dto.TenantID = tID
		} else {
			dto.TenantID = 1
		}
	}

	wh, err := h.whService.CreateWarehouse(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Gudang berhasil dibuat", wh)
}

func (h *WarehouseHandlers) UpdateWarehouse(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID gudang tidak valid", nil)
	}

	var dto service.CreateWarehouseDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Payload tidak valid", err.Error())
	}

	wh, err := h.whService.UpdateWarehouse(actorID, id, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Gudang berhasil diperbarui", wh)
}

func (h *WarehouseHandlers) DeleteWarehouse(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID gudang tidak valid", nil)
	}

	if err := h.whService.DeleteWarehouse(actorID, id); err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Gudang berhasil dihapus", nil)
}

// ----------------- Stock Transfers -----------------
func (h *WarehouseHandlers) ListStockTransfers(c *fiber.Ctx) error {
	tenantID, _ := strconv.ParseUint(c.Get("X-Tenant-ID", "0"), 10, 64)
	if tenantID == 0 {
		tenantID, _ = strconv.ParseUint(c.Query("tenant_id", "0"), 10, 64)
	}
	search := c.Query("search", "")

	list, err := h.whService.ListStockTransfers(tenantID, search)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar mutasi transfer stok", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar mutasi transfer stok", fiber.Map{
		"transfers": list,
		"total":     len(list),
	})
}

func (h *WarehouseHandlers) CreateStockTransfer(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateStockTransferDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Payload tidak valid", err.Error())
	}

	if dto.TenantID == 0 {
		tID, _ := strconv.ParseUint(c.Get("X-Tenant-ID", "1"), 10, 64)
		if tID > 0 {
			dto.TenantID = tID
		} else {
			dto.TenantID = 1
		}
	}

	st, err := h.whService.CreateStockTransfer(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Mutasi transfer stok berhasil dibuat", st)
}

func (h *WarehouseHandlers) CompleteStockTransfer(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID transfer tidak valid", nil)
	}

	if err := h.whService.CompleteStockTransfer(actorID, id); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Transfer stok berhasil diselesaikan & inventori diperbarui", nil)
}

func (h *WarehouseHandlers) CancelStockTransfer(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID transfer tidak valid", nil)
	}

	if err := h.whService.CancelStockTransfer(actorID, id); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Transfer stok dibatalkan", nil)
}

// ----------------- Stock Adjustments -----------------
func (h *WarehouseHandlers) ListStockAdjustments(c *fiber.Ctx) error {
	tenantID, _ := strconv.ParseUint(c.Get("X-Tenant-ID", "0"), 10, 64)
	if tenantID == 0 {
		tenantID, _ = strconv.ParseUint(c.Query("tenant_id", "0"), 10, 64)
	}

	list, err := h.whService.ListStockAdjustments(tenantID)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar penyesuaian stok", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar penyesuaian stok", fiber.Map{
		"adjustments": list,
		"total":       len(list),
	})
}

func (h *WarehouseHandlers) CreateStockAdjustment(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateStockAdjustmentDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Payload tidak valid", err.Error())
	}

	if dto.TenantID == 0 {
		tID, _ := strconv.ParseUint(c.Get("X-Tenant-ID", "1"), 10, 64)
		if tID > 0 {
			dto.TenantID = tID
		} else {
			dto.TenantID = 1
		}
	}

	adj, err := h.whService.CreateStockAdjustment(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Draft penyesuaian stok berhasil dicatat", adj)
}

func (h *WarehouseHandlers) ApproveStockAdjustment(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID penyesuaian tidak valid", nil)
	}

	if err := h.whService.ApproveStockAdjustment(actorID, id); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Penyesuaian stok disetujui & stok master disinkronkan", nil)
}
