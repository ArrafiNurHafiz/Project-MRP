package service_test

import (
	"fmt"
	"testing"

	"github.com/kayukwas/tracking-backend/internal/models"
	"github.com/kayukwas/tracking-backend/internal/repository"
	"github.com/kayukwas/tracking-backend/internal/service"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func setupModularFulfillmentDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("Gagal inisialisasi in-memory SQLite: %v", err)
	}

	err = db.AutoMigrate(
		&models.User{},
		&models.AuditLog{},
		&models.Customer{},
		&models.CustomerPIC{},
		&models.Vendor{},
		&models.Product{},
		&models.Material{},
		&models.ProductBOM{},
		&models.WorkStation{},
		&models.WorkOrder{},
		&models.WorkOrderStation{},
		&models.ProductionLog{},
		&models.SalesOrder{},
		&models.SalesOrderItem{},
		&models.PurchaseOrder{},
		&models.PurchaseOrderItem{},
		&models.MaterialBatchLot{},
		&models.Warehouse{},
		&models.WarehouseStock{},
		&models.GoodsReceipt{},
		&models.GoodsReceiptItem{},
		&models.DeliveryOrder{},
		&models.DeliveryOrderItem{},
	)
	if err != nil {
		t.Fatalf("Gagal AutoMigrate test DB: %v", err)
	}

	return db
}

