package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/kayukwas/tracking-backend/internal/models"
	"github.com/kayukwas/tracking-backend/internal/repository"
)

// DTOs for MRP
type CreateCustomerDTO struct {
	Name    string                 `json:"name"`
	Email   string                 `json:"email"`
	Phone   string                 `json:"phone"`
	Address string                 `json:"address"`
	Tag     string                 `json:"tag"`
	PICs    []models.CustomerPIC   `json:"pics"`
}

type CreateVendorDTO struct {
	Name     string `json:"name"`
	Alias    string `json:"alias"`
	PICName  string `json:"pic_name"`
	PICEmail string `json:"pic_email"`
	PICPhone string `json:"pic_phone"`
	Address  string `json:"address"`
}

type CreateQuotationItemDTO struct {
	ProductID   *uint64 `json:"product_id"`
	ItemName    string  `json:"item_name"`
	Description string  `json:"description"`
	Qty         int     `json:"qty"`
	Unit        string  `json:"unit"`
	UnitPrice   float64 `json:"unit_price"`
	DiscountPct float64 `json:"discount_pct"`
}

type CreateQuotationDTO struct {
	CustomerID     uint64                   `json:"customer_id"`
	Currency       string                   `json:"currency"`
	DownPaymentPct float64                  `json:"down_payment_pct"`
	ValidUntil     *time.Time               `json:"valid_until"`
	PaymentTerms   string                   `json:"payment_terms"`
	CustomerNotes  string                   `json:"customer_notes"`
	InternalNotes  string                   `json:"internal_notes"`
	Items          []CreateQuotationItemDTO `json:"items"`
}

type CreateSalesOrderDTO struct {
	QuotationID  *uint64                `json:"quotation_id"`
	CustomerID   uint64                 `json:"customer_id"`
	Priority     string                 `json:"priority"` // low, normal, high, urgent
	PlannedStart *time.Time             `json:"planned_start"`
	PlannedEnd   *time.Time             `json:"planned_end"`
	Remarks      string                 `json:"remarks"`
	Items        []CreateQuotationItemDTO `json:"items"`
}

type PublishSalesOrderDTO struct {
	PlannedStart time.Time `json:"planned_start"`
	PlannedEnd   time.Time `json:"planned_end"`
	Priority     string    `json:"priority"`
}

type ProcessWorkOrderDTO struct {
	StartDate    time.Time `json:"start_date"`
	DeadlineDate time.Time `json:"deadline_date"`
}

type AllocateMaterialRequestDTO struct {
	Items []struct {
		MaterialRequestItemID uint64  `json:"item_id"`
		AllocatedQty          float64 `json:"allocated_qty"`
	} `json:"items"`
}

type CreatePurchaseOrderDTO struct {
	VendorID     uint64     `json:"vendor_id"`
	PODate       time.Time  `json:"po_date"`
	ExpectedDate *time.Time `json:"expected_date"`
	Notes        string     `json:"notes"`
	Items        []struct {
		MaterialID uint64  `json:"material_id"`
		Qty        float64 `json:"qty"`
		UnitCost   float64 `json:"unit_cost"`
	} `json:"items"`
}

type CreateInvoiceDTO struct {
	SalesOrderID uint64    `json:"sales_order_id"`
	InvoiceType  string    `json:"invoice_type"` // DOWN_PAYMENT, FULL_PAYMENT, FINAL_SETTLEMENT
	IssueDate    time.Time `json:"issue_date"`
	DueDate      time.Time `json:"due_date"`
	TotalAmount  float64   `json:"total_amount"`
	Notes        string    `json:"notes"`
}

type MRPNetRequirementItem struct {
	MaterialID          uint64  `json:"material_id"`
	Code                string  `json:"code"`
	Name                string  `json:"name"`
	Category            string  `json:"category"`
	Unit                string  `json:"unit"`
	CurrentStock        float64 `json:"current_stock"`
	DemandQty           float64 `json:"demand_qty"`
	InboundQty          float64 `json:"inbound_qty"`
	SafetyStock         float64 `json:"safety_stock"`
	ProjectedStock      float64 `json:"projected_stock"`
	NetDeficit          float64 `json:"net_deficit"`
	RecommendedOrder    float64 `json:"recommended_order"`
	UnitCost            float64 `json:"unit_cost"`
	EstimatedCost       float64 `json:"estimated_cost"`
	PreferredVendorID   uint64  `json:"preferred_vendor_id"`
	PreferredVendorName string  `json:"preferred_vendor_name"`
	LeadTimeDays        int     `json:"lead_time_days"`
	Status              string  `json:"status"` // "OK", "DEFICIT", "CRITICAL"
}

type MRPRunSummary struct {
	CalculatedAt     time.Time               `json:"calculated_at"`
	TotalMaterials   int                     `json:"total_materials"`
	DeficitMaterials int                     `json:"deficit_materials"`
	TotalDeficitCost float64                 `json:"total_deficit_cost"`
	Items            []MRPNetRequirementItem `json:"items"`
}

type BatchGeneratePODTO struct {
	MaterialIDs []uint64 `json:"material_ids"`
}

