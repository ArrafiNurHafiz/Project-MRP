package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/kayukwas/tracking-backend/internal/service"
	"github.com/kayukwas/tracking-backend/internal/utils"
)

type FulfillmentHandler struct {
	serv service.FulfillmentService
}

func NewFulfillmentHandler(serv service.FulfillmentService) *FulfillmentHandler {
	return &FulfillmentHandler{serv: serv}
}

// ----------------- Inbound Goods Receipt Handlers -----------------

func (h *FulfillmentHandler) CreateGoodsReceipt(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateGoodsReceiptDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Payload penerimaan barang tidak valid", err.Error())
	}

	gr, err := h.serv.CreateGoodsReceipt(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal membuat penerimaan barang", err.Error())
	}
	return utils.JSONSuccess(c, fiber.StatusCreated, "Bukti penerimaan barang (GRN) berhasil diterbitkan", gr)
}

func (h *FulfillmentHandler) ListGoodsReceipts(c *fiber.Ctx) error {
	search := c.Query("search", "")
	status := c.Query("status", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	receipts, total, err := h.serv.ListGoodsReceipts(search, status, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal memuat daftar penerimaan barang", err.Error())
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar penerimaan barang", fiber.Map{
		"goods_receipts": receipts,
		"total":          total,
		"page":           page,
		"limit":          limit,
	})
}

func (h *FulfillmentHandler) GetGoodsReceiptByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID tidak valid", nil)
	}

	gr, err := h.serv.GetGoodsReceiptByID(id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "Bukti penerimaan barang tidak ditemukan", nil)
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Detail penerimaan barang", gr)
}

func (h *FulfillmentHandler) ConfirmGoodsReceipt(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID tidak valid", nil)
	}

	gr, err := h.serv.ConfirmGoodsReceipt(actorID, id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengonfirmasi penerimaan barang", err.Error())
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Penerimaan barang berhasil dikonfirmasi", gr)
}

// ----------------- Outbound Delivery Order Handlers -----------------

func (h *FulfillmentHandler) CreateDeliveryOrder(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateDeliveryOrderDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Payload surat jalan pengiriman tidak valid", err.Error())
	}

	do, err := h.serv.CreateDeliveryOrder(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal membuat surat jalan pengiriman", err.Error())
	}
	return utils.JSONSuccess(c, fiber.StatusCreated, "Surat Jalan pengiriman (DO) berhasil diterbitkan", do)
}

func (h *FulfillmentHandler) ListDeliveryOrders(c *fiber.Ctx) error {
	search := c.Query("search", "")
	status := c.Query("status", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	orders, total, err := h.serv.ListDeliveryOrders(search, status, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal memuat daftar surat jalan", err.Error())
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar surat jalan pengiriman", fiber.Map{
		"delivery_orders": orders,
		"total":           total,
		"page":            page,
		"limit":           limit,
	})
}

func (h *FulfillmentHandler) GetDeliveryOrderByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID tidak valid", nil)
	}

	do, err := h.serv.GetDeliveryOrderByID(id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "Surat jalan tidak ditemukan", nil)
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Detail surat jalan", do)
}

func (h *FulfillmentHandler) ShipDeliveryOrder(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID tidak valid", nil)
	}

	do, err := h.serv.ShipDeliveryOrder(actorID, id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal memberangkatkan pengiriman", err.Error())
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Barang berhasil diberangkatkan dan stok gudang terpotong", do)
}

func (h *FulfillmentHandler) DeliverDeliveryOrder(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID tidak valid", nil)
	}

	do, err := h.serv.DeliverDeliveryOrder(actorID, id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal menyelesaikan pengiriman", err.Error())
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Surat jalan ditandai selesai diterima pelanggan", do)
}

// ----------------- MTS Check & Finished Goods Put-Away -----------------

func (h *FulfillmentHandler) CheckMTSAvailability(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID tidak valid", nil)
	}

	res, err := h.serv.CheckMTSAvailability(id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengecek ketersediaan stok MTS", err.Error())
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Pengecekan ketersediaan stok MTS", res)
}

func (h *FulfillmentHandler) PutAwayFinishedGoods(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID tidak valid", nil)
	}

	type PutAwayPayload struct {
		WarehouseID uint64 `json:"warehouse_id"`
		Quantity    int    `json:"quantity"`
	}
	var payload PutAwayPayload
	_ = c.BodyParser(&payload)

	err = h.serv.PutAwayFinishedGoods(actorID, id, payload.WarehouseID, payload.Quantity)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal menyimpan barang jadi ke gudang", err.Error())
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Produk jadi berhasil disimpan ke stok gudang Finished Goods", nil)
}

// ----------------- Job Costing Variance Handlers -----------------

func (h *FulfillmentHandler) CalculateJobCostVariance(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID tidak valid", nil)
	}

	res, err := h.serv.CalculateJobCostVariance(id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal menghitung varians HPP", err.Error())
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Analisis varians biaya produksi (Job Costing)", res)
}
