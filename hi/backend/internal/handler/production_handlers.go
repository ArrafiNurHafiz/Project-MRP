package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/kayukwas/tracking-backend/internal/service"
	"github.com/kayukwas/tracking-backend/internal/utils"
)

type ProductionHandlers struct {
	prodServ service.ProductionService
}

func NewProductionHandlers(prodServ service.ProductionService) *ProductionHandlers {
	return &ProductionHandlers{prodServ: prodServ}
}

// ---------------- Products ----------------
func (h *ProductionHandlers) ListProducts(c *fiber.Ctx) error {
	search := c.Query("search", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	products, total, err := h.prodServ.ListProducts(search, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar produk", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar produk kitchenware", fiber.Map{
		"products": products,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

func (h *ProductionHandlers) CreateProduct(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateProductDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	p, err := h.prodServ.CreateProduct(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Master produk berhasil ditambahkan", p)
}

func (h *ProductionHandlers) ListStations(c *fiber.Ctx) error {
	stations, err := h.prodServ.ListStations()
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar stasiun", err.Error())
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar stasiun kerja", stations)
}

// ---------------- MRP: Materials & BOM ----------------
func (h *ProductionHandlers) ListMaterials(c *fiber.Ctx) error {
	search := c.Query("search", "")
	category := c.Query("category", "all")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	mats, total, err := h.prodServ.ListMaterials(search, category, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar material", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar stok material bahan baku", fiber.Map{
		"materials": mats,
		"total":     total,
		"page":      page,
		"limit":     limit,
	})
}

func (h *ProductionHandlers) CreateMaterial(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateMaterialDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	mat, err := h.prodServ.CreateMaterial(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Bahan baku berhasil ditambahkan ke inventaris", mat)
}

func (h *ProductionHandlers) AdjustMaterialStock(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	matID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID material tidak valid", nil)
	}

	var dto service.AdjustStockDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	mat, err := h.prodServ.AdjustMaterialStock(actorID, matID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Stok material berhasil disesuaikan", mat)
}

func (h *ProductionHandlers) GetProductBOM(c *fiber.Ctx) error {
	productID, err := strconv.ParseUint(c.Params("product_id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID produk tidak valid", nil)
	}

	boms, err := h.prodServ.GetProductBOM(productID)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar BOM produk", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Resep Bill of Materials produk", boms)
}

func (h *ProductionHandlers) SaveProductBOM(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.SaveProductBOMDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	if err := h.prodServ.SaveProductBOM(actorID, dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Konfigurasi Bill of Materials berhasil disimpan", nil)
}

func (h *ProductionHandlers) DeleteProductBOM(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	bomID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID BOM tidak valid", nil)
	}

	if err := h.prodServ.DeleteProductBOM(actorID, bomID); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Item BOM berhasil dihapus", nil)
}

// ---------------- MRP: Financials & HPP ----------------
func (h *ProductionHandlers) CalculateProductHPP(c *fiber.Ctx) error {
	productID, err := strconv.ParseUint(c.Params("product_id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID produk tidak valid", nil)
	}

	calc, err := h.prodServ.CalculateProductHPP(productID)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Kalkulasi HPP & Rincian Biaya Produksi", calc)
}

func (h *ProductionHandlers) GetMitraPayrollSummary(c *fiber.Ctx) error {
	mitraID, _ := strconv.ParseUint(c.Query("mitra_id", "0"), 10, 64)
	summary, err := h.prodServ.GetMitraPayrollSummary(mitraID)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal merekap tagihan upah mitra", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Rekapitulasi Tagihan Borongan Mitra", summary)
}

// ---------------- SPK / Work Orders ----------------
func (h *ProductionHandlers) ListSPK(c *fiber.Ctx) error {
	status := c.Query("status", "")
	priority := c.Query("priority", "")
	search := c.Query("search", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	spks, total, err := h.prodServ.ListSPK(status, priority, search, page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil daftar SPK", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar SPK", fiber.Map{
		"work_orders": spks,
		"total":       total,
		"page":        page,
		"limit":       limit,
	})
}

func (h *ProductionHandlers) GetSPKByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID SPK tidak valid", nil)
	}

	wo, err := h.prodServ.GetSPKByID(id)
	if err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "SPK tidak ditemukan", nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Detail SPK", wo)
}

func (h *ProductionHandlers) CreateSPK(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateSPKDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	wo, err := h.prodServ.CreateSPK(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "SPK baru berhasil diterbitkan", wo)
}

func (h *ProductionHandlers) AssignStationWorker(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	wosID, err := strconv.ParseUint(c.Params("wos_id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID stasiun SPK tidak valid", nil)
	}

	var dto service.UpdateStationWorkerDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	wos, err := h.prodServ.AssignStationWorker(actorID, wosID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Penugasan pekerja stasiun berhasil diperbarui", wos)
}

func (h *ProductionHandlers) ReportStationProgress(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	wosID, err := strconv.ParseUint(c.Params("wos_id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID stasiun SPK tidak valid", nil)
	}

	var dto service.ReportProgressDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	wos, err := h.prodServ.ReportStationProgress(actorID, wosID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Laporan progres berhasil dicatat", wos)
}

// ---------------- Mitra Assignments ----------------
func (h *ProductionHandlers) ListMitraAssignments(c *fiber.Ctx) error {
	mitraID, _ := strconv.ParseUint(c.Query("mitra_id", "0"), 10, 64)
	list, err := h.prodServ.ListMitraAssignments(mitraID)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil matriks spesialisasi mitra", err.Error())
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Matriks spesialisasi penugasan mitra", list)
}

func (h *ProductionHandlers) SaveMitraAssignment(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.SaveMitraAssignmentDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	assign, err := h.prodServ.SaveMitraAssignment(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Penugasan spesialisasi mitra berhasil disimpan", assign)
}

func (h *ProductionHandlers) DeleteMitraAssignment(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID tidak valid", nil)
	}

	if err := h.prodServ.DeleteMitraAssignment(actorID, id); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Penugasan mitra berhasil dihapus", nil)
}

// ---------------- QC ----------------
func (h *ProductionHandlers) SubmitQCInspection(c *fiber.Ctx) error {
	inspectorID, _ := c.Locals("user_id").(uint64)
	var dto service.SubmitQCInspectionDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	qcLog, err := h.prodServ.SubmitQCInspection(inspectorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Hasil inspeksi QC berhasil dicatat", qcLog)
}

func (h *ProductionHandlers) ListRecentQCLogs(c *fiber.Ctx) error {
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	logs, err := h.prodServ.ListRecentQCLogs(limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil log QC", err.Error())
	}
	return utils.JSONSuccess(c, fiber.StatusOK, "Riwayat inspeksi QC terkini", logs)
}

// ---------------- Logistics ----------------
func (h *ProductionHandlers) CreateShipment(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	var dto service.CreateShipmentDTO
	if err := c.BodyParser(&dto); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "Format payload tidak valid", err.Error())
	}

	shipment, err := h.prodServ.CreateShipment(actorID, dto)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusCreated, "Surat jalan / manifest logistik berhasil diterbitkan", shipment)
}

func (h *ProductionHandlers) ListShipments(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	list, total, err := h.prodServ.ListShipments(page, limit)
	if err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "Gagal mengambil data logistik", err.Error())
	}

	return utils.JSONSuccess(c, fiber.StatusOK, "Daftar surat jalan logistik", fiber.Map{
		"shipments": list,
		"total":     total,
		"page":      page,
		"limit":     limit,
	})
}
