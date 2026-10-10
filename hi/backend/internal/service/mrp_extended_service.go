package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/kayukwas/tracking-backend/internal/models"
	"github.com/kayukwas/tracking-backend/internal/repository"
)

// DTOs
type CreateRFQItemDTO struct {
	ProductID      *uint64 `json:"product_id"`
	CustomName     string  `json:"custom_name"`
	TargetQuantity int     `json:"target_quantity"`
	TargetBudget   float64 `json:"target_budget"`
	SpecsNotes     string  `json:"specs_notes"`
}

type CreateRFQDTO struct {
	CustomerID      uint64             `json:"customer_id"`
	IsCustomProduct bool               `json:"is_custom_product"`
	TargetDate      *time.Time         `json:"target_date"`
	CustomerNotes   string             `json:"customer_notes"`
	InternalNotes   string             `json:"internal_notes"`
	Items           []CreateRFQItemDTO `json:"items"`
}

type SimulateOrderDTO struct {
	OrderRequiredDate string `json:"order_required_date"` // YYYY-MM-DD
	Items             []struct {
		ProductID    uint64  `json:"product_id"`
		Quantity     int     `json:"quantity"`
		SellingPrice float64 `json:"selling_price"`
	} `json:"items"`
}

type ExtendedMRPService interface {
	// RFQ
	ListRFQs(submissionStatus, processingStatus, search string, page, limit int) ([]models.RFQ, int64, error)
	GetRFQByID(id uint64) (*models.RFQ, error)
	CreateRFQ(actorID uint64, dto CreateRFQDTO) (*models.RFQ, error)
	ApproveRFQ(actorID, id uint64) (*models.RFQ, error)
	ConvertToQuotation(actorID, rfqID uint64) (*models.Quotation, error)

	// Simulation Engine (MPS / CRP)
	SimulateOrder(dto SimulateOrderDTO) (*models.OrderSimulationResult, error)

	// Currency FX
	ListCurrencies() ([]models.CurrencyFX, error)
	UpdateCurrencyRate(actorID uint64, code string, rate float64) error

	// Company Setting
	GetCompanySetting() (*models.CompanySetting, error)
	UpdateCompanySetting(actorID uint64, setting *models.CompanySetting) error

	// Analytics / Reports
	GetFinancialReport() (map[string]interface{}, error)
	GetInventoryReport() (map[string]interface{}, error)
	GetSalesFunnelReport() (map[string]interface{}, error)

	// CPR (Custom Products Request)
	ListCPRs(status, search string, page, limit int) ([]models.CustomProductRequest, int64, error)
	GetCPRByID(id uint64) (*models.CustomProductRequest, error)
	CreateCPR(actorID uint64, cpr *models.CustomProductRequest) (*models.CustomProductRequest, error)
	UpdateCPR(actorID uint64, id uint64, cpr *models.CustomProductRequest) (*models.CustomProductRequest, error)
	ApproveCPR(actorID, id uint64) (*models.CustomProductRequest, error)
	RejectCPR(actorID, id uint64, reason string) (*models.CustomProductRequest, error)
	ConvertCPRToQuotation(actorID, cprID uint64) (*models.Quotation, error)
}

type extendedMRPService struct {
	rfqRepo   repository.RFQRepository
	cprRepo   repository.CPRRepository
	currRepo  repository.CurrencyRepository
	compRepo  repository.CompanySettingRepository
	quoteRepo repository.QuotationRepository
	soRepo    repository.SalesOrderRepository
	woRepo    repository.WorkOrderRepository
	mrRepo    repository.MaterialRequestRepository
	prodRepo  repository.ProductRepository
	matRepo   repository.MaterialRepository
	bomRepo   repository.BOMRepository
	stRepo    repository.WorkStationRepository
	custRepo  repository.CustomerRepository
	invRepo   repository.InvoiceRepository
	auditServ AuditLogService
}

