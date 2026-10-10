package service_test

import (
	"testing"
	"time"

	"github.com/kayukwas/tracking-backend/internal/models"
	"github.com/kayukwas/tracking-backend/internal/repository"
	"github.com/kayukwas/tracking-backend/internal/service"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// setupE2ETestDB menginisialisasi SQLite in-memory database dengan seluruh skema tabel yang relevan
func setupE2ETestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Gagal membuka database SQLite in-memory: %v", err)
	}

	err = db.AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.Tenant{},
		&models.Customer{},
		&models.CustomerPIC{},
		&models.Vendor{},
		&models.Material{},
		&models.Product{},
		&models.ProductBOM{},
		&models.WorkStation{},
		&models.WorkOrder{},
		&models.WorkOrderStation{},
		&models.ProductionLog{},
		&models.Quotation{},
		&models.QuotationItem{},
		&models.SalesOrder{},
		&models.SalesOrderItem{},
		&models.MaterialRequest{},
		&models.MaterialRequestItem{},
		&models.PurchaseOrder{},
		&models.PurchaseOrderItem{},
		&models.Invoice{},
		&models.MaterialBatchLot{},
		&models.MitraProductStationAssignment{},
		&models.QCLog{},
		&models.MitraShipment{},
		&models.MitraShipmentItem{},
		&models.MachineDowntime{},
		&models.ReworkOrder{},
		&models.SubcontractReconciliation{},
		&models.Warehouse{},
		&models.WarehouseStock{},
		&models.StockTransfer{},
		&models.StockTransferItem{},
		&models.StockAdjustment{},
		&models.AuditLog{},
	)
	if err != nil {
		t.Fatalf("AutoMigrate skema gagal: %v", err)
	}

	return db
}