// MRP Service Interface
type MRPService interface {
	// Customers
	ListCustomers(search string, page, limit int) ([]models.Customer, int64, error)
	GetCustomerByID(id uint64) (*models.Customer, error)
	CreateCustomer(actorID uint64, dto CreateCustomerDTO) (*models.Customer, error)
	UpdateCustomer(actorID, id uint64, dto CreateCustomerDTO) (*models.Customer, error)
	DeleteCustomer(actorID, id uint64) error

	// Vendors
	ListVendors(search string, page, limit int) ([]models.Vendor, int64, error)
	GetVendorByID(id uint64) (*models.Vendor, error)
	CreateVendor(actorID uint64, dto CreateVendorDTO) (*models.Vendor, error)
	UpdateVendor(actorID, id uint64, dto CreateVendorDTO) (*models.Vendor, error)
	DeleteVendor(actorID, id uint64) error

	// Penawaran (Quotes)
	ListQuotations(status, search string, page, limit int) ([]models.Quotation, int64, error)
	GetQuotationByID(id uint64) (*models.Quotation, error)
	GetQuotationByPublicToken(token string) (*models.Quotation, error)
	CreateQuotation(actorID uint64, dto CreateQuotationDTO) (*models.Quotation, error)
	ApproveQuotation(actorID, id uint64) (*models.Quotation, error) // Acc Penawaran
	RejectQuotation(actorID, id uint64) (*models.Quotation, error)
	CustomerApproveQuotation(token, signerName string) (*models.Quotation, *models.SalesOrder, *models.WorkOrder, *models.Invoice, error)
	CustomerReviseQuotation(token, revisionNotes string) (*models.Quotation, error)
	ConvertToSalesOrder(actorID, quotationID uint64) (*models.SalesOrder, error)

	// Pesanan (Orders)
	ListSalesOrders(status, priority, search string, page, limit int) ([]models.SalesOrder, int64, error)
	GetSalesOrderByID(id uint64) (*models.SalesOrder, error)
	CreateSalesOrder(actorID uint64, dto CreateSalesOrderDTO) (*models.SalesOrder, error)
	PublishSalesOrder(actorID, id uint64, dto PublishSalesOrderDTO) (*models.SalesOrder, *models.WorkOrder, error) // Terbitkan -> Buat Perintah Kerja (SPK)

	// Manufaktur & SPK Processing
	ProcessWorkOrder(actorID, woID uint64, dto ProcessWorkOrderDTO) (*models.WorkOrder, *models.MaterialRequest, error) // Siap Proses -> Terbit Perintah Kerja & Permintaan Material
	AutoAllocateFIFOBatches(actorID, woID uint64) (map[string]interface{}, error)
	CreatePOFromMaterialShortage(actorID, woID, vendorID uint64) (*models.PurchaseOrder, error)

	// Automated MRP Procurement Run & Net Requirements
	CalculateNetRequirements(tenantID uint64) (*MRPRunSummary, error)
	BatchGeneratePOsFromMRP(actorID, tenantID uint64, dto BatchGeneratePODTO) ([]*models.PurchaseOrder, error)

	// Permintaan Material (Gudang)
	ListMaterialRequests(status string, page, limit int) ([]models.MaterialRequest, int64, error)
	GetMaterialRequestByID(id uint64) (*models.MaterialRequest, error)
	CheckMaterialAvailability(actorID, mrID uint64) (*models.MaterialRequest, error) // Gudang cek ketersediaan
	AllocateAndIssueMaterials(actorID, mrID uint64) (*models.MaterialRequest, error) // Ambil barang & alokasikan ke produksi

	// Purchase Orders & Invoices
	ListPurchaseOrders(status, search string, page, limit int) ([]models.PurchaseOrder, int64, error)
	CreatePurchaseOrder(actorID uint64, dto CreatePurchaseOrderDTO) (*models.PurchaseOrder, error)
	ReceivePurchaseOrder(actorID, id uint64) (*models.PurchaseOrder, error)
	ListInvoices(status, search string, page, limit int) ([]models.Invoice, int64, error)
	CreateInvoice(actorID uint64, dto CreateInvoiceDTO) (*models.Invoice, error)
	MarkInvoicePaid(actorID, id uint64) (*models.Invoice, error)
}

type mrpService struct {
	custRepo  repository.CustomerRepository
	vendRepo  repository.VendorRepository
	quoteRepo repository.QuotationRepository
	soRepo    repository.SalesOrderRepository
	mrRepo    repository.MaterialRequestRepository
	poRepo    repository.PurchaseOrderRepository
	invRepo   repository.InvoiceRepository
	prodRepo  repository.ProductRepository
	matRepo   repository.MaterialRepository
	bomRepo   repository.BOMRepository
	woRepo    repository.WorkOrderRepository
	stRepo    repository.WorkStationRepository
	indRepo   repository.IndustrialMRPRepository
	auditServ AuditLogService
}

func NewMRPService(
	custRepo repository.CustomerRepository,
	vendRepo repository.VendorRepository,
	quoteRepo repository.QuotationRepository,
	soRepo repository.SalesOrderRepository,
	mrRepo repository.MaterialRequestRepository,
	poRepo repository.PurchaseOrderRepository,
	invRepo repository.InvoiceRepository,
	prodRepo repository.ProductRepository,
	matRepo repository.MaterialRepository,
	bomRepo repository.BOMRepository,
	woRepo repository.WorkOrderRepository,
	stRepo repository.WorkStationRepository,
	indRepo repository.IndustrialMRPRepository,
	auditServ AuditLogService,
) MRPService {
	return &mrpService{
		custRepo:  custRepo,
		vendRepo:  vendRepo,
		quoteRepo: quoteRepo,
		soRepo:    soRepo,
		mrRepo:    mrRepo,
		poRepo:    poRepo,
		invRepo:   invRepo,
		prodRepo:  prodRepo,
		matRepo:   matRepo,
		bomRepo:   bomRepo,
		woRepo:    woRepo,
		stRepo:    stRepo,
		indRepo:   indRepo,
		auditServ: auditServ,
	}
}

// ----------------- Customers -----------------
func (s *mrpService) ListCustomers(search string, page, limit int) ([]models.Customer, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.custRepo.FindAll(search, limit, offset)
}

func (s *mrpService) GetCustomerByID(id uint64) (*models.Customer, error) {
	return s.custRepo.FindByID(id)
}

func (s *mrpService) CreateCustomer(actorID uint64, dto CreateCustomerDTO) (*models.Customer, error) {
	if dto.Name == "" {
		return nil, errors.New("nama pelanggan wajib diisi")
	}
	c := &models.Customer{
		Name:    dto.Name,
		Email:   dto.Email,
		Phone:   dto.Phone,
		Address: dto.Address,
		Tag:     dto.Tag,
		PICs:    dto.PICs,
	}
	if err := s.custRepo.Create(c); err != nil {
		return nil, err
	}
	s.auditServ.RecordLog(&actorID, "create_customer", fmt.Sprintf("Mendaftarkan pelanggan: %s", c.Name))
	return c, nil
}

func (s *mrpService) UpdateCustomer(actorID, id uint64, dto CreateCustomerDTO) (*models.Customer, error) {
	c, err := s.custRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("pelanggan tidak ditemukan")
	}
	c.Name = dto.Name
	c.Email = dto.Email
	c.Phone = dto.Phone
	c.Address = dto.Address
	c.Tag = dto.Tag
	if err := s.custRepo.Update(c); err != nil {
		return nil, err
	}
	s.auditServ.RecordLog(&actorID, "update_customer", fmt.Sprintf("Memperbarui data pelanggan: %s", c.Name))
	return c, nil
}

func (s *mrpService) DeleteCustomer(actorID, id uint64) error {
	s.auditServ.RecordLog(&actorID, "delete_customer", fmt.Sprintf("Menghapus pelanggan ID %d", id))
	return s.custRepo.Delete(id)
}