func TestE2E_Modular_InboundAndOutboundFulfillment(t *testing.T) {
	db := setupModularFulfillmentDB(t)

	// 1. Repositories
	userRepo := repository.NewUserRepository(db)
	auditRepo := repository.NewAuditLogRepository(db)
	custRepo := repository.NewCustomerRepository(db)
	vendRepo := repository.NewVendorRepository(db)
	prodRepo := repository.NewProductRepository(db)
	bomRepo := repository.NewBOMRepository(db)
	matRepo := repository.NewMaterialRepository(db)
	woRepo := repository.NewWorkOrderRepository(db)
	soRepo := repository.NewSalesOrderRepository(db)
	poRepo := repository.NewPurchaseOrderRepository(db)
	indRepo := repository.NewIndustrialMRPRepository(db)
	whRepo := repository.NewWarehouseRepository(db)
	grRepo := repository.NewGoodsReceiptRepository(db)
	doRepo := repository.NewDeliveryOrderRepository(db)

	appSvc := service.NewAppServices(nil, userRepo, nil, auditRepo, nil)
	fulfillmentSvc := service.NewFulfillmentService(grRepo, doRepo, poRepo, soRepo, woRepo, matRepo, prodRepo, bomRepo, whRepo, indRepo, appSvc)

	// 2. Seed Master Data
	user := &models.User{Name: "Gudang Supervisor", Email: "wh@kwas.com", Status: "ACTIVE", IsActive: true}
	_ = userRepo.Create(user)

	cust := &models.Customer{Name: "PT Hotel Mewah Bali", Email: "purchasing@hotelbali.com"}
	_ = custRepo.Create(cust)

	vend := &models.Vendor{Name: "CV Kayu Perhutani Sejahtera", IsActive: true}
	_ = vendRepo.Create(vend)

	whRaw := &models.Warehouse{TenantID: 1, Code: "WH-RAW-01", Name: "Gudang Bahan Baku Utama", Type: "raw_materials", IsActive: true}
	_ = whRepo.CreateWarehouse(whRaw)

	whFG := &models.Warehouse{TenantID: 1, Code: "WH-FG-01", Name: "Gudang Barang Jadi", Type: "finished_goods", IsActive: true}
	_ = whRepo.CreateWarehouse(whFG)

	mat := &models.Material{MaterialCode: "KAYU-JATI-P01", Name: "Papan Jati Perhutani 200x20", Category: "wood", Unit: "batang", StockQty: 0, CostPerUnit: 150000}
	_ = matRepo.Create(mat)

	prod := &models.Product{ProductName: "Meja Makan Jati Minimalis 6 Kursi", ProductCode: "MEJA-JATI-001", IsActive: true}
	_ = prodRepo.Create(prod)

	_ = bomRepo.CreateOrUpdate(&models.ProductBOM{
		ProductID:  prod.ID,
		MaterialID: mat.ID,
		StationID:  1,
		Quantity:   4.0,
		WastePct:   5.0,
	})

	// 3. Test Inbound Goods Receipt (Penerimaan PO)
	po := &models.PurchaseOrder{
		PONumber:        "PO-2026-TEST-001",
		VendorID:        vend.ID,
		CreatedByUserID: user.ID,
		Status:          "SUBMITTED",
		TotalAmount:     15000000,
		Items: []models.PurchaseOrderItem{
			{
				MaterialID: mat.ID,
				Qty:        100,
				UnitCost:   150000,
				Subtotal:   15000000,
			},
		},
	}
	_ = poRepo.Create(po)

	grDTO := service.CreateGoodsReceiptDTO{
		TenantID:           1,
		PurchaseOrderID:    po.ID,
		WarehouseID:        whRaw.ID,
		VendorID:           vend.ID,
		ReceivedDate:       "2026-09-27",
		VendorDeliveryNote: "SJ-VEND-7890",
		Items: []service.CreateGoodsReceiptItemDTO{
			{
				MaterialID:      mat.ID,
				OrderedQty:      100,
				ReceivedQty:     100,
				AcceptedQty:     95,
				RejectedQty:     5,
				UnitCost:        150000,
				BatchLotNumber:  "LOT-JATI-2026-001",
				MoistureContent: 11.5,
				QCStatus:        "PASSED",
				WoodOrigin:      "KPH Randublatung - SVLK",
			},
		},
	}

	gr, err := fulfillmentSvc.CreateGoodsReceipt(user.ID, grDTO)
	if err != nil {
		t.Fatalf("Gagal membuat GoodsReceipt: %v", err)
	}

	if gr.Status != "RECEIVED" {
		t.Errorf("Expected status RECEIVED, got %s", gr.Status)
	}

	// Verifikasi stok bahan baku bertambah 95 di master Material dan WarehouseStock
	updatedMat, _ := matRepo.FindByID(mat.ID)
	if updatedMat.StockQty != 95 {
		t.Errorf("Expected Material.StockQty = 95, got %v", updatedMat.StockQty)
	}

	whStock, _ := whRepo.GetStock(whRaw.ID, mat.ID)
	if whStock == nil || whStock.Quantity != 95 {
		t.Errorf("Expected WarehouseStock.Quantity = 95, got %v", whStock)
	}

	// 4. Test Finished Goods Put-Away dari SPK
	wo := &models.WorkOrder{
		SPKNumber:      "SPK-2026-TEST-001",
		ProductID:      prod.ID,
		TotalTargetQty: 10,
		Priority:       "urgent",
		Status:         "in_progress",
	}
	_ = woRepo.Create(wo)

	err = fulfillmentSvc.PutAwayFinishedGoods(user.ID, wo.ID, whFG.ID, 10)
	if err != nil {
		t.Fatalf("Gagal Put-Away Finished Goods: %v", err)
	}

	fgStock, _ := whRepo.GetStock(whFG.ID, prod.ID)
	if fgStock == nil || fgStock.Quantity != 10 {
		t.Errorf("Expected FG WarehouseStock = 10, got %v", fgStock)
	}

	// 5. Test MTS Check on Sales Order
	so := &models.SalesOrder{
		OrderNumber:     "SO-2026-TEST-001",
		CustomerID:      cust.ID,
		CreatedByUserID: user.ID,
		Status:          "PUBLISHED",
		TotalAmount:     50000000,
		Items: []models.SalesOrderItem{
			{
				ProductID:  prod.ID,
				Qty:        8,
				UnitPrice:  5000000,
				TotalPrice: 40000000,
			},
		},
	}
	_ = soRepo.Create(so)

	mtsRes, err := fulfillmentSvc.CheckMTSAvailability(so.ID)
	if err != nil {
		t.Fatalf("Gagal CheckMTSAvailability: %v", err)
	}
	if !mtsRes.AllItemsReady {
		t.Errorf("Expected all items to be MTS ready (10 available vs 8 ordered)")
	}

	// 6. Test Delivery Order (Surat Jalan Pelanggan)
	doDTO := service.CreateDeliveryOrderDTO{
		TenantID:        1,
		SalesOrderID:    so.ID,
		CustomerID:      cust.ID,
		WarehouseID:     whFG.ID,
		DeliveryDate:    "2026-09-28",
		DriverName:      "Pak Joko",
		VehiclePlate:    "B 1234 CD",
		Expedition:      "Truk Mandiri",
		RecipientName:   "Bapak Made (Hotel Bali)",
		ShippingAddress: "Jl. Sunset Road, Seminyak, Bali",
		Items: []service.CreateDeliveryOrderItemDTO{
			{
				ProductID:  prod.ID,
				OrderedQty: 8,
				ShippedQty: 8,
			},
		},
	}

	do, err := fulfillmentSvc.CreateDeliveryOrder(user.ID, doDTO)
	if err != nil {
		t.Fatalf("Gagal membuat DeliveryOrder: %v", err)
	}
	if do.Status != "PACKED" {
		t.Errorf("Expected DO status PACKED, got %s", do.Status)
	}

	// Memberangkatkan pengiriman (Ship) -> stok gudang barang jadi terpotong
	shippedDO, err := fulfillmentSvc.ShipDeliveryOrder(user.ID, do.ID)
	if err != nil {
		t.Fatalf("Gagal memberangkatkan DeliveryOrder: %v", err)
	}
	if shippedDO.Status != "SHIPPED" {
		t.Errorf("Expected status SHIPPED, got %s", shippedDO.Status)
	}

	// Sisa stok barang jadi harus berkurang dari 10 - 8 = 2
	fgStockAfter, _ := whRepo.GetStock(whFG.ID, prod.ID)
	if fgStockAfter == nil || fgStockAfter.Quantity != 2 {
		t.Errorf("Expected FG WarehouseStock = 2, got %v", fgStockAfter)
	}

	// 7. Test Job Costing Variance Analysis
	varianceRes, err := fulfillmentSvc.CalculateJobCostVariance(wo.ID)
	if err != nil {
		t.Fatalf("Gagal menghitung varians HPP: %v", err)
	}
	if varianceRes.TotalStandardCost <= 0 || varianceRes.TotalActualCost <= 0 {
		t.Errorf("Expected positive cost values, got standard=%v, actual=%v", varianceRes.TotalStandardCost, varianceRes.TotalActualCost)
	}
	if len(varianceRes.Breakdown) != 4 {
		t.Errorf("Expected 4 cost breakdown categories, got %d", len(varianceRes.Breakdown))
	}

	t.Logf("Sukses E2E Modular MRP: GRN #%s (Qty +%v) -> Put-Away FG (Qty 10) -> MTS Check (Ready) -> Surat Jalan #%s (Qty -8, Sisa %v) -> Varians HPP Total: Rp %v",
		gr.ReceiptNumber, gr.Items[0].AcceptedQty, do.DONumber, fgStockAfter.Quantity, fmt.Sprintf("%.2f", varianceRes.TotalStandardCost))
}