// -------------------------------------------------------------------------------------------------
// SKENARIO 1: Alur Operasional End-to-End
// Penawaran ACC -> Pesanan Terbit -> SPK Otomatis -> Permintaan Material Gudang -> Alokasi FIFO / Deteksi Shortage -> Auto PO
// -------------------------------------------------------------------------------------------------
func TestE2E_AlurOperasional_PenawaranToAutoPO(t *testing.T) {
	db := setupE2ETestDB(t)

	// 1. Inisialisasi Repositori & Service
	custRepo := repository.NewCustomerRepository(db)
	vendRepo := repository.NewVendorRepository(db)
	quoteRepo := repository.NewQuotationRepository(db)
	soRepo := repository.NewSalesOrderRepository(db)
	mrRepo := repository.NewMaterialRequestRepository(db)
	poRepo := repository.NewPurchaseOrderRepository(db)
	invRepo := repository.NewInvoiceRepository(db)
	prodRepo := repository.NewProductRepository(db)
	matRepo := repository.NewMaterialRepository(db)
	bomRepo := repository.NewBOMRepository(db)
	woRepo := repository.NewWorkOrderRepository(db)
	stRepo := repository.NewWorkStationRepository(db)
	indRepo := repository.NewIndustrialMRPRepository(db)
	auditSvc := &dummyAuditService{}

	mrpSvc := service.NewMRPService(
		custRepo, vendRepo, quoteRepo, soRepo, mrRepo, poRepo, invRepo,
		prodRepo, matRepo, bomRepo, woRepo, stRepo, indRepo, auditSvc,
	)

	// 2. Setup Master Data (Customer, Vendor, Material, Product, BOM, WorkStation, Batch Lot)
	customer := models.Customer{
		Name:    "PT Furnitur Ekspor Jaya",
		Email:   "procurement@furniturjaya.com",
		Phone:   "08123456789",
		Address: "Kawasan Industri Candi Blok A",
	}
	db.Create(&customer)

	vendor := models.Vendor{
		Name:     "PT Supplier Kayu Jati Utama",
		Alias:    "wood",
		PICName:  "Hendra Wijaya",
		PICEmail: "hendra@jatiutama.com",
		IsActive: true,
	}
	db.Create(&vendor)

	// Material: stok on-hand 2 batang
	material := models.Material{
		MaterialCode: "MAT-JATI-SOLID",
		Name:         "Kayu Jati Log Grade A",
		Category:     "wood",
		Unit:         "batang",
		StockQty:     2,
		MinimumStock: 10,
		CostPerUnit:  250000,
	}
	db.Create(&material)

	// Lot batch FIFO untuk alokasi 2 batang
	batchLot := models.MaterialBatchLot{
		BatchNumber:  "LOT-JATI-2026-001",
		MaterialID:   material.ID,
		VendorID:     vendor.ID,
		ReceivedDate: time.Now().AddDate(0, 0, -5),
		InitialQty:   2,
		RemainingQty: 2,
		UnitCost:     250000,
		QCStatus:     "PASSED",
	}
	db.Create(&batchLot)

	product := models.Product{
		ProductCode: "PROD-MEJA-MAKAN",
		ProductName: "Meja Makan Jati Minimalis 6 Kursi",
		IsActive:    true,
	}
	db.Create(&product)

	station := models.WorkStation{
		StationCode:       models.StationCodeWoodWorking,
		Name:              "Stasiun 1 - Wood Working",
		SequenceOrder:     1,
		IsExternalAllowed: false,
	}
	db.Create(&station)

	// 1 unit Meja membutuhkan 5 batang Kayu Jati
	bom := models.ProductBOM{
		ProductID:  product.ID,
		MaterialID: material.ID,
		StationID:  station.ID,
		Quantity:   5.0,
		WastePct:   0.0,
	}
	db.Create(&bom)

	// 3. STEP 1: Penawaran (Quotation) dibuat dan di-ACC
	validUntil := time.Now().AddDate(0, 1, 0)
	quote, err := mrpSvc.CreateQuotation(1, service.CreateQuotationDTO{
		CustomerID:    customer.ID,
		ValidUntil:    &validUntil,
		CustomerNotes: "Penawaran tender meja makan 2 unit",
		Items: []service.CreateQuotationItemDTO{
			{
				ProductID:   &product.ID,
				ItemName:    product.ProductName,
				Qty:         2,
				UnitPrice:   2800000,
				DiscountPct: 0,
			},
		},
	})
	if err != nil {
		t.Fatalf("Gagal membuat penawaran: %v", err)
	}
	if quote.Status != models.QuoteStatusDraft {
		t.Fatalf("Status penawaran awal harus DRAFT, dapat: %s", quote.Status)
	}

	// Approval Penawaran (ACC)
	approvedQuote, err := mrpSvc.ApproveQuotation(1, quote.ID)
	if err != nil {
		t.Fatalf("Gagal menyetujui penawaran: %v", err)
	}
	if approvedQuote.Status != models.QuoteStatusApproved {
		t.Fatalf("Status penawaran setelah ACC harus APPROVED, dapat: %s", approvedQuote.Status)
	}

	// 4. STEP 2: Konversi Penawaran ke Pesanan Penjualan (Sales Order)
	so, err := mrpSvc.ConvertToSalesOrder(1, approvedQuote.ID)
	if err != nil {
		t.Fatalf("Gagal konversi penawaran ke pesanan: %v", err)
	}
	if so.Status != models.OrderStatusDraft {
		t.Fatalf("Status pesanan baru harus DRAFT, dapat: %s", so.Status)
	}
	if so.CustomerID != customer.ID || len(so.Items) != 1 {
		t.Fatalf("Detail pesanan tidak valid: customer %d, items %d", so.CustomerID, len(so.Items))
	}

	// 5. STEP 3: Pesanan Terbit (Publish) -> Otomatis Generate SPK (WorkOrder)
	publishedSO, autoSPK, err := mrpSvc.PublishSalesOrder(1, so.ID, service.PublishSalesOrderDTO{
		PlannedStart: time.Now(),
		PlannedEnd:   time.Now().AddDate(0, 0, 14),
		Priority:     "high",
	})
	if err != nil {
		t.Fatalf("Gagal menerbitkan pesanan penjualan: %v", err)
	}
	if publishedSO.Status != models.OrderStatusPublished {
		t.Fatalf("Status pesanan harus PUBLISHED, dapat: %s", publishedSO.Status)
	}
	if autoSPK == nil || autoSPK.ID == 0 {
		t.Fatalf("SPK otomatis harus terbit saat pesanan dipublish")
	}
	if autoSPK.TotalTargetQty != 2 {
		t.Fatalf("Target kuantitas SPK harus 2 unit, dapat %d", autoSPK.TotalTargetQty)
	}

	// 6. STEP 4: SPK Siap Diproses -> Otomatis Buat Permintaan Material Gudang (Material Request)
	processedWO, matReq, err := mrpSvc.ProcessWorkOrder(1, autoSPK.ID, service.ProcessWorkOrderDTO{
		StartDate:    time.Now(),
		DeadlineDate: time.Now().AddDate(0, 0, 7),
	})
	if err != nil {
		t.Fatalf("Gagal memproses SPK: %v", err)
	}
	if processedWO.Status != models.WOStatusInProgress {
		t.Fatalf("Status SPK harus in_progress, dapat: %s", processedWO.Status)
	}
	if matReq == nil || matReq.ID == 0 {
		t.Fatalf("Permintaan Material Gudang harus otomatis dibuat")
	}
	if matReq.WorkOrderID != autoSPK.ID {
		t.Fatalf("Permintaan material harus terhubung ke SPK #%d", autoSPK.ID)
	}
	// Kebutuhan gross: 2 unit * 5 batang = 10 batang
	if len(matReq.Items) != 1 || matReq.Items[0].RequiredQty != 10 {
		t.Fatalf("Kuantitas kebutuhan material harus 10 batang, dapat: %+v", matReq.Items)
	}

	// 7. STEP 5: Alokasi FIFO & Deteksi Ketersediaan / Shortage
	// Kebutuhan = 10 batang, Batch FIFO On-Hand = 2 batang -> Dialokasikan 2, sisa Shortage 8 batang
	fifoRes, err := mrpSvc.AutoAllocateFIFOBatches(1, autoSPK.ID)
	if err != nil {
		t.Fatalf("Gagal alokasi FIFO batch: %v", err)
	}
	if fifoRes["all_fulfilled"] == true {
		t.Fatalf("Material seharusnya shortage (butuh 10, lot cuma 2)")
	}

	// Verifikasi Gudang Cek Ketersediaan
	checkedMR, err := mrpSvc.CheckMaterialAvailability(1, matReq.ID)
	if err != nil {
		t.Fatalf("Gagal memeriksa ketersediaan material: %v", err)
	}
	if checkedMR.Status != models.MatReqStatusShortage {
		t.Fatalf("Status MR harus SHORTAGE, dapat: %s", checkedMR.Status)
	}

	// 8. STEP 6: Deteksi Shortage Memicu Auto Purchase Order (PO)
	autoPO, err := mrpSvc.CreatePOFromMaterialShortage(1, autoSPK.ID, vendor.ID)
	if err != nil {
		t.Fatalf("Gagal membuat Auto PO dari shortage: %v", err)
	}
	if autoPO == nil || autoPO.ID == 0 {
		t.Fatalf("Auto PO tidak terbentuk")
	}
	if autoPO.Status != models.POStatusDraft {
		t.Fatalf("Status Auto PO harus DRAFT, dapat: %s", autoPO.Status)
	}
	if autoPO.VendorID != vendor.ID {
		t.Fatalf("Vendor ID PO tidak sesuai: ekspetasi %d, dapat %d", vendor.ID, autoPO.VendorID)
	}
	// Selisih kekurangan = 10 (dibutuhkan) - 2 (dialokasikan FIFO) = 8 batang
	if len(autoPO.Items) != 1 || autoPO.Items[0].Qty != 8 {
		t.Fatalf("Kuantitas Auto PO harus 8 batang (kekurangan material), dapat: %+v", autoPO.Items)
	}

	t.Logf("Sukses E2E Alur Operasional: Penawaran #%s -> SO #%s -> SPK #%s -> MR #%s (Shortage 8) -> PO #%s (Qty 8)",
		quote.QuoteNumber, publishedSO.OrderNumber, autoSPK.SPKNumber, matReq.RequestNumber, autoPO.PONumber)
}

