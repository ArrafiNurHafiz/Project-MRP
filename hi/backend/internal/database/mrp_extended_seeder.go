package database

import (
	"log"

	"github.com/kayukwas/tracking-backend/internal/models"
	"gorm.io/gorm"
)

func SeedExtendedMRPData(db *gorm.DB) error {
	// 1. Currencies
	currencies := []models.CurrencyFX{
		{Code: "IDR", Name: "Indonesian Rupiah", Symbol: "Rp", ExchangeRate: 1.0, IsActive: true},
		{Code: "USD", Name: "US Dollar", Symbol: "$", ExchangeRate: 15750.0, IsActive: true},
		{Code: "SGD", Name: "Singapore Dollar", Symbol: "S$", ExchangeRate: 11800.0, IsActive: true},
		{Code: "EUR", Name: "Euro", Symbol: "€", ExchangeRate: 17100.0, IsActive: true},
	}

	for _, c := range currencies {
		var count int64
		db.Model(&models.CurrencyFX{}).Where("code = ?", c.Code).Count(&count)
		if count == 0 {
			db.Create(&c)
		}
	}

	// 2. Company Tenant Setting
	var compCount int64
	db.Model(&models.CompanySetting{}).Count(&compCount)
	if compCount == 0 {
		comp := models.CompanySetting{
			CompanyName: "PT Kayu KWAS Manufaktur Indonesia",
			NPWP:        "01.234.567.8-901.000",
			Email:       "corp@kayukwas.co.id",
			Phone:       "+62 271-889922",
			Address:     "Kawasan Industri Mebel Kayu KWAS, Sukoharjo, Jawa Tengah",
		}
		db.Create(&comp)
	}

	log.Println("[DB] SeedExtendedMRPData completed successfully")
	return nil
}