// ----------------- Vendors -----------------
func (s *mrpService) ListVendors(search string, page, limit int) ([]models.Vendor, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.vendRepo.FindAll(search, limit, offset)
}

func (s *mrpService) GetVendorByID(id uint64) (*models.Vendor, error) {
	return s.vendRepo.FindByID(id)
}

func (s *mrpService) CreateVendor(actorID uint64, dto CreateVendorDTO) (*models.Vendor, error) {
	if dto.Name == "" {
		return nil, errors.New("nama vendor/supplier wajib diisi")
	}
	v := &models.Vendor{
		Name:     dto.Name,
		Alias:    dto.Alias,
		PICName:  dto.PICName,
		PICEmail: dto.PICEmail,
		PICPhone: dto.PICPhone,
		Address:  dto.Address,
		IsActive: true,
	}
	if err := s.vendRepo.Create(v); err != nil {
		return nil, err
	}
	s.auditServ.RecordLog(&actorID, "create_vendor", fmt.Sprintf("Mendaftarkan vendor baru: %s", v.Name))
	return v, nil
}

func (s *mrpService) UpdateVendor(actorID, id uint64, dto CreateVendorDTO) (*models.Vendor, error) {
	v, err := s.vendRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("vendor tidak ditemukan")
	}
	v.Name = dto.Name
	v.Alias = dto.Alias
	v.PICName = dto.PICName
	v.PICEmail = dto.PICEmail
	v.PICPhone = dto.PICPhone
	v.Address = dto.Address
	if err := s.vendRepo.Update(v); err != nil {
		return nil, err
	}
	s.auditServ.RecordLog(&actorID, "update_vendor", fmt.Sprintf("Memperbarui data vendor: %s", v.Name))
	return v, nil
}

func (s *mrpService) DeleteVendor(actorID, id uint64) error {
	s.auditServ.RecordLog(&actorID, "delete_vendor", fmt.Sprintf("Menghapus vendor ID %d", id))
	return s.vendRepo.Delete(id)
}

// ----------------- Penawaran (Quotation) -----------------
func (s *mrpService) ListQuotations(status, search string, page, limit int) ([]models.Quotation, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.quoteRepo.FindAll(status, search, limit, offset)
}

func (s *mrpService) GetQuotationByID(id uint64) (*models.Quotation, error) {
	return s.quoteRepo.FindByID(id)
}

func (s *mrpService) CreateQuotation(actorID uint64, dto CreateQuotationDTO) (*models.Quotation, error) {
	if dto.CustomerID == 0 || len(dto.Items) == 0 {
		return nil, errors.New("pelanggan dan minimal 1 item produk wajib diisi")
	}

	now := time.Now()
	quoteNo := fmt.Sprintf("QUO-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	var subtotal float64
	items := make([]models.QuotationItem, 0, len(dto.Items))

	for _, it := range dto.Items {
		itemSub := float64(it.Qty) * it.UnitPrice * (1.0 - (it.DiscountPct / 100.0))
		subtotal += itemSub

		items = append(items, models.QuotationItem{
			ProductID:   it.ProductID,
			ItemName:    it.ItemName,
			Description: it.Description,
			Qty:         it.Qty,
			Unit:        it.Unit,
			UnitPrice:   it.UnitPrice,
			DiscountPct: it.DiscountPct,
			TotalPrice:  itemSub,
		})
	}

	taxRate := 11.0
	taxAmount := subtotal * (taxRate / 100.0)
	totalAmount := subtotal + taxAmount

	token := fmt.Sprintf("quo-%d-%d", now.UnixNano(), (now.Unix()%10000)+1000)

	quote := &models.Quotation{
		QuoteNumber:     quoteNo,
		PublicToken:     token,
		CustomerID:      dto.CustomerID,
		CreatedByUserID: actorID,
		Currency:        dto.Currency,
		DownPaymentPct:  dto.DownPaymentPct,
		ValidUntil:      dto.ValidUntil,
		PaymentTerms:    dto.PaymentTerms,
		Status:          models.QuoteStatusDraft, // Tersimpan sebagai Draf
		Subtotal:        subtotal,
		TaxRate:         taxRate,
		TaxAmount:       taxAmount,
		TotalAmount:     totalAmount,
		CustomerNotes:   dto.CustomerNotes,
		InternalNotes:   dto.InternalNotes,
		Items:           items,
	}

	if err := s.quoteRepo.Create(quote); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "create_quotation", fmt.Sprintf("Membuat Draf Penawaran Baru: %s (Total: Rp %.2f)", quoteNo, totalAmount))
	return s.quoteRepo.FindByID(quote.ID)
}

// Acc Penawaran (Approve Quote)
func (s *mrpService) ApproveQuotation(actorID, id uint64) (*models.Quotation, error) {
	q, err := s.quoteRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("penawaran tidak ditemukan")
	}

	if q.Status == models.QuoteStatusApproved {
		return q, nil
	}

	q.Status = models.QuoteStatusApproved
	if err := s.quoteRepo.UpdateStatus(id, models.QuoteStatusApproved); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "approve_quotation", fmt.Sprintf("Menyetujui (ACC) Surat Penawaran: %s", q.QuoteNumber))
	return s.quoteRepo.FindByID(id)
}

func (s *mrpService) RejectQuotation(actorID, id uint64) (*models.Quotation, error) {
	if err := s.quoteRepo.UpdateStatus(id, models.QuoteStatusRejected); err != nil {
		return nil, err
	}
	s.auditServ.RecordLog(&actorID, "reject_quotation", fmt.Sprintf("Menolak Surat Penawaran ID %d", id))
	return s.quoteRepo.FindByID(id)
}

func (s *mrpService) GetQuotationByPublicToken(token string) (*models.Quotation, error) {
	if token == "" {
		return nil, errors.New("token portal tidak valid")
	}
	return s.quoteRepo.FindByPublicToken(token)
}

