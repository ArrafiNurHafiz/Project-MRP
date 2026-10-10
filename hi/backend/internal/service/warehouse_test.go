package service_test

import (
	"testing"

	"github.com/kayukwas/tracking-backend/internal/models"
	"github.com/kayukwas/tracking-backend/internal/repository"
	"github.com/kayukwas/tracking-backend/internal/service"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open sqlite memory db: %v", err)
	}

	err = db.AutoMigrate(
		&models.Material{},
		&models.Warehouse{},
		&models.WarehouseStock{},
		&models.StockTransfer{},
		&models.StockTransferItem{},
		&models.StockAdjustment{},
		&models.AuditLog{},
	)
	if err != nil {
		t.Fatalf("AutoMigrate failed: %v", err)
	}

	return db
}

func TestWarehouseLifecycleAndTransfers(t *testing.T) {
	db := setupTestDB(t)
	repo := repository.NewWarehouseRepository(db)
	svc := service.NewWarehouseService(repo, nil)

	// 1. Create Source Warehouse
	wh1, err := svc.CreateWarehouse(1, service.CreateWarehouseDTO{
		TenantID:    1,
		Code:        "WH-TEST-01",
		Name:        "Gudang Bahan Baku Test",
		Type:        "raw_materials",
		Location:    "Zona 1",
		CapacityM3:  500,
		ManagerName: "Tester",
		IsActive:    true,
	})
	if err != nil {
		t.Fatalf("Failed to create warehouse 1: %v", err)
	}

	// 2. Create Dest Warehouse
	wh2, err := svc.CreateWarehouse(1, service.CreateWarehouseDTO{
		TenantID:    1,
		Code:        "WH-TEST-02",
		Name:        "Gudang WIP Test",
		Type:        "wip",
		Location:    "Zona 2",
		CapacityM3:  200,
		ManagerName: "Tester 2",
		IsActive:    true,
	})
	if err != nil {
		t.Fatalf("Failed to create warehouse 2: %v", err)
	}

	// 3. Create Material & Initial Stock in WH 1
	mat := models.Material{
		MaterialCode: "MAT-WOOD-01",
		Name:         "Kayu Jati Log Grade A",
		Category:     "wood",
		Unit:         "batang",
		StockQty:     100,
		MinimumStock: 20,
		CostPerUnit:  150000,
	}
	db.Create(&mat)

	err = repo.UpdateStockQty(wh1.ID, mat.ID, 50)
	if err != nil {
		t.Fatalf("Failed to set initial stock: %v", err)
	}

	// Verify WH1 stock is 50
	stk1, err := repo.GetStock(wh1.ID, mat.ID)
	if err != nil || stk1.Quantity != 50 {
		t.Fatalf("Expected stock 50, got %v, err: %v", stk1.Quantity, err)
	}

	// 4. Create Stock Transfer from WH1 to WH2 (20 units)
	trf, err := svc.CreateStockTransfer(1, service.CreateStockTransferDTO{
		TenantID:        1,
		FromWarehouseID: wh1.ID,
		ToWarehouseID:   wh2.ID,
		DriverName:      "Pak Supir",
		VehicleNumber:   "B 1234 CD",
		Items: []service.CreateStockTransferItemDTO{
			{
				MaterialID:     mat.ID,
				RequestedQty:   20,
				TransferredQty: 20,
				UnitCost:       150000,
			},
		},
	})
	if err != nil {
		t.Fatalf("CreateStockTransfer failed: %v", err)
	}

	// Complete transfer
	err = svc.CompleteStockTransfer(1, trf.ID)
	if err != nil {
		t.Fatalf("CompleteStockTransfer failed: %v", err)
	}

	// Check WH1 balance (should be 50 - 20 = 30)
	stk1After, _ := repo.GetStock(wh1.ID, mat.ID)
	if stk1After.Quantity != 30 {
		t.Errorf("Expected WH1 stock 30, got %f", stk1After.Quantity)
	}

	// Check WH2 balance (should be 20)
	stk2After, _ := repo.GetStock(wh2.ID, mat.ID)
	if stk2After.Quantity != 20 {
		t.Errorf("Expected WH2 stock 20, got %f", stk2After.Quantity)
	}

	// 5. Stock Adjustment (Physical Count in WH2 found 22, discrepancy +2)
	adj, err := svc.CreateStockAdjustment(1, service.CreateStockAdjustmentDTO{
		TenantID:    1,
		WarehouseID: wh2.ID,
		MaterialID:  mat.ID,
		RecordedQty: 20,
		CountedQty:  22,
		Reason:      "audit_adjustment",
		Notes:       "Ditemukan 2 batang tambahan saat stock opname mingguan",
	})
	if err != nil {
		t.Fatalf("CreateStockAdjustment failed: %v", err)
	}

	err = svc.ApproveStockAdjustment(1, adj.ID)
	if err != nil {
		t.Fatalf("ApproveStockAdjustment failed: %v", err)
	}

	// Check WH2 balance after adjustment (should be 22)
	stk2Adj, _ := repo.GetStock(wh2.ID, mat.ID)
	if stk2Adj.Quantity != 22 {
		t.Errorf("Expected WH2 stock after adjustment to be 22, got %f", stk2Adj.Quantity)
	}
}