func NewExtendedMRPService(
	rfqRepo repository.RFQRepository,
	cprRepo repository.CPRRepository,
	currRepo repository.CurrencyRepository,
	compRepo repository.CompanySettingRepository,
	quoteRepo repository.QuotationRepository,
	soRepo repository.SalesOrderRepository,
	woRepo repository.WorkOrderRepository,
	mrRepo repository.MaterialRequestRepository,
	prodRepo repository.ProductRepository,
	matRepo repository.MaterialRepository,
	bomRepo repository.BOMRepository,
	stRepo repository.WorkStationRepository,
	custRepo repository.CustomerRepository,
	invRepo repository.InvoiceRepository,
	auditServ AuditLogService,
) ExtendedMRPService {
	return &extendedMRPService{
		rfqRepo:   rfqRepo,
		cprRepo:   cprRepo,
		currRepo:  currRepo,
		compRepo:  compRepo,
		quoteRepo: quoteRepo,
		soRepo:    soRepo,
		woRepo:    woRepo,
		mrRepo:    mrRepo,
		prodRepo:  prodRepo,
		matRepo:   matRepo,
		bomRepo:   bomRepo,
		stRepo:    stRepo,
		custRepo:  custRepo,
		invRepo:   invRepo,
		auditServ: auditServ,
	}
}

// ----------------- RFQ -----------------
func (s *extendedMRPService) ListRFQs(submissionStatus, processingStatus, search string, page, limit int) ([]models.RFQ, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.rfqRepo.FindAll(submissionStatus, processingStatus, search, limit, offset)
}

func (s *extendedMRPService) GetRFQByID(id uint64) (*models.RFQ, error) {
	return s.rfqRepo.FindByID(id)
}

