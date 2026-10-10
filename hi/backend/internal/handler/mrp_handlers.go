package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/kayukwas/tracking-backend/internal/service"
	"github.com/kayukwas/tracking-backend/internal/utils"
)

type MRPHandlers struct {
	mrpServ service.MRPService
}

func NewMRPHandlers(mrpServ service.MRPService) *MRPHandlers {
	return &MRPHandlers{mrpServ: mrpServ}
}

// ----------------- Customers -----------------
func (h *MRPHandlers) ListCustomers(c *fiber.Ctx) error {
	search := c.Query("search", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	customers, total, err := h.mrpServ.ListCustomers(search, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar pelanggan", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar pelanggan", fiber.Map{
		"customers": customers,
		"total":     total,
		"page":      page,
		"limit":     limit,
	})
}

func (h *MRPHandlers) GetCustomerByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID pelanggan tidak valid", nil)
	}

	customer, err := h.mrpServ.GetCustomerByID(id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "Pelanggan tidak ditemukan", nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Detail pelanggan", customer)
}

func (h *MRPHandlers) CreateCustomer(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateCustomerDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	customer, err := h.mrpServ.CreateCustomer(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Pelanggan berhasil ditambahkan", customer)
}

func (h *MRPHandlers) UpdateCustomer(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID pelanggan tidak valid", nil)
	}

	var dto service.CreateCustomerDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	customer, err := h.mrpServ.UpdateCustomer(actorID, id, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Pelanggan berhasil diperbarui", customer)
}

func (h *MRPHandlers) DeleteCustomer(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID pelanggan tidak valid", nil)
	}

	if err := h.mrpServ.DeleteCustomer(actorID, id); err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Pelanggan berhasil dihapus", nil)
}

