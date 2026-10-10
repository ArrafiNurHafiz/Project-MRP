package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/kayukwas/tracking-backend/internal/models"
	"github.com/kayukwas/tracking-backend/internal/service"
	"github.com/kayukwas/tracking-backend/internal/utils"
)

type MRPExtendedHandlers struct {
	extServ service.ExtendedMRPService
}

func NewMRPExtendedHandlers(extServ service.ExtendedMRPService) *MRPExtendedHandlers {
	return &MRPExtendedHandlers{extServ: extServ}
}

// ----------------- RFQ -----------------
func (h *MRPExtendedHandlers) ListRFQs(c *fiber.Ctx) error {
	subStatus := c.Query("submission_status", "")
	procStatus := c.Query("processing_status", "")
	search := c.Query("search", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	rfqs, total, err := h.extServ.ListRFQs(subStatus, procStatus, search, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar RFQ", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar RFQ Permohonan Harga", fiber.Map{
		"rfqs":  rfqs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *MRPExtendedHandlers) GetRFQByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID RFQ tidak valid", nil)
	}

	rfq, err := h.extServ.GetRFQByID(id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "RFQ tidak ditemukan", nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Detail RFQ", rfq)
}

func (h *MRPExtendedHandlers) CreateRFQ(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateRFQDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	rfq, err := h.extServ.CreateRFQ(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Permohonan Penawaran (RFQ) berhasil dibuat", rfq)
}

func (h *MRPExtendedHandlers) ApproveRFQ(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID RFQ tidak valid", nil)
	}

	rfq, err := h.extServ.ApproveRFQ(actorID, id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "RFQ berhasil disetujui untuk penawaran", rfq)
}

func (h *MRPExtendedHandlers) ConvertToQuotation(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID RFQ tidak valid", nil)
	}

	quote, err := h.extServ.ConvertToQuotation(actorID, id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "RFQ berhasil dikonversi menjadi Surat Penawaran", quote)
}

// ----------------- Order Simulation -----------------
func (h *MRPExtendedHandlers) SimulateOrder(c *fiber.Ctx) error {
	var dto service.SimulateOrderDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload simulasi tidak valid", err.Error())
	}

	result, err := h.extServ.SimulateOrder(dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Hasil Simulasi Kelayakan MRP / MPS / CRP", result)
}

// ----------------- FX Currencies -----------------
func (h *MRPExtendedHandlers) ListCurrencies(c *fiber.Ctx) error {
	currencies, err := h.extServ.ListCurrencies()
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar mata uang", err.Error())
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar Kurs Valuta Asing", currencies)
}

func (h *MRPExtendedHandlers) UpdateCurrencyRate(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	code := c.Params("code")
	var body struct {
		Rate float64 `json:"rate"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	if err := h.extServ.UpdateCurrencyRate(actorID, code, body.Rate); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Kurs valuta asing berhasil diperbarui", nil)
}

// ----------------- Company Tenant Setting -----------------
func (h *MRPExtendedHandlers) GetCompanySetting(c *fiber.Ctx) error {
	setting, err := h.extServ.GetCompanySetting()
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil pengaturan perusahaan", err.Error())
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Profil Perusahaan Tenant", setting)
}

func (h *MRPExtendedHandlers) UpdateCompanySetting(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var setting models.CompanySetting
	if err := c.BodyParser(&setting); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	if err := h.extServ.UpdateCompanySetting(actorID, &setting); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Profil perusahaan berhasil disimpan", setting)
}

// ----------------- Reports -----------------
func (h *MRPExtendedHandlers) GetFinancialReport(c *fiber.Ctx) error {
	res, err := h.extServ.GetFinancialReport()
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, err.Error(), nil)
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Laporan Finansial MRP", res)
}

func (h *MRPExtendedHandlers) GetInventoryReport(c *fiber.Ctx) error {
	res, err := h.extServ.GetInventoryReport()
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, err.Error(), nil)
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Laporan Valuasi Inventaris Material", res)
}

func (h *MRPExtendedHandlers) GetSalesFunnelReport(c *fiber.Ctx) error {
	res, err := h.extServ.GetSalesFunnelReport()
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, err.Error(), nil)
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Laporan Sales Conversion Funnel", res)
}

// ----------------- CPR Handlers -----------------

func (h *MRPExtendedHandlers) ListCPRs(c *fiber.Ctx) error {
	status := c.Query("status", "")
	search := c.Query("search", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	list, total, err := h.extServ.ListCPRs(status, search, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar CPR", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar Custom Products Request (CPR)", fiber.Map{
		"cprs":  list,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *MRPExtendedHandlers) GetCPRByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID CPR tidak valid", nil)
	}

	cpr, err := h.extServ.GetCPRByID(id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "Dokumen CPR tidak ditemukan", nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Detail Dokumen CPR", cpr)
}

func (h *MRPExtendedHandlers) CreateCPR(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var cpr models.CustomProductRequest
	if err := c.BodyParser(&cpr); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	res, err := h.extServ.CreateCPR(actorID, &cpr)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Custom Product Request (CPR) berhasil dibuat", res)
}

func (h *MRPExtendedHandlers) UpdateCPR(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID CPR tidak valid", nil)
	}

	var req models.CustomProductRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	res, err := h.extServ.UpdateCPR(actorID, id, &req)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Data CPR berhasil diperbarui", res)
}

func (h *MRPExtendedHandlers) ApproveCPR(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID CPR tidak valid", nil)
	}

	res, err := h.extServ.ApproveCPR(actorID, id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "CPR berhasil disetujui untuk diterbitkan ke penawaran", res)
}

func (h *MRPExtendedHandlers) RejectCPR(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID CPR tidak valid", nil)
	}

	var body struct {
		Reason string `json:"reason"`
	}
	_ = c.BodyParser(&body)

	res, err := h.extServ.RejectCPR(actorID, id, body.Reason)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Status CPR diubah menjadi Need Revision", res)
}

func (h *MRPExtendedHandlers) ConvertCPRToQuotation(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID CPR tidak valid", nil)
	}

	quote, err := h.extServ.ConvertCPRToQuotation(actorID, id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "CPR berhasil dikonversi menjadi Surat Penawaran Resmi", quote)
}