func (s *extendedMRPService) CreateRFQ(actorID uint64, dto CreateRFQDTO) (*models.RFQ, error) {
	if dto.CustomerID == 0 || len(dto.Items) == 0 {
		return nil, errors.New("pelanggan dan minimal 1 item permintaan wajib diisi")
	}

	now := time.Now()
	rfqNo := fmt.Sprintf("RFQ-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	items := make([]models.RFQItem, 0, len(dto.Items))
	for _, it := range dto.Items {
		items = append(items, models.RFQItem{
			ProductID:      it.ProductID,
			CustomName:     it.CustomName,
			TargetQuantity: it.TargetQuantity,
			TargetBudget:   it.TargetBudget,
			SpecsNotes:     it.SpecsNotes,
		})
	}

	procStatus := "READY_TO_QUOTE"
	if dto.IsCustomProduct {
		procStatus = "ANALYSIS_PENDING"
	}

	rfq := &models.RFQ{
		RFQNumber:        rfqNo,
		CustomerID:       dto.CustomerID,
		SubmissionStatus: models.RFQStatusDraft,
		ProcessingStatus: procStatus,
		IsCustomProduct:  dto.IsCustomProduct,
		TargetDate:       dto.TargetDate,
		CustomerNotes:    dto.CustomerNotes,
		InternalNotes:    dto.InternalNotes,
		Items:            items,
	}

	if err := s.rfqRepo.Create(rfq); err != nil {
		return nil, err
	}

	// Auto-create CPR if RFQ contains custom product
	if dto.IsCustomProduct {
		cprNo := fmt.Sprintf("CPR-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)
		prodName := "Custom Manufactured Item"
		reqQty := 1
		targetBudget := 0.0
		specsNotes := ""
		if len(dto.Items) > 0 {
			if dto.Items[0].CustomName != "" {
				prodName = dto.Items[0].CustomName
			}
			if dto.Items[0].TargetQuantity > 0 {
				reqQty = dto.Items[0].TargetQuantity
			}
			targetBudget = dto.Items[0].TargetBudget
			specsNotes = dto.Items[0].SpecsNotes
		}

		cpr := &models.CustomProductRequest{
			CPRNumber:         cprNo,
			RFQID:             &rfq.ID,
			CustomerID:        dto.CustomerID,
			ProductName:       prodName,
			Category:          "custom",
			Unit:              "pcs",
			RequestedQty:      reqQty,
			TargetBudget:      targetBudget,
			TechnicalSpecs:    specsNotes,
			Status:            models.CPRStatusNew,
			EstimatedLeadDays: 14,
		}
		_ = s.cprRepo.Create(cpr)
	}

	s.auditServ.RecordLog(&actorID, "create_rfq", fmt.Sprintf("Membuat Permohonan Penawaran (RFQ) Baru: %s", rfqNo))
	return s.rfqRepo.FindByID(rfq.ID)
}

func (s *extendedMRPService) ApproveRFQ(actorID, id uint64) (*models.RFQ, error) {
	if err := s.rfqRepo.UpdateStatus(id, models.RFQStatusApproved, "READY_TO_QUOTE"); err != nil {
		return nil, err
	}
	s.auditServ.RecordLog(&actorID, "approve_rfq", fmt.Sprintf("Menyetujui RFQ ID %d", id))
	return s.rfqRepo.FindByID(id)
}

func (s *extendedMRPService) ConvertToQuotation(actorID, rfqID uint64) (*models.Quotation, error) {
	rfq, err := s.rfqRepo.FindByID(rfqID)
	if err != nil {
		return nil, errors.New("RFQ tidak ditemukan")
	}

	now := time.Now()
	quoteNo := fmt.Sprintf("QUO-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	var subtotal float64
	quoteItems := make([]models.QuotationItem, 0, len(rfq.Items))

	for _, it := range rfq.Items {
		var unitPrice float64 = it.TargetBudget
		itemName := it.CustomName
		if it.ProductID != nil {
			p, err := s.prodRepo.FindByID(*it.ProductID)
			if err == nil {
				itemName = p.ProductName
				if unitPrice == 0 {
					// Auto calculation from HPP + 30% margin default
					bomList, _ := s.bomRepo.FindByProductID(p.ID)
					var matCost float64
					for _, b := range bomList {
						matCost += b.Quantity * b.Material.CostPerUnit
					}
					unitPrice = (matCost + 8000.0) / 0.70 // 30% margin
				}
			}
		}

		itemTotal := float64(it.TargetQuantity) * unitPrice
		subtotal += itemTotal

		quoteItems = append(quoteItems, models.QuotationItem{
			ProductID:   it.ProductID,
			ItemName:    itemName,
			Description: it.SpecsNotes,
			Qty:         it.TargetQuantity,
			Unit:        "pcs",
			UnitPrice:   unitPrice,
			DiscountPct: 0,
			TotalPrice:  itemTotal,
		})
	}

	taxRate := 11.0
	taxAmount := subtotal * (taxRate / 100.0)
	totalAmount := subtotal + taxAmount

	quote := &models.Quotation{
		QuoteNumber:     quoteNo,
		CustomerID:      rfq.CustomerID,
		CreatedByUserID: actorID,
		Currency:        "IDR",
		DownPaymentPct:  50.0,
		Status:          models.QuoteStatusDraft,
		Subtotal:        subtotal,
		TaxRate:         taxRate,
		TaxAmount:       taxAmount,
		TotalAmount:     totalAmount,
		CustomerNotes:   fmt.Sprintf("Dibuat dari RFQ %s", rfq.RFQNumber),
		Items:           quoteItems,
	}

	if err := s.quoteRepo.Create(quote); err != nil {
		return nil, err
	}

	_ = s.rfqRepo.UpdateStatus(rfqID, models.RFQStatusApproved, "QUOTED")
	s.auditServ.RecordLog(&actorID, "convert_rfq_to_quote", fmt.Sprintf("Konversi RFQ %s menjadi Surat Penawaran: %s", rfq.RFQNumber, quoteNo))
	return s.quoteRepo.FindByID(quote.ID)
}

// ----------------- Order Simulation Engine (MPS / CRP) -----------------
func (s *extendedMRPService) SimulateOrder(dto SimulateOrderDTO) (*models.OrderSimulationResult, error) {
	if len(dto.Items) == 0 {
		return nil, errors.New("minimal 1 item produk untuk disimulasikan")
	}

	var forecastedRevenue float64
	var totalGrossCOGS float64

	materialDemandsMap := make(map[uint64]*models.MaterialDemandBreakdown)
	stationLoadHoursMap := make(map[string]*models.StationCapacityBreakdown)

	// Init stations capacity
	stations, _ := s.stRepo.FindAll()
	for _, st := range stations {
		stationLoadHoursMap[st.StationCode] = &models.StationCapacityBreakdown{
			StationCode:        st.StationCode,
			StationName:        st.Name,
			EstimatedLoadHours: 0,
			MaxCapacityHours:   80.0, // 2 weeks standard capacity in hours
			UtilizationPct:     0,
			IsOverloaded:       false,
		}
	}

	hasAnyShortage := false
	poRecommends := make([]models.PORecommendation, 0)

	for _, item := range dto.Items {
		prod, err := s.prodRepo.FindByID(item.ProductID)
		if err != nil {
			continue
		}

		itemRevenue := float64(item.Quantity) * item.SellingPrice
		forecastedRevenue += itemRevenue

		// BOM Explosion
		bomList, _ := s.bomRepo.FindByProductID(prod.ID)
		for _, b := range bomList {
			grossQty := float64(item.Quantity) * b.Quantity * (1.0 + (b.WastePct / 100.0))
			costSubtotal := grossQty * b.Material.CostPerUnit
			totalGrossCOGS += costSubtotal

			if _, exists := materialDemandsMap[b.MaterialID]; !exists {
				materialDemandsMap[b.MaterialID] = &models.MaterialDemandBreakdown{
					MaterialID:       b.MaterialID,
					MaterialCode:     b.Material.MaterialCode,
					Name:             b.Material.Name,
					Category:         b.Material.Category,
					CurrentStockQty:  b.Material.StockQty,
					RequiredGrossQty: 0,
					NetShortageQty:   0,
					Unit:             b.Material.Unit,
					CostPerUnit:      b.Material.CostPerUnit,
					TotalDemandCost:  0,
					IsShortage:       false,
				}
			}

			demand := materialDemandsMap[b.MaterialID]
			demand.RequiredGrossQty += grossQty
			demand.TotalDemandCost += costSubtotal

			if demand.RequiredGrossQty > demand.CurrentStockQty {
				demand.NetShortageQty = demand.RequiredGrossQty - demand.CurrentStockQty
				demand.IsShortage = true
				hasAnyShortage = true
			}
		}

		// Capacity Rough-Cut Routing Loading (0.15 jam per unit per stasiun)
		for _, st := range stations {
			hoursNeeded := float64(item.Quantity) * 0.12 // 7.2 menit per unit
			sb := stationLoadHoursMap[st.StationCode]
			sb.EstimatedLoadHours += hoursNeeded
			sb.UtilizationPct = (sb.EstimatedLoadHours / sb.MaxCapacityHours) * 100.0
			if sb.UtilizationPct > 100.0 {
				sb.IsOverloaded = true
			}
		}
	}

	demandsList := make([]models.MaterialDemandBreakdown, 0, len(materialDemandsMap))
	for _, dem := range materialDemandsMap {
		demandsList = append(demandsList, *dem)
		if dem.IsShortage {
			poRecommends = append(poRecommends, models.PORecommendation{
				MaterialID:         dem.MaterialID,
				MaterialName:       dem.Name,
				RecommendedQty:     dem.NetShortageQty,
				EstimatedUnitCost:  dem.CostPerUnit,
				EstimatedTotalCost: dem.NetShortageQty * dem.CostPerUnit,
				SuggestedLeadDays:  5,
			})
		}
	}

	capacitiesList := make([]models.StationCapacityBreakdown, 0, len(stationLoadHoursMap))
	for _, capItem := range stationLoadHoursMap {
		capacitiesList = append(capacitiesList, *capItem)
	}

	margin := forecastedRevenue - totalGrossCOGS
	feasibility := "FEASIBLE"
	if hasAnyShortage {
		feasibility = "PARTIAL_SHORTAGE"
	}

	return &models.OrderSimulationResult{
		OrderRequiredDate:   dto.OrderRequiredDate,
		FeasibilityStatus:   feasibility,
		ForecastedRevenue:   forecastedRevenue,
		TotalGrossCOGS:      totalGrossCOGS,
		EstimatedMargin:     margin,
		MaterialDemands:     demandsList,
		StationCapacities:   capacitiesList,
		PurchaseRecommends:  poRecommends,
	}, nil
}

// ----------------- FX & Currency -----------------
func (s *extendedMRPService) ListCurrencies() ([]models.CurrencyFX, error) {
	return s.currRepo.FindAll()
}

func (s *extendedMRPService) UpdateCurrencyRate(actorID uint64, code string, rate float64) error {
	if rate <= 0 {
		return errors.New("kurs harus lebih besar dari 0")
	}
	s.auditServ.RecordLog(&actorID, "update_fx_rate", fmt.Sprintf("Memperbarui Kurs Valuta %s menjadi Rp %.2f", code, rate))
	return s.currRepo.UpdateRate(code, rate)
}

// ----------------- Company Tenant Setting -----------------
func (s *extendedMRPService) GetCompanySetting() (*models.CompanySetting, error) {
	return s.compRepo.GetSetting()
}

func (s *extendedMRPService) UpdateCompanySetting(actorID uint64, setting *models.CompanySetting) error {
	s.auditServ.RecordLog(&actorID, "update_company_setting", fmt.Sprintf("Memperbarui Profil Perusahaan: %s", setting.CompanyName))
	return s.compRepo.UpdateSetting(setting)
}

// ----------------- Reports -----------------
func (s *extendedMRPService) GetFinancialReport() (map[string]interface{}, error) {
	orders, totalOrders, _ := s.soRepo.FindAll("", "", "", 500, 0)
	invoices, totalInvoices, _ := s.invRepo.FindAll("", "", 500, 0)

	var totalRevenue float64
	for _, o := range orders {
		totalRevenue += o.TotalAmount
	}

	var totalPaid float64
	var totalReceivables float64
	for _, inv := range invoices {
		totalPaid += inv.PaidAmount
		totalReceivables += (inv.TotalAmount - inv.PaidAmount)
	}

	return map[string]interface{}{
		"total_revenue":     totalRevenue,
		"total_paid":        totalPaid,
		"total_receivables": totalReceivables,
		"total_orders":      totalOrders,
		"total_invoices":    totalInvoices,
	}, nil
}

func (s *extendedMRPService) GetInventoryReport() (map[string]interface{}, error) {
	mats, totalMats, _ := s.matRepo.FindAll("", "", 500, 0)

	var totalValuation float64
	var lowStockCount int
	for _, m := range mats {
		totalValuation += m.StockQty * m.CostPerUnit
		if m.StockQty <= m.MinimumStock {
			lowStockCount++
		}
	}

	return map[string]interface{}{
		"total_materials": totalMats,
		"total_valuation": totalValuation,
		"low_stock_count": lowStockCount,
		"materials":       mats,
	}, nil
}

func (s *extendedMRPService) GetSalesFunnelReport() (map[string]interface{}, error) {
	rfqs, totalRFQs, _ := s.rfqRepo.FindAll("", "", "", 500, 0)
	quotes, totalQuotes, _ := s.quoteRepo.FindAll("", "", 500, 0)
	orders, totalOrders, _ := s.soRepo.FindAll("", "", "", 500, 0)
	workOrders, totalWOs, _ := s.woRepo.FindAll("", "", "", 500, 0)

	return map[string]interface{}{
		"total_rfqs":        totalRFQs,
		"total_quotes":      totalQuotes,
		"total_orders":      totalOrders,
		"total_work_orders": totalWOs,
		"rfq_to_quote_pct":  float64(totalQuotes) / float64(totalRFQs+1) * 100.0,
		"quote_to_so_pct":   float64(totalOrders) / float64(totalQuotes+1) * 100.0,
		"rfq_samples":       rfqs,
		"quotes_samples":    quotes,
		"orders_samples":    orders,
		"wo_samples":        workOrders,
	}, nil
}

// ----------------- CPR Implementation -----------------

func (s *extendedMRPService) ListCPRs(status, search string, page, limit int) ([]models.CustomProductRequest, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.cprRepo.FindAll(status, search, limit, offset)
}

func (s *extendedMRPService) GetCPRByID(id uint64) (*models.CustomProductRequest, error) {
	return s.cprRepo.FindByID(id)
}

func (s *extendedMRPService) CreateCPR(actorID uint64, cpr *models.CustomProductRequest) (*models.CustomProductRequest, error) {
	now := time.Now()
	if cpr.CPRNumber == "" {
		cpr.CPRNumber = fmt.Sprintf("CPR-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)
	}
	if cpr.Status == "" {
		cpr.Status = models.CPRStatusNew
	}

	// Calculate HPP from materials + routings
	var totalMatCost float64
	for i := range cpr.Materials {
		cpr.Materials[i].Subtotal = cpr.Materials[i].QtyRequired * cpr.Materials[i].UnitCost
		totalMatCost += cpr.Materials[i].Subtotal
	}

	var totalRoutingCost float64
	for i := range cpr.Routings {
		cpr.Routings[i].Subtotal = cpr.Routings[i].EstimatedHours * cpr.Routings[i].HourlyRate
		totalRoutingCost += cpr.Routings[i].Subtotal
	}

	cpr.BasePriceHPP = totalMatCost + totalRoutingCost
	if cpr.SuggestedPrice == 0 && cpr.BasePriceHPP > 0 {
		cpr.SuggestedPrice = cpr.BasePriceHPP * 1.35 // 35% margin default
	}

	if err := s.cprRepo.Create(cpr); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "create_cpr", fmt.Sprintf("Membuat CPR Baru: %s untuk Produk: %s", cpr.CPRNumber, cpr.ProductName))
	return s.cprRepo.FindByID(cpr.ID)
}

func (s *extendedMRPService) UpdateCPR(actorID uint64, id uint64, req *models.CustomProductRequest) (*models.CustomProductRequest, error) {
	existing, err := s.cprRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("CPR tidak ditemukan")
	}

	existing.ProductName = req.ProductName
	existing.Category = req.Category
	existing.Unit = req.Unit
	existing.RequestedQty = req.RequestedQty
	existing.TargetBudget = req.TargetBudget
	existing.EstimatedLeadDays = req.EstimatedLeadDays
	existing.CADFileURL = req.CADFileURL
	existing.TechnicalSpecs = req.TechnicalSpecs
	existing.EngineeringNotes = req.EngineeringNotes
	existing.AssignedEngID = req.AssignedEngID
	if req.Status != "" {
		existing.Status = req.Status
	}

	// Save materials and routings if provided
	var totalMatCost float64
	if req.Materials != nil {
		if err := s.cprRepo.SaveMaterials(id, req.Materials); err != nil {
			return nil, err
		}
		for _, m := range req.Materials {
			totalMatCost += m.QtyRequired * m.UnitCost
		}
	} else {
		for _, m := range existing.Materials {
			totalMatCost += m.Subtotal
		}
	}

	var totalRoutingCost float64
	if req.Routings != nil {
		if err := s.cprRepo.SaveRoutings(id, req.Routings); err != nil {
			return nil, err
		}
		for _, r := range req.Routings {
			totalRoutingCost += r.EstimatedHours * r.HourlyRate
		}
	} else {
		for _, r := range existing.Routings {
			totalRoutingCost += r.Subtotal
		}
	}

	existing.BasePriceHPP = totalMatCost + totalRoutingCost
	if req.SuggestedPrice > 0 {
		existing.SuggestedPrice = req.SuggestedPrice
	} else if existing.BasePriceHPP > 0 {
		existing.SuggestedPrice = existing.BasePriceHPP * 1.35
	}

	if err := s.cprRepo.Update(existing); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "update_cpr", fmt.Sprintf("Update CPR %s (HPP: Rp %.2f, Selling: Rp %.2f)", existing.CPRNumber, existing.BasePriceHPP, existing.SuggestedPrice))
	return s.cprRepo.FindByID(id)
}

func (s *extendedMRPService) ApproveCPR(actorID, id uint64) (*models.CustomProductRequest, error) {
	cpr, err := s.cprRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("CPR tidak ditemukan")
	}

	if err := s.cprRepo.UpdateStatus(id, models.CPRStatusApproved); err != nil {
		return nil, err
	}

	// Also update related RFQ status to READY_TO_QUOTE
	if cpr.RFQID != nil {
		_ = s.rfqRepo.UpdateStatus(*cpr.RFQID, models.RFQStatusApproved, "READY_TO_QUOTE")
	}

	s.auditServ.RecordLog(&actorID, "approve_cpr", fmt.Sprintf("Menyetujui CPR %s - Siap Diterbitkan ke Penawaran", cpr.CPRNumber))
	return s.cprRepo.FindByID(id)
}

