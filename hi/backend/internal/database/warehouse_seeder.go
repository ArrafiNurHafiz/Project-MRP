package database

import (
	"log"
	"time"

	"github.com/kayukwas/tracking-backend/internal/models"
	"gorm.io/gorm"
)

func SeedWarehouseData(db *gorm.DB) error {
	var count int64
	db.Model(&models.Warehouse{}).Count(&count)
	if count > 0 {
		return nil
	}

	log.Println("[DB] Seeding Warehouses & Inventory Storage Locations...")

	warehouses := []models.Warehouse{
		{
			TenantID:    1,
			Code:        "WH-RAW-01",
			Name:        "Gudang Utama Bahan Baku Kayu",
			Type:        "raw_materials",
			Location:    "Zona A - Gedung Barat",
			Address:     "Kawasan Industri Kayu Blok A-1, Jepara",
			CapacityM3:  1500.0,
			ManagerName: "Slamet Rahardjo",
			IsActive:    true,
		},
		{
			TenantID:    1,
			Code:        "WH-WIP-01",
			Name:        "Lantai Produksi & Staging WIP",
			Type:        "wip",
			Location:    "Zona B - Shopfloor Utama",
			Address:     "Kawasan Industri Kayu Blok B-2, Jepara",
			CapacityM3:  800.0,
			ManagerName: "Agus Prasetyo",
			IsActive:    true,
		},
		{
			TenantID:    1,
			Code:        "WH-FG-01",
			Name:        "Gudang Barang Jadi & Ekspedisi",
			Type:        "finished_goods",
			Location:    "Zona C - Loading Dock",
			Address:     "Kawasan Industri Kayu Blok C-4, Jepara",
			CapacityM3:  2000.0,
			ManagerName: "Budi Santoso",
			IsActive:    true,
		},
		{
			TenantID:    1,
			Code:        "WH-QC-01",
			Name:        "Gudang Karantina & Reject QC",
			Type:        "quarantine",
			Location:    "Zona Q - Area Inspeksi",
			Address:     "Kawasan Industri Kayu Blok Q-1, Jepara",
			CapacityM3:  300.0,
			ManagerName: "Dewi Lestari",
			IsActive:    true,
		},
		{
			TenantID:    1,
			Code:        "WH-SUB-01",
			Name:        "Gudang Mitra Maklon Finishing",
			Type:        "subcontractor",
			Location:    "Vendor Facility - CV Sinar Polishing",
			Address:     "Jl. Raya Tahunan No. 88, Jepara",
			CapacityM3:  600.0,
			ManagerName: "Hendra Wijaya",
			IsActive:    true,
		},
	}

	for _, wh := range warehouses {
		if err := db.Create(&wh).Error; err != nil {
			log.Printf("[DB] Error seeding warehouse %s: %v\n", wh.Code, err)
		}
	}

	// Seed some warehouse stocks for materials
	var materials []models.Material
	db.Find(&materials)

	var whRaw models.Warehouse
	db.Where("code = ?", "WH-RAW-01").First(&whRaw)

	if whRaw.ID > 0 && len(materials) > 0 {
		for _, m := range materials {
			stock := models.WarehouseStock{
				WarehouseID:   whRaw.ID,
				MaterialID:    m.ID,
				Quantity:      m.StockQty,
				ReservedQty:   0,
				MinStock:      m.MinimumStock,
				MaxStock:      m.MinimumStock * 5,
				LastStockDate: time.Now(),
			}
			_ = db.Create(&stock)
		}
	}

	// Seed a sample completed stock transfer
	var whWip models.Warehouse
	db.Where("code = ?", "WH-WIP-01").First(&whWip)

	if whRaw.ID > 0 && whWip.ID > 0 && len(materials) > 0 {
		trf := models.StockTransfer{
			TenantID:        1,
			TransferNumber:  "TRF-20260901-001",
			FromWarehouseID: whRaw.ID,
			ToWarehouseID:   whWip.ID,
			TransferDate:    time.Now().AddDate(0, 0, -5),
			DriverName:      "Bambang Supriadi",
			VehicleNumber:   "K-8812-BL",
			Notes:           "Transfer bahan baku kayu awal shift untuk pengerjaan SPK batch 1",
			Status:          "completed",
			CreatedBy:       1,
			Items: []models.StockTransferItem{
				{
					MaterialID:     materials[0].ID,
					RequestedQty:   20,
					TransferredQty: 20,
					UnitCost:       materials[0].CostPerUnit,
				},
			},
		}
		_ = db.Create(&trf)
	}

	return nil
}
