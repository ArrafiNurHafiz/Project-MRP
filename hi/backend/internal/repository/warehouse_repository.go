package repository

import (
	"fmt"
	"time"

	"github.com/kayukwas/tracking-backend/internal/models"
	"gorm.io/gorm"
)

type WarehouseRepository interface {
	// Warehouses
	ListWarehouses(tenantID uint64, search string) ([]models.Warehouse, error)
	GetWarehouseByID(id uint64) (*models.Warehouse, error)
	CreateWarehouse(wh *models.Warehouse) error
	UpdateWarehouse(wh *models.Warehouse) error
	DeleteWarehouse(id uint64) error

	// Warehouse Stocks
	GetWarehouseStocks(warehouseID uint64) ([]models.WarehouseStock, error)
	GetStock(warehouseID, materialID uint64) (*models.WarehouseStock, error)
	UpdateStockQty(warehouseID, materialID uint64, deltaQty float64) error

	// Stock Transfers
	ListStockTransfers(tenantID uint64, search string) ([]models.StockTransfer, error)
	GetStockTransferByID(id uint64) (*models.StockTransfer, error)
	CreateStockTransfer(st *models.StockTransfer) error
	CompleteStockTransfer(id uint64) error
	CancelStockTransfer(id uint64) error

	// Stock Adjustments
	ListStockAdjustments(tenantID uint64) ([]models.StockAdjustment, error)
	CreateStockAdjustment(adj *models.StockAdjustment) error
	ApproveStockAdjustment(id uint64, approverID uint64) error
}

type warehouseRepository struct {
	db *gorm.DB
}

func NewWarehouseRepository(db *gorm.DB) WarehouseRepository {
	return &warehouseRepository{db: db}
}

// ----------------- Warehouses -----------------
func (r *warehouseRepository) ListWarehouses(tenantID uint64, search string) ([]models.Warehouse, error) {
	var list []models.Warehouse
	q := r.db.Preload("Stocks.Material")
	if tenantID > 0 {
		q = q.Where("tenant_id = ?", tenantID)
	}
	if search != "" {
		s := "%" + search + "%"
		q = q.Where("name LIKE ? OR code LIKE ? OR location LIKE ?", s, s, s)
	}
	err := q.Find(&list).Error
	return list, err
}

func (r *warehouseRepository) GetWarehouseByID(id uint64) (*models.Warehouse, error) {
	var wh models.Warehouse
	err := r.db.Preload("Stocks.Material").First(&wh, id).Error
	if err != nil {
		return nil, err
	}
	return &wh, nil
}

func (r *warehouseRepository) CreateWarehouse(wh *models.Warehouse) error {
	return r.db.Create(wh).Error
}

func (r *warehouseRepository) UpdateWarehouse(wh *models.Warehouse) error {
	return r.db.Save(wh).Error
}

func (r *warehouseRepository) DeleteWarehouse(id uint64) error {
	return r.db.Delete(&models.Warehouse{}, id).Error
}

// ----------------- Warehouse Stocks -----------------
func (r *warehouseRepository) GetWarehouseStocks(warehouseID uint64) ([]models.WarehouseStock, error) {
	var stocks []models.WarehouseStock
	err := r.db.Where("warehouse_id = ?", warehouseID).Preload("Material").Find(&stocks).Error
	return stocks, err
}

func (r *warehouseRepository) GetStock(warehouseID, materialID uint64) (*models.WarehouseStock, error) {
	var stock models.WarehouseStock
	err := r.db.Where("warehouse_id = ? AND material_id = ?", warehouseID, materialID).First(&stock).Error
	if err != nil {
		return nil, err
	}
	return &stock, nil
}

func (r *warehouseRepository) UpdateStockQty(warehouseID, materialID uint64, deltaQty float64) error {
	var stock models.WarehouseStock
	err := r.db.Where("warehouse_id = ? AND material_id = ?", warehouseID, materialID).First(&stock).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new record
			stock = models.WarehouseStock{
				WarehouseID:   warehouseID,
				MaterialID:    materialID,
				Quantity:      deltaQty,
				LastStockDate: time.Now(),
			}
			return r.db.Create(&stock).Error
		}
		return err
	}

	stock.Quantity += deltaQty
	stock.LastStockDate = time.Now()
	return r.db.Save(&stock).Error
}

// ----------------- Stock Transfers -----------------
func (r *warehouseRepository) ListStockTransfers(tenantID uint64, search string) ([]models.StockTransfer, error) {
	var list []models.StockTransfer
	q := r.db.Preload("FromWarehouse").Preload("ToWarehouse").Preload("Items.Material")
	if tenantID > 0 {
		q = q.Where("tenant_id = ?", tenantID)
	}
	if search != "" {
		s := "%" + search + "%"
		q = q.Where("transfer_number LIKE ? OR driver_name LIKE ?", s, s)
	}
	err := q.Order("id DESC").Find(&list).Error
	return list, err
}