func (s *extendedMRPService) RejectCPR(actorID, id uint64, reason string) (*models.CustomProductRequest, error) {
	cpr, err := s.cprRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("CPR tidak ditemukan")
	}

	cpr.Status = models.CPRStatusNeedRevision
	cpr.EngineeringNotes = fmt.Sprintf("%s\n[Revisi Catatan]: %s", cpr.EngineeringNotes, reason)
	_ = s.cprRepo.Update(cpr)

	s.auditServ.RecordLog(&actorID, "reject_cpr", fmt.Sprintf("Meminta Revisi CPR %s: %s", cpr.CPRNumber, reason))
	return s.cprRepo.FindByID(id)
}

func (s *extendedMRPService) ConvertCPRToQuotation(actorID, cprID uint64) (*models.Quotation, error) {
	cpr, err := s.cprRepo.FindByID(cprID)
	if err != nil {
		return nil, errors.New("CPR tidak ditemukan")
	}

	now := time.Now()
	quoteNo := fmt.Sprintf("QUO-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	unitPrice := cpr.SuggestedPrice
	if unitPrice == 0 {
		unitPrice = cpr.BasePriceHPP * 1.35
	}

	itemTotal := float64(cpr.RequestedQty) * unitPrice
	taxRate := 11.0
	taxAmount := itemTotal * (taxRate / 100.0)
	totalAmount := itemTotal + taxAmount

	quoteItems := []models.QuotationItem{
		{
			ItemName:    fmt.Sprintf("[CUSTOM] %s", cpr.ProductName),
			Description: fmt.Sprintf("Spesifikasi: %s\nEstimasi Lead Time: %d hari kerja", cpr.TechnicalSpecs, cpr.EstimatedLeadDays),
			Qty:         cpr.RequestedQty,
			Unit:        cpr.Unit,
			UnitPrice:   unitPrice,
			DiscountPct: 0,
			TotalPrice:  itemTotal,
		},
	}

	validUntil := now.AddDate(0, 1, 0)
	quote := &models.Quotation{
		QuoteNumber:     quoteNo,
		CustomerID:      cpr.CustomerID,
		CreatedByUserID: actorID,
		Currency:        "IDR",
		DownPaymentPct:  50.0,
		ValidUntil:      &validUntil,
		PaymentTerms:    "50% DP, 50% Before Delivery",
		Incoterms:       "EXW",
		RiskLevel:       "LOW",
		Status:          models.QuoteStatusDraft,
		Subtotal:        itemTotal,
		TaxRate:         taxRate,
		TaxAmount:       taxAmount,
		TotalAmount:     totalAmount,
		CustomerNotes:   fmt.Sprintf("Dibuat dari Engineering CPR %s", cpr.CPRNumber),
		Items:           quoteItems,
	}

	if err := s.quoteRepo.Create(quote); err != nil {
		return nil, err
	}

	_ = s.cprRepo.UpdateStatus(cprID, models.CPRStatusCompleted)
	s.auditServ.RecordLog(&actorID, "convert_cpr_to_quote", fmt.Sprintf("Konversi CPR %s menjadi Surat Penawaran Resmi: %s", cpr.CPRNumber, quoteNo))
	return s.quoteRepo.FindByID(quote.ID)
}