// -------------------------------------------------------------------------------------------------
// SKENARIO 2: Maklon 3-Tier
// Dispatch SJ bahan -> QC Inbound (Lolos/Rework/Scrap) -> Rekonsiliasi Maklon
// -------------------------------------------------------------------------------------------------
func TestE2E_Maklon3Tier_DispatchAndQCInbound(t *testing.T) {
	db := setupE2ETestDB(t)

	prodRepo := repository.NewProductRepository(db)
	matRepo := repository.NewMaterialRepository(db)
	bomRepo := repository.NewBOMRepository(db)
	stationRepo := repository.NewWorkStationRepository(db)
	woRepo := repository.NewWorkOrderRepository(db)
	mitraRepo := repository.NewMitraAssignmentRepository(db)
	qcRepo := repository.NewQCRepository(db)
	logistRepo := repository.NewLogisticsRepository(db)
	asianRepo := repository.NewAsianMRPExtensionsRepository(db)
	poRepo := repository.NewPurchaseOrderRepository(db)
	indRepo := repository.NewIndustrialMRPRepository(db)
	auditSvc := &dummyAuditService{}

	prodSvc := service.NewProductionService(
		prodRepo, matRepo, bomRepo, stationRepo, woRepo, mitraRepo, qcRepo, logistRepo, auditSvc,
	)
	asianSvc := service.NewAsianMRPExtensionsService(asianRepo, poRepo, matRepo, auditSvc)
	indSvc := service.NewIndustrialMRPService(indRepo, matRepo, auditSvc)

	// Setup Mitra User, Product, Station Maklon Finishing
	mitraUser := models.User{
		Name:     "CV Maklon Jepara Finishing",
		Email:    "mitra@jeparafinishing.com",
		Status:   models.UserStatusActive,
		IsActive: true,
	}
	db.Create(&mitraUser)

	product := models.Product{
		ProductCode: "PROD-KURSI-JATI",
		ProductName: "Kursi Makan Solid Wood",
		IsActive:    true,
	}
	db.Create(&product)

	stationFinishing := models.WorkStation{
		StationCode:       models.StationCodeFinishing,
		Name:              "Stasiun 3 - Maklon Finishing",
		SequenceOrder:     3,
		IsExternalAllowed: true,
	}
	db.Create(&stationFinishing)

	wo := models.WorkOrder{
		SPKNumber:      "SPK-MAKLON-001",
		ProductID:      product.ID,
		TotalTargetQty: 100,
		Status:         models.WOStatusInProgress,
	}
	db.Create(&wo)

	wos := models.WorkOrderStation{
		WorkOrderID:   wo.ID,
		StationID:     stationFinishing.ID,
		SequenceOrder: 3,
		Status:        models.StationStatusInProgress,
		InputQty:      100,
	}
	db.Create(&wos)

	// 1. TIER 1: Dispatch SJ Bahan Baku ke Mitra Maklon (Barang Keluar ke Vendor Finishing)
	dispatchSJ, err := prodSvc.CreateShipment(1, service.CreateShipmentDTO{
		VehicleGateStatus: "keluar",
		ProductAction:     "kirim",
		DriverName:        "Slamet Riyadi",
		VehicleType:       "Truk Engkel",
		LicensePlate:      "K 1823 BA",
		MitraID:           &mitraUser.ID,
		Notes:             "Pengiriman 100 unit rangka kursi mentah ke vendor finishing",
		Items: []service.CreateShipmentItemDTO{
			{
				ProductID:      &product.ID,
				RawItemName:    "Rangka Kursi Mentah Siap Finishing",
				Qty:            100,
				StatusCategory: "revisi_total",
				Notes:          "Batch finishing natural gloss",
			},
		},
	})
	if err != nil {
		t.Fatalf("Gagal membuat Surat Jalan dispatch bahan: %v", err)
	}
	if dispatchSJ.VehicleGateStatus != "keluar" || dispatchSJ.ProductAction != "kirim" {
		t.Fatalf("Surat jalan dispatch tidak valid: %+v", dispatchSJ)
	}
	if len(dispatchSJ.Items) != 1 || dispatchSJ.Items[0].Qty != 100 {
		t.Fatalf("Item dispatch bahan maklon salah: %+v", dispatchSJ.Items)
	}

	// 2. TIER 2: Penerimaan Kembali Inbound Hasil Maklon (QC Inbound Gate: Lolos, Rework, Scrap)
	// Dari 100 unit yang dikirim:
	// - 85 unit LOLOS (PassQty = 85)
	// - 10 unit REWORK (RejectMajorQty = 10 -> Cacat finishing perlu amplas & spray ulang)
	// - 5 unit SCRAP (RejectScrapQty = 5 -> Kayu pecah retur scrap)
	qcResult, err := prodSvc.SubmitQCInspection(1, service.SubmitQCInspectionDTO{
		WorkOrderStationID: wos.ID,
		InspectionModel:    "pickup_joint_model_a",
		SampleQty:          100,
		PassQty:            85,
		RejectMinorQty:     0,
		RejectMajorQty:     10,
		RejectScrapQty:     5,
		DefectCategories:   "Finishing belang (10), Kayu retak retur scrap (5)",
		Notes:              "Pemeriksaan QC Inbound maklon finishing",
	})
	if err != nil {
		t.Fatalf("Gagal submit QC inbound maklon: %v", err)
	}
	if qcResult.PassQty != 85 || qcResult.RejectQty != 15 {
		t.Fatalf("Hasil kalkulasi QC salah: lolos %d, reject %d", qcResult.PassQty, qcResult.RejectQty)
	}
	if qcResult.ActionTaken != models.QCActionReworkMitra {
		t.Fatalf("Aksi QC harus rework_mitra karena ada reject major/scrap, dapat: %s", qcResult.ActionTaken)
	}

	// Verifikasi Update Angka di Stasiun SPK
	updatedWOS, err := woRepo.FindStationByID(wos.ID)
	if err != nil {
		t.Fatalf("Gagal memuat updated WOS: %v", err)
	}
	if updatedWOS.CompletedQty != 85 {
		t.Fatalf("CompletedQty harus bertambah 85, dapat: %d", updatedWOS.CompletedQty)
	}
	if updatedWOS.ReworkQty != 10 {
		t.Fatalf("ReworkQty harus 10 unit, dapat: %d", updatedWOS.ReworkQty)
	}
	if updatedWOS.RejectQty != 15 {
		t.Fatalf("Total RejectQty harus 15 unit, dapat: %d", updatedWOS.RejectQty)
	}

	// Buat Rework Order untuk 10 unit yang cacat
	reworkOrder, err := indSvc.CreateReworkOrder(1, service.CreateReworkOrderDTO{
		WorkOrderID:     wo.ID,
		SourceStationID: stationFinishing.ID,
		TargetStationID: stationFinishing.ID,
		DefectReason:    "Finishing belang perlu recoating",
		DefectQty:       10,
		AssignedMitraID: &mitraUser.ID,
		Notes:           "Rework tanpa biaya tambahan (Garansi Maklon)",
	})
	if err != nil {
		t.Fatalf("Gagal membuat order rework: %v", err)
	}
	if reworkOrder.DefectQty != 10 || reworkOrder.Status != "IN_PROGRESS" {
		t.Fatalf("Order rework tidak sesuai: %+v", reworkOrder)
	}

	// 3. TIER 3: Rekonsiliasi Maklon & Pelunasan (HashMicro Standard)
	// Bahan terkirim 100, diterima lolos 85 -> Rendemen 85%
	// Tarif borongan per unit = Rp 35.000. Total kotor = 85 * 35.000 = Rp 2.975.000
	reconcile, err := asianSvc.CreateSubcontractReconciliation(1, service.CreateSubcontractReconcileDTO{
		MitraUserID:      mitraUser.ID,
		WorkOrderID:      wo.ID,
		SentQuantity:     100,
		ReceivedQuantity: 85,
		PieceRate:        35000,
		PenaltyPerReject: 0,
		Notes:            "Rekonsiliasi maklon kursi 85 unit lolos",
	})
	if err != nil {
		t.Fatalf("Gagal membuat rekonsiliasi maklon: %v", err)
	}
	if reconcile.MaterialYieldPct != 85.0 {
		t.Fatalf("Rendemen harus 85.0%%, dapat: %.2f%%", reconcile.MaterialYieldPct)
	}
	if reconcile.FinalPayoutAmount != 2975000.0 {
		t.Fatalf("Net payout harus Rp 2.975.000, dapat: %.2f", reconcile.FinalPayoutAmount)
	}

	// Tandai Lunas
	err = asianSvc.PaySubcontractReconciliation(1, reconcile.ID)
	if err != nil {
		t.Fatalf("Gagal menandai lunas rekonsiliasi maklon: %v", err)
	}

	t.Logf("Sukses E2E Maklon 3-Tier: Dispatch SJ #%s -> QC Inbound (Lolos 85, Rework 10, Scrap 5) -> Rekonsiliasi Rp %.2f (LUNAS)",
		dispatchSJ.SJNumber, reconcile.FinalPayoutAmount)
}

