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

type dummyAuditService struct{}

func (d *dummyAuditService) RecordLog(actorID *uint64, action, details string) {
}
func (d *dummyAuditService) ListLogs(page, limit int) ([]models.AuditLog, int64, error) {
	return nil, 0, nil
}
func (d *dummyAuditService) ListLogsByUser(userID uint64, page, limit int) ([]models.AuditLog, int64, error) {
	return nil, 0, nil
}

func TestMRPNetRequirementsAndBatchPOGeneration(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open sqlite db: %v", err)
	}

	_ = db.AutoMigrate(
		&models.Material{},
		&models.Vendor{},
		&models.MaterialRequest{},
		&models.MaterialRequestItem{},
		&models.PurchaseOrder{},
		&models.PurchaseOrderItem{},
		&models.WorkOrder{},
		&models.SalesOrder{},
		&models.Product{},
		&models.ProductBOM{},
		&models.WorkStation{},
		&models.Quotation{},
		&models.QuotationItem{},
		&models.Invoice{},
		&models.AuditLog{},
		&models.MaterialBatchLot{},
		&models.Customer{},
		&models.CustomerPIC{},
	)

	// Repos
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

	mrpSvc := service.NewMRPService(
		custRepo, vendRepo, quoteRepo, soRepo, mrRepo, poRepo, invRepo,
		prodRepo, matRepo, bomRepo, woRepo, stRepo, indRepo, &dummyAuditService{},
	)

	// 1. Seed Vendor
	vendor := models.Vendor{
		Name:     "PT Supplier Kayu Sentosa",
		Alias:    "wood",
		PICName:  "Budi Santoso",
		PICEmail: "budi@kayusentosa.com",
		IsActive: true,
	}
	db.Create(&vendor)

	// 2. Seed Material with low stock (Stock 5, Minimum Safety 20)
	mat := models.Material{
		MaterialCode: "MAT-MAHONI-01",
		Name:         "Kayu Mahoni Oven Kering",
		Category:     "wood",
		Unit:         "batang",
		StockQty:     5,
		MinimumStock: 20,
		CostPerUnit:  75000,
	}
	db.Create(&mat)

	// 3. Seed active Material Request with Demand 15
	mr := models.MaterialRequest{
		RequestNumber: "MR-20260901-0001",
		Status:        "PENDING",
		RequestDate:   time.Now(),
		Items: []models.MaterialRequestItem{
			{
				MaterialID:   mat.ID,
				RequiredQty:  15,
				AllocatedQty: 0,
				Unit:         "batang",
				Status:       "SHORTAGE",
			},
		},
	}
	db.Create(&mr)

	// 4. Calculate Net Requirements
	// Demand = 15, Safety = 20, Current Stock = 5, Inbound = 0
	// Net Deficit = (15 + 20) - (5 + 0) = 30
	summary, err := mrpSvc.CalculateNetRequirements(1)
	if err != nil {
		t.Fatalf("CalculateNetRequirements failed: %v", err)
	}

	if summary.DeficitMaterials != 1 {
		t.Errorf("Expected 1 deficit material, got %d", summary.DeficitMaterials)
	}

	if len(summary.Items) == 0 {
		t.Fatalf("Expected items in summary, got 0")
	}

	item := summary.Items[0]
	if item.NetDeficit != 30 {
		t.Errorf("Expected Net Deficit 30, got %f", item.NetDeficit)
	}
	if item.Status != "DEFICIT" {
		t.Errorf("Expected status DEFICIT, got %s", item.Status)
	}

	// 5. Batch Generate PO from MRP
	pos, err := mrpSvc.BatchGeneratePOsFromMRP(1, 1, service.BatchGeneratePODTO{
		MaterialIDs: []uint64{mat.ID},
	})
	if err != nil {
		t.Fatalf("BatchGeneratePOsFromMRP failed: %v", err)
	}

	if len(pos) != 1 {
		t.Fatalf("Expected 1 PO generated, got %d", len(pos))
	}

	createdPO := pos[0]
	if createdPO.VendorID != vendor.ID {
		t.Errorf("Expected PO Vendor %d, got %d", vendor.ID, createdPO.VendorID)
	}
	if len(createdPO.Items) != 1 || createdPO.Items[0].Qty != 30 {
		t.Errorf("Expected PO Item Qty 30, got %+v", createdPO.Items)
	}
}