func (r *warehouseRepository) GetStockTransferByID(id uint64) (*models.StockTransfer, error) {
	var st models.StockTransfer
	err := r.db.Preload("FromWarehouse").Preload("ToWarehouse").Preload("Items.Material").First(&st, id).Error
	if err != nil {
		return nil, err
	}
	return &st, nil
}

func (r *warehouseRepository) CreateStockTransfer(st *models.StockTransfer) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(st).Error; err != nil {
			return err
		}
		// If created directly in_transit or draft, items are created via gorm
		return nil
	})
}

func (r *warehouseRepository) CompleteStockTransfer(id uint64) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var st models.StockTransfer
		if err := tx.Preload("Items").First(&st, id).Error; err != nil {
			return err
		}

		if st.Status == "completed" {
			return fmt.Errorf("transfer sudah dalam status completed")
		}

		// Deduct from FromWarehouse, Add to ToWarehouse
		for _, item := range st.Items {
			qty := item.TransferredQty
			if qty <= 0 {
				qty = item.RequestedQty
			}

			// 1. Deduct FromWarehouse
			var fromStock models.WarehouseStock
			if err := tx.Where("warehouse_id = ? AND material_id = ?", st.FromWarehouseID, item.MaterialID).First(&fromStock).Error; err == nil {
				fromStock.Quantity -= qty
				fromStock.LastStockDate = time.Now()
				if err := tx.Save(&fromStock).Error; err != nil {
					return err
				}
			}

			// 2. Add to ToWarehouse
			var toStock models.WarehouseStock
			if err := tx.Where("warehouse_id = ? AND material_id = ?", st.ToWarehouseID, item.MaterialID).First(&toStock).Error; err == nil {
				toStock.Quantity += qty
				toStock.LastStockDate = time.Now()
				if err := tx.Save(&toStock).Error; err != nil {
					return err
				}
			} else if err == gorm.ErrRecordNotFound {
				newTo := models.WarehouseStock{
					WarehouseID:   st.ToWarehouseID,
					MaterialID:    item.MaterialID,
					Quantity:      qty,
					LastStockDate: time.Now(),
				}
				if err := tx.Create(&newTo).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}

		st.Status = "completed"
		return tx.Save(&st).Error
	})
}

func (r *warehouseRepository) CancelStockTransfer(id uint64) error {
	return r.db.Model(&models.StockTransfer{}).Where("id = ?", id).Update("status", "cancelled").Error
}

// ----------------- Stock Adjustments -----------------
func (r *warehouseRepository) ListStockAdjustments(tenantID uint64) ([]models.StockAdjustment, error) {
	var list []models.StockAdjustment
	q := r.db.Preload("Warehouse").Preload("Material")
	if tenantID > 0 {
		q = q.Where("tenant_id = ?", tenantID)
	}
	err := q.Order("id DESC").Find(&list).Error
	return list, err
}

func (r *warehouseRepository) CreateStockAdjustment(adj *models.StockAdjustment) error {
	return r.db.Create(adj).Error
}

func (r *warehouseRepository) ApproveStockAdjustment(id uint64, approverID uint64) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var adj models.StockAdjustment
		if err := tx.First(&adj, id).Error; err != nil {
			return err
		}

		if adj.Status == "approved" {
			return fmt.Errorf("penyesuaian stok sudah disetujui")
		}

		// Update warehouse stock to the CountedQty
		var stock models.WarehouseStock
		err := tx.Where("warehouse_id = ? AND material_id = ?", adj.WarehouseID, adj.MaterialID).First(&stock).Error
		if err == nil {
			stock.Quantity = adj.CountedQty
			stock.LastStockDate = time.Now()
			if err := tx.Save(&stock).Error; err != nil {
				return err
			}
		} else if err == gorm.ErrRecordNotFound {
			newStock := models.WarehouseStock{
				WarehouseID:   adj.WarehouseID,
				MaterialID:    adj.MaterialID,
				Quantity:      adj.CountedQty,
				LastStockDate: time.Now(),
			}
			if err := tx.Create(&newStock).Error; err != nil {
				return err
			}
		}

		// Also update master material stock
		var mat models.Material
		if err := tx.First(&mat, adj.MaterialID).Error; err == nil {
			mat.StockQty = mat.StockQty + adj.DiscrepancyQty
			_ = tx.Save(&mat)
		}

		adj.Status = "approved"
		adj.ApprovedBy = &approverID
		return tx.Save(&adj).Error
	})
}
