package handler

import (
	"bytes"
	"fmt"
	"io"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/kayukwas/tracking-backend/internal/service"
	"github.com/kayukwas/tracking-backend/internal/utils"
)

type ImportHandlers struct {
	importServ service.ImportService
}

func NewImportHandlers(importServ service.ImportService) *ImportHandlers {
	return &ImportHandlers{importServ: importServ}
}

// DownloadTemplate godoc
// GET /api/v1/import/template/:module
func (h *ImportHandlers) DownloadTemplate(c *fiber.Ctx) error {
	module := c.Params("module")
	filename, content := h.importServ.GetTemplateCSV(module)

	c.Set("Content-Type", "text/csv; charset=utf-8")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	return c.SendString(content)
}

// ImportCSV godoc
// POST /api/v1/import/:module
func (h *ImportHandlers) ImportCSV(c *fiber.Ctx) error {
	actorID, _ := c.Locals("user_id").(uint64)
	module := strings.ToLower(c.Params("module"))

	fileHeader, err := c.FormFile("file")
	var reader io.Reader

	if err == nil && fileHeader != nil {
		f, errOpen := fileHeader.Open()
		if errOpen != nil {
			return utils.JSONError(c, fiber.StatusBadRequest, "Gagal membuka file upload", errOpen.Error())
		}
		defer f.Close()
		reader = f
	} else {
		// Fallback: check raw body CSV
		body := c.Body()
		if len(body) == 0 {
			return utils.JSONError(c, fiber.StatusBadRequest, "File CSV tidak ditemukan dalam request", nil)
		}
		reader = bytes.NewReader(body)
	}

	var res *service.ImportResult
	switch module {
	case "customers":
		res, err = h.importServ.ImportCustomers(actorID, reader)
	case "vendors":
		res, err = h.importServ.ImportVendors(actorID, reader)
	case "materials":
		res, err = h.importServ.ImportMaterials(actorID, reader)
	case "products":
		res, err = h.importServ.ImportProducts(actorID, reader)
	case "bom":
		res, err = h.importServ.ImportBOM(actorID, reader)
	case "mitra-assignments":
		res, err = h.importServ.ImportMitraAssignments(actorID, reader)
	default:
		return utils.JSONError(c, fiber.StatusBadRequest, "Modul import tidak dikenali", nil)
	}

	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return utils.JSONSuccess(c, fiber.StatusOK, fmt.Sprintf("Import %s selesai", module), res)
}