// ----------------- Vendors -----------------
func (h *MRPHandlers) ListVendors(c *fiber.Ctx) error {
	search := c.Query("search", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	vendors, total, err := h.mrpServ.ListVendors(search, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar vendor", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar vendor", fiber.Map{
		"vendors": vendors,
		"total":   total,
		"page":    page,
		"limit":   limit,
	})
}

func (h *MRPHandlers) CreateVendor(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateVendorDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	vendor, err := h.mrpServ.CreateVendor(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Vendor berhasil ditambahkan", vendor)
}

// ----------------- Penawaran (Quotation) -----------------
func (h *MRPHandlers) ListQuotations(c *fiber.Ctx) error {
	status := c.Query("status", "")
	search := c.Query("search", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	quotes, total, err := h.mrpServ.ListQuotations(status, search, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar penawaran", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar surat penawaran (Quotes)", fiber.Map{
		"quotes": quotes,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}

func (h *MRPHandlers) GetQuotationByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID penawaran tidak valid", nil)
	}

	quote, err := h.mrpServ.GetQuotationByID(id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "Surat penawaran tidak ditemukan", nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Detail surat penawaran", quote)
}

func (h *MRPHandlers) CreateQuotation(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateQuotationDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	quote, err := h.mrpServ.CreateQuotation(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Surat penawaran (Draft) berhasil dibuat", quote)
}

func (h *MRPHandlers) ApproveQuotation(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID penawaran tidak valid", nil)
	}

	quote, err := h.mrpServ.ApproveQuotation(actorID, id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Surat penawaran berhasil di-ACC / disetujui", quote)
}

func (h *MRPHandlers) RejectQuotation(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID penawaran tidak valid", nil)
	}

	quote, err := h.mrpServ.RejectQuotation(actorID, id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Surat penawaran berhasil ditolak", quote)
}

func (h *MRPHandlers) ConvertToSalesOrder(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID penawaran tidak valid", nil)
	}

	so, err := h.mrpServ.ConvertToSalesOrder(actorID, id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Penawaran berhasil dikonversi menjadi Pesanan Penjualan (Draft)", so)
}

// ----------------- Pesanan (Sales Order) -----------------
func (h *MRPHandlers) ListSalesOrders(c *fiber.Ctx) error {
	status := c.Query("status", "")
	priority := c.Query("priority", "")
	search := c.Query("search", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	orders, total, err := h.mrpServ.ListSalesOrders(status, priority, search, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar pesanan", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar pesanan penjualan (Sales Orders)", fiber.Map{
		"orders": orders,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}

func (h *MRPHandlers) GetSalesOrderByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID pesanan tidak valid", nil)
	}

	order, err := h.mrpServ.GetSalesOrderByID(id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "Pesanan tidak ditemukan", nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Detail pesanan penjualan", order)
}

func (h *MRPHandlers) CreateSalesOrder(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateSalesOrderDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	so, err := h.mrpServ.CreateSalesOrder(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Pesanan penjualan (Draft) berhasil dibuat", so)
}

func (h *MRPHandlers) PublishSalesOrder(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID pesanan tidak valid", nil)
	}

	var dto service.PublishSalesOrderDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	so, wo, err := h.mrpServ.PublishSalesOrder(actorID, id, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Pesanan berhasil diterbitkan & SPK Perintah Kerja terbuat", fiber.Map{
		"order":      so,
		"work_order": wo,
	})
}

// ----------------- Manufaktur: Process Work Order -----------------
func (h *MRPHandlers) ProcessWorkOrder(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID perintah kerja tidak valid", nil)
	}

	var dto service.ProcessWorkOrderDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	wo, mr, err := h.mrpServ.ProcessWorkOrder(actorID, id, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Perintah kerja siap diproses & Permintaan Material Gudang diterbitkan", fiber.Map{
		"work_order":       wo,
		"material_request": mr,
	})
}

// ----------------- Permintaan Material (Gudang) -----------------
func (h *MRPHandlers) ListMaterialRequests(c *fiber.Ctx) error {
	status := c.Query("status", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	reqs, total, err := h.mrpServ.ListMaterialRequests(status, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar permintaan material", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar permintaan material gudang", fiber.Map{
		"requests": reqs,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

func (h *MRPHandlers) GetMaterialRequestByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID permintaan material tidak valid", nil)
	}

	req, err := h.mrpServ.GetMaterialRequestByID(id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "Permintaan material tidak ditemukan", nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Detail permintaan material gudang", req)
}

func (h *MRPHandlers) CheckMaterialAvailability(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID permintaan material tidak valid", nil)
	}

	req, err := h.mrpServ.CheckMaterialAvailability(actorID, id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Pemeriksaan ketersediaan stok gudang selesai", req)
}

func (h *MRPHandlers) AllocateAndIssueMaterials(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID permintaan material tidak valid", nil)
	}

	req, err := h.mrpServ.AllocateAndIssueMaterials(actorID, id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Material berhasil diambil dan diserahkan ke produksi", req)
}

// ----------------- Purchase Orders & Invoices -----------------
func (h *MRPHandlers) ListPurchaseOrders(c *fiber.Ctx) error {
	status := c.Query("status", "")
	search := c.Query("search", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	pos, total, err := h.mrpServ.ListPurchaseOrders(status, search, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar PO", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar Purchase Orders", fiber.Map{
		"purchase_orders": pos,
		"total":           total,
		"page":            page,
		"limit":           limit,
	})
}

func (h *MRPHandlers) CreatePurchaseOrder(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreatePurchaseOrderDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	po, err := h.mrpServ.CreatePurchaseOrder(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Purchase Order material berhasil dibuat", po)
}

func (h *MRPHandlers) ReceivePurchaseOrder(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID PO tidak valid", nil)
	}

	po, err := h.mrpServ.ReceivePurchaseOrder(actorID, id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Material PO berhasil diterima dan masuk ke stok gudang", po)
}

func (h *MRPHandlers) ListInvoices(c *fiber.Ctx) error {
	status := c.Query("status", "")
	search := c.Query("search", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	invoices, total, err := h.mrpServ.ListInvoices(status, search, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar faktur", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar faktur tagihan (Invoices)", fiber.Map{
		"invoices": invoices,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

func (h *MRPHandlers) CreateInvoice(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateInvoiceDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	inv, err := h.mrpServ.CreateInvoice(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Faktur tagihan berhasil dibuat", inv)
}

func (h *MRPHandlers) MarkInvoicePaid(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID faktur tidak valid", nil)
	}

	inv, err := h.mrpServ.MarkInvoicePaid(actorID, id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Faktur tagihan berhasil dilunasi", inv)
}

// ----------------- Public Customer Portal (Microsite) Handlers -----------------

func (h *MRPHandlers) GetPublicQuotation(c *fiber.Ctx) error {
	token := c.Params("token")
	quote, err := h.mrpServ.GetQuotationByPublicToken(token)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "Surat penawaran tidak ditemukan atau token tidak valid", nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Detail Penawaran Pelanggan (Portal)", quote)
}

func (h *MRPHandlers) PublicCustomerApprove(c *fiber.Ctx) error {
	token := c.Params("token")
	var body struct {
		SignerName string `json:"signer_name"`
	}
	if err := c.BodyParser(&body); err != nil || body.SignerName == "" {
		body.SignerName = "PIC Pelanggan"
	}

	quote, so, wo, inv, err := h.mrpServ.CustomerApproveQuotation(token, body.SignerName)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Penawaran berhasil disetujui secara digital!", fiber.Map{
		"quotation":   quote,
		"sales_order": so,
		"work_order":  wo,
		"dp_invoice":  inv,
	})
}

func (h *MRPHandlers) PublicCustomerRevise(c *fiber.Ctx) error {
	token := c.Params("token")
	var body struct {
		RevisionNotes string `json:"revision_notes"`
	}
	if err := c.BodyParser(&body); err != nil || body.RevisionNotes == "" {
		return utils.JSONError(c, fiber.StatusBadRequest, "Catatan revisi wajib diisi", nil)
	}

	quote, err := h.mrpServ.CustomerReviseQuotation(token, body.RevisionNotes)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Permintaan revisi penawaran telah diteruskan ke tim sales", quote)
}

// ----------------- Auto Allocation & Shortage PO Handlers -----------------

func (h *MRPHandlers) AutoAllocateFIFOBatches(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID Work Order tidak valid", nil)
	}

	res, err := h.mrpServ.AutoAllocateFIFOBatches(actorID, id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Alokasi bahan baku FIFO Batch berhasil diproses", res)
}

func (h *MRPHandlers) CreatePOFromMaterialShortage(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID Work Order tidak valid", nil)
	}

	var body struct {
		VendorID uint64 `json:"vendor_id"`
	}
	_ = c.BodyParser(&body)

	po, err := h.mrpServ.CreatePOFromMaterialShortage(actorID, id, body.VendorID)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Purchase Order untuk menutupi defisit material berhasil diterbitkan", po)
}

func (h *MRPHandlers) GetMRPNetRequirements(c *fiber.Ctx) error {
	tenantID, _ := strconv.ParseUint(c.Get("X-Tenant-ID", "1"), 10, 64)
	if tenantID == 0 {
		tenantID, _ = strconv.ParseUint(c.Query("tenant_id", "1"), 10, 64)
	}

	summary, err := h.mrpServ.CalculateNetRequirements(tenantID)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal menjalankan kalkulasi MRP Net Requirements", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Hasil kalkulasi MRP Net Requirements", summary)
}

func (h *MRPHandlers) BatchGeneratePOsFromMRP(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	tenantID, _ := strconv.ParseUint(c.Get("X-Tenant-ID", "1"), 10, 64)
	if tenantID == 0 {
		tenantID = 1
	}

	var dto service.BatchGeneratePODTO
	_ = c.BodyParser(&dto)

	pos, err := h.mrpServ.BatchGeneratePOsFromMRP(actorID, tenantID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Batch Purchase Order dari MRP berhasil dibuat", fiber.Map{
		"purchase_orders": pos,
		"total":           len(pos),
	})
}