// -------------------------------------------------------------------------------------------------
// SKENARIO 3: Isolasi Multi-Tenant
// Pastikan tidak ada data leakage antar TenantID (Tenant 1 vs Tenant 2)
// -------------------------------------------------------------------------------------------------
func TestE2E_MultiTenant_DataIsolation(t *testing.T) {
	db := setupE2ETestDB(t)

	whRepo := repository.NewWarehouseRepository(db)
	whSvc := service.NewWarehouseService(whRepo, &dummyAuditService{})

	// 1. Setup Dua Tenant Berbeda
	tenant1 := models.Tenant{
		ID:       1,
		Name:     "PT Kayu Sentosa Indonesia",
		Slug:     "kayu-sentosa",
		Industry: "Furniture/Wood",
		PlanTier: models.PlanTierEnterprise,
		Status:   models.TenantStatusActive,
	}
	db.Create(&tenant1)

	tenant2 := models.Tenant{
		ID:       2,
		Name:     "CV Mebel Modern Nusantara",
		Slug:     "mebel-nusantara",
		Industry: "Garment/Wood",
		PlanTier: models.PlanTierStarter,
		Status:   models.TenantStatusActive,
	}
	db.Create(&tenant2)

	// Setup Material untuk masing-masing
	mat1 := models.Material{
		MaterialCode: "MAT-T1-01",
		Name:         "Kayu Jati Tenant 1",
		StockQty:     100,
		CostPerUnit:  150000,
	}
	db.Create(&mat1)

	mat2 := models.Material{
		MaterialCode: "MAT-T2-01",
		Name:         "Kayu Mahoni Tenant 2",
		StockQty:     50,
		CostPerUnit:  80000,
	}
	db.Create(&mat2)

	// 2. Buat Gudang di Tenant 1
	whT1A, err := whSvc.CreateWarehouse(1, service.CreateWarehouseDTO{
		TenantID:    1,
		Code:        "WH-T1-A",
		Name:        "Gudang Utama Tenant 1",
		Type:        "raw_materials",
		Location:    "Kawasan Industri Blok A",
		IsActive:    true,
	})
	if err != nil {
		t.Fatalf("Gagal membuat gudang Tenant 1: %v", err)
	}

	whT1B, err := whSvc.CreateWarehouse(1, service.CreateWarehouseDTO{
		TenantID:    1,
		Code:        "WH-T1-B",
		Name:        "Gudang Transit Tenant 1",
		Type:        "wip",
		Location:    "Kawasan Industri Blok B",
		IsActive:    true,
	})
	if err != nil {
		t.Fatalf("Gagal membuat gudang 2 Tenant 1: %v", err)
	}

	// 3. Buat Gudang di Tenant 2
	whT2, err := whSvc.CreateWarehouse(2, service.CreateWarehouseDTO{
		TenantID:    2,
		Code:        "WH-T2-MAIN",
		Name:        "Gudang Pusat Tenant 2",
		Type:        "raw_materials",
		Location:    "Semarang Barat",
		IsActive:    true,
	})
	if err != nil {
		t.Fatalf("Gagal membuat gudang Tenant 2: %v", err)
	}

	// 4. Verifikasi Isolasi Query Gudang (Data Leakage Verification)
	listT1, err := whSvc.ListWarehouses(1, "")
	if err != nil {
		t.Fatalf("Gagal list gudang Tenant 1: %v", err)
	}
	if len(listT1) != 2 {
		t.Fatalf("Tenant 1 harus memiliki tepat 2 gudang, ditemukan %d", len(listT1))
	}
	for _, wh := range listT1 {
		if wh.TenantID != 1 {
			t.Errorf("[DATA LEAKAGE] Gudang milik TenantID %d bocor ke TenantID 1!", wh.TenantID)
		}
		if wh.ID == whT2.ID {
			t.Errorf("[DATA LEAKAGE KRITIS] Gudang Tenant 2 (%s) muncul di query Tenant 1!", wh.Name)
		}
	}

	listT2, err := whSvc.ListWarehouses(2, "")
	if err != nil {
		t.Fatalf("Gagal list gudang Tenant 2: %v", err)
	}
	if len(listT2) != 1 {
		t.Fatalf("Tenant 2 harus memiliki tepat 1 gudang, ditemukan %d", len(listT2))
	}
	if listT2[0].TenantID != 2 || listT2[0].ID != whT2.ID {
		t.Fatalf("[DATA LEAKAGE] Query Tenant 2 mengembalikan data tidak valid: %+v", listT2[0])
	}

	// 5. Buat Stock Transfer di Tenant 1
	trfT1, err := whSvc.CreateStockTransfer(1, service.CreateStockTransferDTO{
		TenantID:        1,
		FromWarehouseID: whT1A.ID,
		ToWarehouseID:   whT1B.ID,
		DriverName:      "Supir T1",
		Items: []service.CreateStockTransferItemDTO{
			{
				MaterialID:     mat1.ID,
				RequestedQty:   20,
				TransferredQty: 20,
				UnitCost:       150000,
			},
		},
	})
	if err != nil {
		t.Fatalf("Gagal membuat StockTransfer Tenant 1: %v", err)
	}

	// Verifikasi Isolasi Stock Transfer
	transfersT1, err := whSvc.ListStockTransfers(1, "")
	if err != nil {
		t.Fatalf("Gagal list transfers Tenant 1: %v", err)
	}
	if len(transfersT1) != 1 || transfersT1[0].ID != trfT1.ID {
		t.Fatalf("Tenant 1 harus memiliki 1 transfer, dapat: %d", len(transfersT1))
	}

	transfersT2, err := whSvc.ListStockTransfers(2, "")
	if err != nil {
		t.Fatalf("Gagal list transfers Tenant 2: %v", err)
	}
	if len(transfersT2) != 0 {
		t.Fatalf("[DATA LEAKAGE KRITIS] StockTransfer Tenant 1 bocor ke query Tenant 2! Ditemukan %d data", len(transfersT2))
	}

	// 6. Buat Stock Adjustment di Tenant 2
	adjT2, err := whSvc.CreateStockAdjustment(2, service.CreateStockAdjustmentDTO{
		TenantID:    2,
		WarehouseID: whT2.ID,
		MaterialID:  mat2.ID,
		RecordedQty: 50,
		CountedQty:  52,
		Reason:      "audit_opname_t2",
	})
	if err != nil {
		t.Fatalf("Gagal membuat StockAdjustment Tenant 2: %v", err)
	}

	// Verifikasi Isolasi Stock Adjustment
	adjustmentsT2, err := whSvc.ListStockAdjustments(2)
	if err != nil {
		t.Fatalf("Gagal list adjustment Tenant 2: %v", err)
	}
	if len(adjustmentsT2) != 1 || adjustmentsT2[0].ID != adjT2.ID {
		t.Fatalf("Tenant 2 harus memiliki 1 adjustment, dapat %d", len(adjustmentsT2))
	}

	adjustmentsT1, err := whSvc.ListStockAdjustments(1)
	if err != nil {
		t.Fatalf("Gagal list adjustment Tenant 1: %v", err)
	}
	if len(adjustmentsT1) != 0 {
		t.Fatalf("[DATA LEAKAGE KRITIS] StockAdjustment Tenant 2 bocor ke query Tenant 1! Ditemukan %d data", len(adjustmentsT1))
	}

	t.Logf("Sukses E2E Isolasi Multi-Tenant: Tenant 1 (Warehouses: %d, Transfers: %d) vs Tenant 2 (Warehouses: %d, Adjustments: %d) — 100%% Terisolasi",
		len(listT1), len(transfersT1), len(listT2), len(adjustmentsT2))
}