func (s *mrpService) CustomerApproveQuotation(token, signerName string) (*models.Quotation, *models.SalesOrder, *models.WorkOrder, *models.Invoice, error) {
	quote, err := s.quoteRepo.FindByPublicToken(token)
	if err != nil {
		return nil, nil, nil, nil, errors.New("surat penawaran tidak ditemukan atau tautan kadaluarsa")
	}

	if quote.Status == models.QuoteStatusApproved {
		return quote, nil, nil, nil, nil
	}

	now := time.Now()
	quote.Status = models.QuoteStatusApproved
	quote.CustomerSignedBy = signerName
	quote.CustomerSignedAt = &now
	if err := s.quoteRepo.Update(quote); err != nil {
		return nil, nil, nil, nil, err
	}

	// 1. Auto-Generate Sales Order
	orderNo := fmt.Sprintf("SO-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)
	soItems := make([]models.SalesOrderItem, 0, len(quote.Items))
	for _, it := range quote.Items {
		var prodID uint64
		if it.ProductID != nil {
			prodID = *it.ProductID
		}
		soItems = append(soItems, models.SalesOrderItem{
			ProductID:  prodID,
			Qty:        it.Qty,
			UnitPrice:  it.UnitPrice,
			TotalPrice: it.TotalPrice,
		})
	}

	plannedStart := now
	plannedEnd := now.AddDate(0, 0, 14)
	so := &models.SalesOrder{
		OrderNumber:     orderNo,
		QuotationID:     &quote.ID,
		CustomerID:      quote.CustomerID,
		CreatedByUserID: quote.CreatedByUserID,
		Priority:        "normal",
		PlannedStart:    &plannedStart,
		PlannedEnd:      &plannedEnd,
		Status:          models.OrderStatusPublished,
		TotalAmount:     quote.TotalAmount,
		Remarks:         fmt.Sprintf("Auto-generated via Digital Signature Approval by %s on Microsite", signerName),
		Items:           soItems,
	}
	_ = s.soRepo.Create(so)

	// 2. Auto-Generate Work Order
	var primaryWO *models.WorkOrder
	for _, it := range so.Items {
		if it.ProductID == 0 {
			continue
		}
		spkNumber := fmt.Sprintf("SPK-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)
		wo := &models.WorkOrder{
			SPKNumber:      spkNumber,
			ProductID:      it.ProductID,
			TotalTargetQty: it.Qty,
			Priority:       "normal",
			Status:         models.WOStatusDraft,
			StartDate:      &plannedStart,
			DeadlineDate:   &plannedEnd,
		}
		_ = s.woRepo.Create(wo)

		stations, _ := s.stRepo.FindAll()
		for _, st := range stations {
			wos := models.WorkOrderStation{
				WorkOrderID:   wo.ID,
				StationID:     st.ID,
				SequenceOrder: st.SequenceOrder,
				AssignedType:  models.AssignedTypeInternal,
				Status:        models.StationStatusPending,
				InputQty:      it.Qty,
				CompletedQty:  0,
				RejectQty:     0,
				ReworkQty:     0,
				Notes:         fmt.Sprintf("Routing %s", st.Name),
			}
			_ = s.woRepo.UpdateStation(&wos)
		}
		primaryWO = wo
		break
	}

	// 3. Auto-Generate DP Invoice (if DP% > 0)
	var dpInvoice *models.Invoice
	if quote.DownPaymentPct > 0 {
		dpNo := fmt.Sprintf("INV-DP-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)
		dpAmount := quote.TotalAmount * (quote.DownPaymentPct / 100.0)
		dueDate := now.AddDate(0, 0, 7) // 7 days DP due
		dpInvoice = &models.Invoice{
			InvoiceNumber: dpNo,
			SalesOrderID:  so.ID,
			InvoiceType:   "DOWN_PAYMENT",
			IssueDate:     now,
			DueDate:       dueDate,
			TotalAmount:   dpAmount,
			PaidAmount:    0,
			PaymentStatus: models.InvoiceStatusUnpaid,
			Notes:         fmt.Sprintf("Uang Muka (Down Payment %.0f%%) atas Penawaran %s", quote.DownPaymentPct, quote.QuoteNumber),
		}
		_ = s.invRepo.Create(dpInvoice)
	}

	actorID := quote.CreatedByUserID
	s.auditServ.RecordLog(&actorID, "customer_approve_quotation", fmt.Sprintf("Pelanggan (%s) Menyetujui Penawaran %s via Microsite -> Terbit SO %s", signerName, quote.QuoteNumber, orderNo))
	return quote, so, primaryWO, dpInvoice, nil
}

func (s *mrpService) CustomerReviseQuotation(token, revisionNotes string) (*models.Quotation, error) {
	quote, err := s.quoteRepo.FindByPublicToken(token)
	if err != nil {
		return nil, errors.New("surat penawaran tidak ditemukan atau tautan kadaluarsa")
	}

	quote.Status = "NEED_REVISION"
	quote.CustomerNotes = fmt.Sprintf("%s\n[Permintaan Revisi Pelanggan]: %s", quote.CustomerNotes, revisionNotes)
	if err := s.quoteRepo.Update(quote); err != nil {
		return nil, err
	}

	actorID := quote.CreatedByUserID
	s.auditServ.RecordLog(&actorID, "customer_revise_quotation", fmt.Sprintf("Pelanggan Meminta Revisi Penawaran %s: %s", quote.QuoteNumber, revisionNotes))
	return quote, nil
}

// Convert Quote to Sales Order
func (s *mrpService) ConvertToSalesOrder(actorID, quotationID uint64) (*models.SalesOrder, error) {
	quote, err := s.quoteRepo.FindByID(quotationID)
	if err != nil {
		return nil, errors.New("penawaran tidak ditemukan")
	}

	if quote.Status != models.QuoteStatusApproved {
		return nil, errors.New("penawaran harus di-ACC / disetujui terlebih dahulu sebelum diubah menjadi pesanan")
	}

	now := time.Now()
	orderNo := fmt.Sprintf("SO-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	soItems := make([]models.SalesOrderItem, 0, len(quote.Items))
	for _, it := range quote.Items {
		var prodID uint64
		if it.ProductID != nil {
			prodID = *it.ProductID
		}
		soItems = append(soItems, models.SalesOrderItem{
			ProductID:  prodID,
			Qty:        it.Qty,
			UnitPrice:  it.UnitPrice,
			TotalPrice: it.TotalPrice,
		})
	}

	so := &models.SalesOrder{
		OrderNumber:     orderNo,
		QuotationID:     &quote.ID,
		CustomerID:      quote.CustomerID,
		CreatedByUserID: actorID,
		Priority:        "normal",
		Status:          models.OrderStatusDraft, // Berbentuk DRAF
		TotalAmount:     quote.TotalAmount,
		Remarks:         fmt.Sprintf("Pesanan hasil konversi dari Penawaran %s", quote.QuoteNumber),
		Items:           soItems,
	}

	if err := s.soRepo.Create(so); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "convert_quote_to_so", fmt.Sprintf("Konversi Penawaran %s menjadi Pesanan Penjualan (Draft): %s", quote.QuoteNumber, orderNo))
	return s.soRepo.FindByID(so.ID)
}

// ----------------- Pesanan (Sales Order) -----------------
func (s *mrpService) ListSalesOrders(status, priority, search string, page, limit int) ([]models.SalesOrder, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.soRepo.FindAll(status, priority, search, limit, offset)
}

func (s *mrpService) GetSalesOrderByID(id uint64) (*models.SalesOrder, error) {
	return s.soRepo.FindByID(id)
}

func (s *mrpService) CreateSalesOrder(actorID uint64, dto CreateSalesOrderDTO) (*models.SalesOrder, error) {
	if dto.CustomerID == 0 || len(dto.Items) == 0 {
		return nil, errors.New("pelanggan dan minimal 1 item produk wajib diisi")
	}

	now := time.Now()
	orderNo := fmt.Sprintf("SO-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	var totalAmount float64
	soItems := make([]models.SalesOrderItem, 0, len(dto.Items))

	for _, it := range dto.Items {
		var pID uint64
		if it.ProductID != nil {
			pID = *it.ProductID
		}
		itemSub := float64(it.Qty) * it.UnitPrice
		totalAmount += itemSub

		soItems = append(soItems, models.SalesOrderItem{
			ProductID:  pID,
			Qty:        it.Qty,
			UnitPrice:  it.UnitPrice,
			TotalPrice: itemSub,
		})
	}

	priority := dto.Priority
	if priority == "" {
		priority = "normal"
	}

	so := &models.SalesOrder{
		OrderNumber:     orderNo,
		QuotationID:     dto.QuotationID,
		CustomerID:      dto.CustomerID,
		CreatedByUserID: actorID,
		Priority:        priority,
		PlannedStart:    dto.PlannedStart,
		PlannedEnd:      dto.PlannedEnd,
		Status:          models.OrderStatusDraft, // DRAF
		TotalAmount:     totalAmount,
		Remarks:         dto.Remarks,
		Items:           soItems,
	}

	if err := s.soRepo.Create(so); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "create_sales_order", fmt.Sprintf("Membuat Draf Pesanan Baru: %s", orderNo))
	return s.soRepo.FindByID(so.ID)
}

// Terbitkan Pesanan (Publish Sales Order -> Set Tanggal Mulai & Selesai -> Otomatis Buat Perintah Kerja / Work Order)
func (s *mrpService) PublishSalesOrder(actorID, id uint64, dto PublishSalesOrderDTO) (*models.SalesOrder, *models.WorkOrder, error) {
	so, err := s.soRepo.FindByID(id)
	if err != nil {
		return nil, nil, errors.New("pesanan tidak ditemukan")
	}

	so.PlannedStart = &dto.PlannedStart
	so.PlannedEnd = &dto.PlannedEnd
	if dto.Priority != "" {
		so.Priority = dto.Priority
	}
	so.Status = models.OrderStatusPublished

	if err := s.soRepo.Update(so); err != nil {
		return nil, nil, err
	}

	// Buat Perintah Kerja (Work Order / SPK) untuk setiap produk dalam pesanan
	var createdWO *models.WorkOrder
	now := time.Now()

	for _, it := range so.Items {
		spkNumber := fmt.Sprintf("SPK-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)
		wo := &models.WorkOrder{
			SPKNumber:      spkNumber,
			ProductID:      it.ProductID,
			TotalTargetQty: it.Qty,
			Priority:       so.Priority,
			Status:         models.WOStatusDraft, // SPK Draf awal
			StartDate:      &dto.PlannedStart,
			DeadlineDate:   &dto.PlannedEnd,
		}
		_ = s.woRepo.Create(wo)

		// Setup default station routings
		stations, _ := s.stRepo.FindAll()
		for _, st := range stations {
			wos := models.WorkOrderStation{
				WorkOrderID:   wo.ID,
				StationID:     st.ID,
				SequenceOrder: st.SequenceOrder,
				AssignedType:  models.AssignedTypeInternal,
				Status:        models.StationStatusPending,
				InputQty:      it.Qty,
				CompletedQty:  0,
				RejectQty:     0,
				ReworkQty:     0,
				Notes:         fmt.Sprintf("Routing %s untuk %s", st.Name, it.Product.ProductName),
			}
			_ = s.woRepo.UpdateStation(&wos)
		}

		createdWO, _ = s.woRepo.FindByID(wo.ID)
		break // return primary WO reference
	}

	s.auditServ.RecordLog(&actorID, "publish_sales_order", fmt.Sprintf("Menerbitkan Pesanan %s: Mulai %s, Selesai %s, Terbit Perintah Kerja", so.OrderNumber, dto.PlannedStart.Format("2006-01-02"), dto.PlannedEnd.Format("2006-01-02")))
	return so, createdWO, nil
}

// ----------------- Manufaktur: Eksekusi Perintah Kerja (SPK) -----------------
// Klik Detail -> Siap Proses -> Input Tanggal Mulai & Selesai -> Terbit Perintah Kerja (Produksi) -> Otomatis Terbit Permintaan Material (Gudang)
func (s *mrpService) ProcessWorkOrder(actorID, woID uint64, dto ProcessWorkOrderDTO) (*models.WorkOrder, *models.MaterialRequest, error) {
	wo, err := s.woRepo.FindByID(woID)
	if err != nil {
		return nil, nil, errors.New("perintah kerja (SPK) tidak ditemukan")
	}

	wo.StartDate = &dto.StartDate
	wo.DeadlineDate = &dto.DeadlineDate
	wo.Status = models.WOStatusInProgress

	// Update first station to In Progress
	if len(wo.Stations) > 0 {
		wo.Stations[0].Status = models.StationStatusInProgress
		_ = s.woRepo.UpdateStation(&wo.Stations[0])
	}

	if err := s.woRepo.Update(wo); err != nil {
		return nil, nil, err
	}

	// Otomatis Terbitkan Permintaan Material ke Gudang berdasarkan BOM
	now := time.Now()
	mrNumber := fmt.Sprintf("MR-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	bomList, _ := s.bomRepo.FindByProductID(wo.ProductID)
	mrItems := make([]models.MaterialRequestItem, 0, len(bomList))

	for _, bom := range bomList {
		reqGross := float64(wo.TotalTargetQty) * bom.Quantity * (1.0 + (bom.WastePct / 100.0))
		mrItems = append(mrItems, models.MaterialRequestItem{
			MaterialID:   bom.MaterialID,
			RequiredQty:  reqGross,
			AvailableQty: bom.Material.StockQty,
			AllocatedQty: 0,
			Unit:         bom.Material.Unit,
			Status:       "PENDING",
			Notes:        fmt.Sprintf("Kebutuhan BOM %s untuk %d pcs produk", bom.Material.Name, wo.TotalTargetQty),
		})
	}

	matReq := &models.MaterialRequest{
		RequestNumber: mrNumber,
		WorkOrderID:   wo.ID,
		RequestedByID: actorID,
		Status:        models.MatReqStatusWaiting, // WAITING_CHECK (Menunggu gudang cek ketersediaan)
		RequestDate:   now,
		Notes:         fmt.Sprintf("Permintaan material otomatis dari eksekusi SPK %s", wo.SPKNumber),
		Items:         mrItems,
	}

	_ = s.mrRepo.Create(matReq)
	createdMR, _ := s.mrRepo.FindByID(matReq.ID)

	s.auditServ.RecordLog(&actorID, "process_work_order", fmt.Sprintf("SPK %s Siap Diproses -> Terbit Permintaan Material Gudang: %s", wo.SPKNumber, mrNumber))
	return wo, createdMR, nil
}

// Auto-Allocate Material from FIFO Batches
func (s *mrpService) AutoAllocateFIFOBatches(actorID, woID uint64) (map[string]interface{}, error) {
	wo, err := s.woRepo.FindByID(woID)
	if err != nil {
		return nil, errors.New("work order tidak ditemukan")
	}

	mr, err := s.mrRepo.FindByWorkOrderID(woID)
	if err != nil {
		return nil, errors.New("permintaan material untuk work order ini tidak ditemukan")
	}

	allocatedDetails := make([]map[string]interface{}, 0)
	shortages := make([]map[string]interface{}, 0)
	allFulfilled := true

	for i, item := range mr.Items {
		needed := item.RequiredQty - item.AllocatedQty
		if needed <= 0 {
			continue
		}

		lots, _ := s.indRepo.FindAvailableActiveLots(item.MaterialID)
		var totalAllocatedForThisItem float64

		for _, lot := range lots {
			if needed <= 0 {
				break
			}
			allocFromLot := lot.RemainingQty
			if allocFromLot > needed {
				allocFromLot = needed
			}

			_ = s.indRepo.DeductBatchStock(lot.BatchNumber, allocFromLot)
			_ = s.matRepo.AdjustStock(item.MaterialID, -allocFromLot)

			totalAllocatedForThisItem += allocFromLot
			needed -= allocFromLot

			allocatedDetails = append(allocatedDetails, map[string]interface{}{
				"material_id":    item.MaterialID,
				"material_name":  item.Material.Name,
				"batch_number":   lot.BatchNumber,
				"allocated_qty":  allocFromLot,
				"unit":           item.Unit,
			})
		}

		mr.Items[i].AllocatedQty += totalAllocatedForThisItem
		if needed > 0 {
			allFulfilled = false
			mr.Items[i].Status = "SHORTAGE"
			shortages = append(shortages, map[string]interface{}{
				"material_id":   item.MaterialID,
				"material_name": item.Material.Name,
				"shortage_qty":  needed,
				"unit":          item.Unit,
				"cost_per_unit": item.Material.CostPerUnit,
			})
		} else {
			mr.Items[i].Status = "ALLOCATED"
		}
	}

	if allFulfilled {
		mr.Status = models.MatReqStatusAllocated
		wo.Status = "ready_to_process"
		_ = s.woRepo.Update(wo)
	} else {
		mr.Status = models.MatReqStatusShortage
	}
	_ = s.mrRepo.Update(mr)

	s.auditServ.RecordLog(&actorID, "auto_allocate_fifo", fmt.Sprintf("Auto-Alokasi Batch FIFO untuk WO %s (Fulfilled: %v)", wo.SPKNumber, allFulfilled))

	return map[string]interface{}{
		"work_order_id":    woID,
		"spk_number":       wo.SPKNumber,
		"all_fulfilled":    allFulfilled,
		"allocated_lots":   allocatedDetails,
		"shortages":        shortages,
		"material_request": mr,
	}, nil
}

// 1-Click PO Creation for Material Shortages
func (s *mrpService) CreatePOFromMaterialShortage(actorID, woID, vendorID uint64) (*models.PurchaseOrder, error) {
	mr, err := s.mrRepo.FindByWorkOrderID(woID)
	if err != nil {
		return nil, errors.New("permintaan material tidak ditemukan")
	}

	if vendorID == 0 {
		// Pick first active vendor as default if not specified
		vendors, total, _ := s.vendRepo.FindAll("", 1, 0)
		if total == 0 || len(vendors) == 0 {
			return nil, errors.New("belum ada vendor terdaftar di sistem")
		}
		vendorID = vendors[0].ID
	}

	poItems := make([]struct {
		MaterialID uint64  `json:"material_id"`
		Qty        float64 `json:"qty"`
		UnitCost   float64 `json:"unit_cost"`
	}, 0)

	for _, it := range mr.Items {
		shortage := it.RequiredQty - it.AllocatedQty
		if shortage > 0 {
			poItems = append(poItems, struct {
				MaterialID uint64  `json:"material_id"`
				Qty        float64 `json:"qty"`
				UnitCost   float64 `json:"unit_cost"`
			}{
				MaterialID: it.MaterialID,
				Qty:        shortage,
				UnitCost:   it.Material.CostPerUnit,
			})
		}
	}

	if len(poItems) == 0 {
		return nil, errors.New("tidak ada defisit material pada Work Order ini")
	}

	now := time.Now()
	expected := now.AddDate(0, 0, 7)
	dto := CreatePurchaseOrderDTO{
		VendorID:     vendorID,
		PODate:       now,
		ExpectedDate: &expected,
		Notes:        fmt.Sprintf("Auto-generated PO untuk mengatasi defisit material SPK/WO ID %d", woID),
		Items:        poItems,
	}

	return s.CreatePurchaseOrder(actorID, dto)
}

// ----------------- Permintaan Material (Gudang) -----------------
func (s *mrpService) ListMaterialRequests(status string, page, limit int) ([]models.MaterialRequest, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.mrRepo.FindAll(status, limit, offset)
}

func (s *mrpService) GetMaterialRequestByID(id uint64) (*models.MaterialRequest, error) {
	return s.mrRepo.FindByID(id)
}

// Gudang cek ketersediaan material
func (s *mrpService) CheckMaterialAvailability(actorID, mrID uint64) (*models.MaterialRequest, error) {
	mr, err := s.mrRepo.FindByID(mrID)
	if err != nil {
		return nil, errors.New("permintaan material tidak ditemukan")
	}

	hasShortage := false
	for i, it := range mr.Items {
		mat, err := s.matRepo.FindByID(it.MaterialID)
		if err == nil {
			mr.Items[i].AvailableQty = mat.StockQty
			if mat.StockQty < it.RequiredQty {
				hasShortage = true
				mr.Items[i].Status = "SHORTAGE"
			} else {
				mr.Items[i].Status = "READY"
			}
		}
	}

	if hasShortage {
		mr.Status = models.MatReqStatusShortage
	} else {
		mr.Status = models.MatReqStatusAvailable
	}

	mr.CheckedByID = &actorID
	_ = s.mrRepo.Update(mr)

	s.auditServ.RecordLog(&actorID, "check_material_request", fmt.Sprintf("Gudang memeriksa ketersediaan material untuk %s (Status: %s)", mr.RequestNumber, mr.Status))
	return s.mrRepo.FindByID(mrID)
}

// Gudang ambil barang dan serahkan / alokasikan ke produksi
func (s *mrpService) AllocateAndIssueMaterials(actorID, mrID uint64) (*models.MaterialRequest, error) {
	mr, err := s.mrRepo.FindByID(mrID)
	if err != nil {
		return nil, errors.New("permintaan material tidak ditemukan")
	}

	now := time.Now()
	for i, it := range mr.Items {
		// Potong stok gudang aktual
		_ = s.matRepo.AdjustStock(it.MaterialID, -it.RequiredQty)
		mr.Items[i].AllocatedQty = it.RequiredQty
		mr.Items[i].Status = "TAKEN"
	}

	mr.Status = models.MatReqStatusIssued
	mr.AllocationDate = &now
	_ = s.mrRepo.Update(mr)

	s.auditServ.RecordLog(&actorID, "issue_material_request", fmt.Sprintf("Gudang menyerahkan material untuk %s ke lantai produksi", mr.RequestNumber))
	return s.mrRepo.FindByID(mrID)
}

// ----------------- Purchase Orders & Invoices -----------------
func (s *mrpService) ListPurchaseOrders(status, search string, page, limit int) ([]models.PurchaseOrder, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.poRepo.FindAll(status, search, limit, offset)
}

func (s *mrpService) CreatePurchaseOrder(actorID uint64, dto CreatePurchaseOrderDTO) (*models.PurchaseOrder, error) {
	if dto.VendorID == 0 || len(dto.Items) == 0 {
		return nil, errors.New("vendor dan item pesanan material wajib diisi")
	}

	now := time.Now()
	poNo := fmt.Sprintf("PO-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	var totalAmount float64
	poItems := make([]models.PurchaseOrderItem, 0, len(dto.Items))

	for _, it := range dto.Items {
		sub := it.Qty * it.UnitCost
		totalAmount += sub
		poItems = append(poItems, models.PurchaseOrderItem{
			MaterialID: it.MaterialID,
			Qty:        it.Qty,
			UnitCost:   it.UnitCost,
			Subtotal:   sub,
		})
	}

	po := &models.PurchaseOrder{
		PONumber:        poNo,
		VendorID:        dto.VendorID,
		CreatedByUserID: actorID,
		PODate:          dto.PODate,
		ExpectedDate:    dto.ExpectedDate,
		Status:          models.POStatusDraft,
		TotalAmount:     totalAmount,
		Notes:           dto.Notes,
		Items:           poItems,
	}

	if err := s.poRepo.Create(po); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "create_purchase_order", fmt.Sprintf("Menerbitkan Purchase Order Material: %s (Total: Rp %.2f)", poNo, totalAmount))
	return s.poRepo.FindByID(po.ID)
}

func (s *mrpService) ReceivePurchaseOrder(actorID, id uint64) (*models.PurchaseOrder, error) {
	po, err := s.poRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("purchase order tidak ditemukan")
	}

	if po.Status == models.POStatusReceived {
		return po, nil
	}

	// Tambah stok material yang diterima
	for _, it := range po.Items {
		_ = s.matRepo.AdjustStock(it.MaterialID, it.Qty)
	}

	po.Status = models.POStatusReceived
	_ = s.poRepo.UpdateStatus(id, models.POStatusReceived)

	s.auditServ.RecordLog(&actorID, "receive_purchase_order", fmt.Sprintf("Penerimaan Material dari PO: %s masuk ke stok gudang", po.PONumber))
	return s.poRepo.FindByID(id)
}

func (s *mrpService) ListInvoices(status, search string, page, limit int) ([]models.Invoice, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.invRepo.FindAll(status, search, limit, offset)
}

func (s *mrpService) CreateInvoice(actorID uint64, dto CreateInvoiceDTO) (*models.Invoice, error) {
	if dto.SalesOrderID == 0 || dto.TotalAmount <= 0 {
		return nil, errors.New("sales order dan nominal tagihan wajib diisi")
	}

	now := time.Now()
	invNo := fmt.Sprintf("INV-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	inv := &models.Invoice{
		InvoiceNumber: invNo,
		SalesOrderID:  dto.SalesOrderID,
		InvoiceType:   dto.InvoiceType,
		IssueDate:     dto.IssueDate,
		DueDate:       dto.DueDate,
		TotalAmount:   dto.TotalAmount,
		PaidAmount:    0,
		PaymentStatus: models.InvoiceStatusUnpaid,
		Notes:         dto.Notes,
	}

	if err := s.invRepo.Create(inv); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "create_invoice", fmt.Sprintf("Menerbitkan Faktur Tagihan: %s untuk SO ID %d", invNo, dto.SalesOrderID))
	return s.invRepo.FindByID(inv.ID)
}

func (s *mrpService) MarkInvoicePaid(actorID, id uint64) (*models.Invoice, error) {
	inv, err := s.invRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("faktur tagihan tidak ditemukan")
	}

	inv.PaidAmount = inv.TotalAmount
	inv.PaymentStatus = models.InvoiceStatusPaid
	_ = s.invRepo.Update(inv)

	s.auditServ.RecordLog(&actorID, "pay_invoice", fmt.Sprintf("Pelunasan Faktur Tagihan: %s (Rp %.2f)", inv.InvoiceNumber, inv.TotalAmount))
	return s.invRepo.FindByID(id)
}

// ----------------- Automated MRP Procurement Run & Net Requirements -----------------
func (s *mrpService) CalculateNetRequirements(tenantID uint64) (*MRPRunSummary, error) {
	materials, _, err := s.matRepo.FindAll("", "", 1000, 0)
	if err != nil {
		return nil, err
	}

	vendors, _, _ := s.vendRepo.FindAll("", 100, 0)
	var defaultVendorID uint64
	var defaultVendorName string = "Vendor Mitra Terpilih"
	if len(vendors) > 0 {
		defaultVendorID = vendors[0].ID
		defaultVendorName = vendors[0].Name
	}

	// 1. Calculate Demand from active Material Requests (status not ALLOCATED/COMPLETED)
	mrs, _, _ := s.mrRepo.FindAll("", 1000, 0)
	demandMap := make(map[uint64]float64)
	for _, mr := range mrs {
		if mr.Status != models.MatReqStatusAllocated && mr.Status != "COMPLETED" && mr.Status != "CANCELLED" {
			for _, it := range mr.Items {
				needed := it.RequiredQty - it.AllocatedQty
				if needed > 0 {
					demandMap[it.MaterialID] += needed
				}
			}
		}
	}

	// 2. Calculate Inbound from open Purchase Orders (status draft, approved, ordered)
	pos, _, _ := s.poRepo.FindAll("", "", 1000, 0)
	inboundMap := make(map[uint64]float64)
	for _, po := range pos {
		if po.Status != models.POStatusReceived && po.Status != models.POStatusCancelled {
			for _, it := range po.Items {
				inboundMap[it.MaterialID] += it.Qty
			}
		}
	}

	summary := &MRPRunSummary{
		CalculatedAt: time.Now(),
		Items:        make([]MRPNetRequirementItem, 0, len(materials)),
	}

	for _, mat := range materials {
		demand := demandMap[mat.ID]
		inbound := inboundMap[mat.ID]
		current := mat.StockQty
		safety := mat.MinimumStock
		projected := current + inbound - demand

		netDeficit := 0.0
		if (demand + safety) > (current + inbound) {
			netDeficit = (demand + safety) - (current + inbound)
		}

		status := "OK"
		if netDeficit > 0 {
			if current <= 0 {
				status = "CRITICAL"
			} else {
				status = "DEFICIT"
			}
			summary.DeficitMaterials++
			summary.TotalDeficitCost += netDeficit * mat.CostPerUnit
		}

		vID := defaultVendorID
		vName := defaultVendorName
		if len(vendors) > 0 {
			// Select vendor matching category in alias or name, or default
			for _, v := range vendors {
				if v.Alias == mat.Category || v.Name != "" {
					vID = v.ID
					vName = v.Name
					break
				}
			}
		}

		item := MRPNetRequirementItem{
			MaterialID:          mat.ID,
			Code:                mat.MaterialCode,
			Name:                mat.Name,
			Category:            mat.Category,
			Unit:                mat.Unit,
			CurrentStock:        current,
			DemandQty:           demand,
			InboundQty:          inbound,
			SafetyStock:         safety,
			ProjectedStock:      projected,
			NetDeficit:          netDeficit,
			RecommendedOrder:    netDeficit,
			UnitCost:            mat.CostPerUnit,
			EstimatedCost:       netDeficit * mat.CostPerUnit,
			PreferredVendorID:   vID,
			PreferredVendorName: vName,
			LeadTimeDays:        5,
			Status:              status,
		}

		summary.Items = append(summary.Items, item)
	}

	summary.TotalMaterials = len(materials)
	return summary, nil
}

func (s *mrpService) BatchGeneratePOsFromMRP(actorID, tenantID uint64, dto BatchGeneratePODTO) ([]*models.PurchaseOrder, error) {
	summary, err := s.CalculateNetRequirements(tenantID)
	if err != nil {
		return nil, err
	}

	selectedMap := make(map[uint64]bool)
	for _, id := range dto.MaterialIDs {
		selectedMap[id] = true
	}

	// Group deficit items by Preferred Vendor
	vendorGroup := make(map[uint64][]MRPNetRequirementItem)
	for _, it := range summary.Items {
		if it.NetDeficit > 0 {
			if len(dto.MaterialIDs) == 0 || selectedMap[it.MaterialID] {
				vendorID := it.PreferredVendorID
				if vendorID == 0 {
					vendors, total, _ := s.vendRepo.FindAll("", 1, 0)
					if total > 0 && len(vendors) > 0 {
						vendorID = vendors[0].ID
					}
				}
				if vendorID > 0 {
					vendorGroup[vendorID] = append(vendorGroup[vendorID], it)
				}
			}
		}
	}

	if len(vendorGroup) == 0 {
		return nil, errors.New("tidak ada defisit material yang dipilih untuk digenerate PO")
	}

	createdPOs := make([]*models.PurchaseOrder, 0)
	now := time.Now()
	expected := now.AddDate(0, 0, 7)

	for vendorID, items := range vendorGroup {
		poItems := make([]struct {
			MaterialID uint64  `json:"material_id"`
			Qty        float64 `json:"qty"`
			UnitCost   float64 `json:"unit_cost"`
		}, len(items))

		for i, it := range items {
			poItems[i] = struct {
				MaterialID uint64  `json:"material_id"`
				Qty        float64 `json:"qty"`
				UnitCost   float64 `json:"unit_cost"`
			}{
				MaterialID: it.MaterialID,
				Qty:        it.RecommendedOrder,
				UnitCost:   it.UnitCost,
			}
		}

		poDTO := CreatePurchaseOrderDTO{
			VendorID:     vendorID,
			PODate:       now,
			ExpectedDate: &expected,
			Notes:        fmt.Sprintf("Auto-generated Batch PO via MRP Engine (%d items)", len(items)),
			Items:        poItems,
		}

		po, err := s.CreatePurchaseOrder(actorID, poDTO)
		if err == nil && po != nil {
			createdPOs = append(createdPOs, po)
		}
	}

	s.auditServ.RecordLog(&actorID, "mrp_batch_generate_po", fmt.Sprintf("Auto-generate %d Purchase Order via MRP Net Requirements Engine", len(createdPOs)))
	return createdPOs, nil
}
