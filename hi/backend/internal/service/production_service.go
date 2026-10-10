package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/kayukwas/tracking-backend/internal/models"
	"github.com/kayukwas/tracking-backend/internal/repository"
)

// DTOs
type CreateProductDTO struct {
	ProductName string `json:"product_name"`
	ProductCode string `json:"product_code"`
}

type CreateMaterialDTO struct {
	MaterialCode string  `json:"material_code"`
	Name         string  `json:"name"`
	Category     string  `json:"category"`
	Unit         string  `json:"unit"`
	StockQty     float64 `json:"stock_qty"`
	MinimumStock float64 `json:"minimum_stock"`
	CostPerUnit  float64 `json:"cost_per_unit"`
}

type AdjustStockDTO struct {
	QtyDelta float64 `json:"qty_delta"`
	Reason   string  `json:"reason"`
}

type SaveProductBOMDTO struct {
	ProductID  uint64  `json:"product_id"`
	MaterialID uint64  `json:"material_id"`
	StationID  uint64  `json:"station_id"`
	Quantity   float64 `json:"quantity"`
	WastePct   float64 `json:"waste_pct"`
	Notes      string  `json:"notes"`
}

type CreateSPKDTO struct {
	ProductID      uint64     `json:"product_id"`
	TotalTargetQty int        `json:"total_target_qty"`
	Priority       string     `json:"priority"` // normal, urgent
	DeadlineDate   *time.Time `json:"deadline_date,omitempty"`
}

type UpdateStationWorkerDTO struct {
	AssignedType   string  `json:"assigned_type"` // internal, mitra
	AssignedUserID *uint64 `json:"assigned_user_id"`
}

type ReportProgressDTO struct {
	LogType         string `json:"log_type"` // start, progress_report, finish, issue
	ReportedQtyPass int    `json:"reported_qty_pass"`
	ReportedQtyRej  int    `json:"reported_qty_reject"`
	Notes           string `json:"notes"`
	Channel         string `json:"channel"` // web, whatsapp
}

type SaveMitraAssignmentDTO struct {
	MitraUserID           uint64  `json:"mitra_user_id"`
	ProductID             uint64  `json:"product_id"`
	StationID             uint64  `json:"station_id"`
	PieceRateFee          float64 `json:"piece_rate_fee"`
	DailyCapacityEstimate int     `json:"daily_capacity_estimate"`
	Notes                 string  `json:"notes"`
}

type SubmitQCInspectionDTO struct {
	WorkOrderStationID uint64 `json:"work_order_station_id"`
	InspectionModel    string `json:"inspection_model"` // in_house, pickup_joint_model_a, onsite_autonomous_model_b
	SampleQty          int    `json:"sample_qty"`
	PassQty            int    `json:"pass_qty"`
	RejectMinorQty     int    `json:"reject_minor_qty"` // Bisa diperbaiki tidak berubah banyak
	RejectMajorQty     int    `json:"reject_major_qty"` // Harus bongkar
	RejectScrapQty     int    `json:"reject_scrap_qty"` // Harus ganti
	DefectCategories   string `json:"defect_categories"`
	Notes              string `json:"notes"`
}

type CreateShipmentItemDTO struct {
	ProductID      *uint64 `json:"product_id"`
	RawItemName    string  `json:"raw_item_name"`
	Qty            int     `json:"qty"`
	StatusCategory string  `json:"status_category"` // revisi_total, revisi_jamur, revisi_cacat_lain
	Notes          string  `json:"notes"`
}

type CreateShipmentDTO struct {
	VehicleGateStatus string                  `json:"vehicle_gate_status"` // keluar, masuk
	ProductAction     string                  `json:"product_action"`     // kirim, ambil
	MovementDate      string                  `json:"movement_date"`
	MovementTime      string                  `json:"movement_time"`
	DriverName        string                  `json:"driver_name"`
	HelperName        string                  `json:"helper_name"`
	QCInspectorName   *string                 `json:"qc_inspector_name"`
	VehicleType       string                  `json:"vehicle_type"`
	LicensePlate      string                  `json:"license_plate"`
	MitraID           *uint64                 `json:"mitra_id"`
	Notes             string                  `json:"notes"`
	Items             []CreateShipmentItemDTO `json:"items"`
}

// Modular MRP Calculations Output
type ProductCostCalculation struct {
	ProductID        uint64             `json:"product_id"`
	ProductName      string             `json:"product_name"`
	ProductCode      string             `json:"product_code"`
	TotalMaterialCost float64            `json:"total_material_cost"`
	TotalLaborCost   float64            `json:"total_labor_cost"`
	TotalHPPPerUnit  float64            `json:"total_hpp_per_unit"`
	MaterialsBreakdown []BOMCostDetail  `json:"materials_breakdown"`
	LaborBreakdown   []LaborCostDetail  `json:"labor_breakdown"`
}

type BOMCostDetail struct {
	MaterialName string  `json:"material_name"`
	Category     string  `json:"category"`
	Quantity     float64 `json:"quantity"`
	Unit         string  `json:"unit"`
	UnitCost     float64 `json:"unit_cost"`
	Subtotal     float64 `json:"subtotal"`
}

type LaborCostDetail struct {
	StationName  string  `json:"station_name"`
	AssignedType string  `json:"assigned_type"`
	WorkerName   string  `json:"worker_name"`
	FeePerUnit   float64 `json:"fee_per_unit"`
}

type MitraPayrollSummary struct {
	MitraID      uint64  `json:"mitra_id"`
	MitraName    string  `json:"mitra_name"`
	Phone        string  `json:"phone"`
	TotalPassQty int     `json:"total_pass_qty"`
	TotalPayout  float64 `json:"total_payout"`
	SPKBreakdown []MitraSPKPayout `json:"spk_breakdown"`
}

type MitraSPKPayout struct {
	SPKNumber   string  `json:"spk_number"`
	ProductName string  `json:"product_name"`
	StationName string  `json:"station_name"`
	PassQty     int     `json:"pass_qty"`
	RatePerPcs  float64 `json:"rate_per_pcs"`
	TotalSubtotal float64 `json:"total_subtotal"`
}

// Service Interface
type ProductionService interface {
	// Products & Stations
	ListProducts(search string, page, limit int) ([]models.Product, int64, error)
	GetProductByID(id uint64) (*models.Product, error)
	CreateProduct(actorID uint64, dto CreateProductDTO) (*models.Product, error)
	ListStations() ([]models.WorkStation, error)

	// MRP: Materials & BOM
	ListMaterials(search, category string, page, limit int) ([]models.Material, int64, error)
	CreateMaterial(actorID uint64, dto CreateMaterialDTO) (*models.Material, error)
	AdjustMaterialStock(actorID, matID uint64, dto AdjustStockDTO) (*models.Material, error)
	GetProductBOM(productID uint64) ([]models.ProductBOM, error)
	SaveProductBOM(actorID uint64, dto SaveProductBOMDTO) error
	DeleteProductBOM(actorID, bomID uint64) error

	// MRP: Calculations & Financials
	CalculateProductHPP(productID uint64) (*ProductCostCalculation, error)
	GetMitraPayrollSummary(mitraID uint64) ([]MitraPayrollSummary, error)

	// SPK / Work Order
	CreateSPK(actorID uint64, dto CreateSPKDTO) (*models.WorkOrder, error)
	ListSPK(status, priority, search string, page, limit int) ([]models.WorkOrder, int64, error)
	GetSPKByID(id uint64) (*models.WorkOrder, error)
	AssignStationWorker(actorID, wosID uint64, dto UpdateStationWorkerDTO) (*models.WorkOrderStation, error)
	ReportStationProgress(actorID, wosID uint64, dto ReportProgressDTO) (*models.WorkOrderStation, error)

	// Mitra Assignments
	ListMitraAssignments(mitraID uint64) ([]models.MitraProductStationAssignment, error)
	SaveMitraAssignment(actorID uint64, dto SaveMitraAssignmentDTO) (*models.MitraProductStationAssignment, error)
	DeleteMitraAssignment(actorID, id uint64) error

	// QC
	SubmitQCInspection(inspectorID uint64, dto SubmitQCInspectionDTO) (*models.QCLog, error)
	ListRecentQCLogs(limit int) ([]models.QCLog, error)

	// Logistics
	CreateShipment(actorID uint64, dto CreateShipmentDTO) (*models.MitraShipment, error)
	ListShipments(page, limit int) ([]models.MitraShipment, int64, error)
}

// Service Implementation
type productionService struct {
	prodRepo    repository.ProductRepository
	matRepo     repository.MaterialRepository
	bomRepo     repository.BOMRepository
	stationRepo repository.WorkStationRepository
	woRepo      repository.WorkOrderRepository
	mitraRepo   repository.MitraAssignmentRepository
	qcRepo      repository.QCRepository
	logistRepo  repository.LogisticsRepository
	auditServ   AuditLogService
}

func NewProductionService(
	prodRepo repository.ProductRepository,
	matRepo repository.MaterialRepository,
	bomRepo repository.BOMRepository,
	stationRepo repository.WorkStationRepository,
	woRepo repository.WorkOrderRepository,
	mitraRepo repository.MitraAssignmentRepository,
	qcRepo repository.QCRepository,
	logistRepo repository.LogisticsRepository,
	auditServ AuditLogService,
) ProductionService {
	return &productionService{
		prodRepo:    prodRepo,
		matRepo:     matRepo,
		bomRepo:     bomRepo,
		stationRepo: stationRepo,
		woRepo:      woRepo,
		mitraRepo:   mitraRepo,
		qcRepo:      qcRepo,
		logistRepo:  logistRepo,
		auditServ:   auditServ,
	}
}

// ---------------- Products & Stations ----------------
func (s *productionService) ListProducts(search string, page, limit int) ([]models.Product, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.prodRepo.FindAll(search, limit, offset)
}

func (s *productionService) GetProductByID(id uint64) (*models.Product, error) {
	return s.prodRepo.FindByID(id)
}

func (s *productionService) CreateProduct(actorID uint64, dto CreateProductDTO) (*models.Product, error) {
	if dto.ProductName == "" || dto.ProductCode == "" {
		return nil, errors.New("nama produk dan kode produk wajib diisi")
	}

	p := &models.Product{
		ProductName: dto.ProductName,
		ProductCode: dto.ProductCode,
		IsActive:    true,
	}

	if err := s.prodRepo.Create(p); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "create_product", fmt.Sprintf("Menambahkan master produk baru: %s (%s)", p.ProductName, p.ProductCode))
	return p, nil
}

func (s *productionService) ListStations() ([]models.WorkStation, error) {
	return s.stationRepo.FindAll()
}

// ---------------- MRP: Materials & BOM ----------------
func (s *productionService) ListMaterials(search, category string, page, limit int) ([]models.Material, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.matRepo.FindAll(search, category, limit, offset)
}

func (s *productionService) CreateMaterial(actorID uint64, dto CreateMaterialDTO) (*models.Material, error) {
	if dto.MaterialCode == "" || dto.Name == "" || dto.Unit == "" {
		return nil, errors.New("kode, nama material, dan satuan unit wajib diisi")
	}

	mat := &models.Material{
		MaterialCode: dto.MaterialCode,
		Name:         dto.Name,
		Category:     dto.Category,
		Unit:         dto.Unit,
		StockQty:     dto.StockQty,
		MinimumStock: dto.MinimumStock,
		CostPerUnit:  dto.CostPerUnit,
	}

	if err := s.matRepo.Create(mat); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "create_material", fmt.Sprintf("Menambahkan master material baru: %s (%s) Stok: %.2f %s", mat.Name, mat.MaterialCode, mat.StockQty, mat.Unit))
	return mat, nil
}

func (s *productionService) AdjustMaterialStock(actorID, matID uint64, dto AdjustStockDTO) (*models.Material, error) {
	if err := s.matRepo.AdjustStock(matID, dto.QtyDelta); err != nil {
		return nil, err
	}
	mat, err := s.matRepo.FindByID(matID)
	if err != nil {
		return nil, err
	}
	s.auditServ.RecordLog(&actorID, "adjust_material_stock", fmt.Sprintf("Penyesuaian stok material %s (%s): Delta %.2f, Alasan: %s", mat.Name, mat.MaterialCode, dto.QtyDelta, dto.Reason))
	return mat, nil
}

func (s *productionService) GetProductBOM(productID uint64) ([]models.ProductBOM, error) {
	return s.bomRepo.FindByProductID(productID)
}

func (s *productionService) SaveProductBOM(actorID uint64, dto SaveProductBOMDTO) error {
	if dto.ProductID == 0 || dto.MaterialID == 0 || dto.StationID == 0 || dto.Quantity <= 0 {
		return errors.New("produk, material, stasiun, dan kuantitas per unit wajib diisi")
	}

	bom := &models.ProductBOM{
		ProductID:  dto.ProductID,
		MaterialID: dto.MaterialID,
		StationID:  dto.StationID,
		Quantity:   dto.Quantity,
		WastePct:   dto.WastePct,
		Notes:      dto.Notes,
	}

	if err := s.bomRepo.CreateOrUpdate(bom); err != nil {
		return err
	}

	s.auditServ.RecordLog(&actorID, "save_product_bom", fmt.Sprintf("Menyimpan konfigurasi BOM untuk produk ID %d material ID %d (Qty: %.4f)", dto.ProductID, dto.MaterialID, dto.Quantity))
	return nil
}

func (s *productionService) DeleteProductBOM(actorID, bomID uint64) error {
	s.auditServ.RecordLog(&actorID, "delete_product_bom", fmt.Sprintf("Menghapus item BOM ID %d", bomID))
	return s.bomRepo.Delete(bomID)
}

// ---------------- MRP: Calculations & Financials ----------------
func (s *productionService) CalculateProductHPP(productID uint64) (*ProductCostCalculation, error) {
	product, err := s.prodRepo.FindByID(productID)
	if err != nil {
		return nil, errors.New("produk tidak ditemukan")
	}

	bomList, err := s.bomRepo.FindByProductID(productID)
	if err != nil {
		return nil, err
	}

	var totalMaterialCost float64
	materialsBreakdown := []BOMCostDetail{}

	for _, b := range bomList {
		grossQty := b.Quantity * (1.0 + (b.WastePct / 100.0))
		subtotal := grossQty * b.Material.CostPerUnit
		totalMaterialCost += subtotal

		materialsBreakdown = append(materialsBreakdown, BOMCostDetail{
			MaterialName: b.Material.Name,
			Category:     b.Material.Category,
			Quantity:     b.Quantity,
			Unit:         b.Material.Unit,
			UnitCost:     b.Material.CostPerUnit,
			Subtotal:     subtotal,
		})
	}

	// Labor & Work Center costs (Stasiun 1 s.d. 5)
	var totalLaborCost float64
	laborBreakdown := []LaborCostDetail{}

	assignments, _ := s.mitraRepo.FindAll(0)
	mitraFeeMap := make(map[uint64]float64)
	mitraNameMap := make(map[uint64]string)
	for _, a := range assignments {
		if a.ProductID == productID {
			mitraFeeMap[a.StationID] = a.PieceRateFee
			if a.MitraUser.ID > 0 {
				mitraNameMap[a.StationID] = a.MitraUser.Name
			}
		}
	}

	stations, _ := s.stationRepo.FindAll()
	for _, st := range stations {
		var fee float64
		workerName := "In-House Operator"
		assignedType := "internal"

		if customFee, ok := mitraFeeMap[st.ID]; ok && customFee > 0 {
			fee = customFee
			assignedType = "mitra"
			if name, ok2 := mitraNameMap[st.ID]; ok2 {
				workerName = name
			}
		} else {
			// Standard in-house factory rate estimate
			switch st.StationCode {
			case models.StationCodeWoodWorking:
				fee = 3500.0
			case models.StationCodePascaWoodWorking:
				fee = 2000.0
			case models.StationCodeFinishing:
				fee = 1500.0
			case models.StationCodePascaFinishing:
				fee = 2500.0 // Laser + QC
			case models.StationCodePacking:
				fee = 1000.0
			default:
				fee = 1500.0
			}
		}

		totalLaborCost += fee
		laborBreakdown = append(laborBreakdown, LaborCostDetail{
			StationName:  st.Name,
			AssignedType: assignedType,
			WorkerName:   workerName,
			FeePerUnit:   fee,
		})
	}

	totalHPP := totalMaterialCost + totalLaborCost

	return &ProductCostCalculation{
		ProductID:          product.ID,
		ProductName:        product.ProductName,
		ProductCode:        product.ProductCode,
		TotalMaterialCost:  totalMaterialCost,
		TotalLaborCost:    totalLaborCost,
		TotalHPPPerUnit:    totalHPP,
		MaterialsBreakdown: materialsBreakdown,
		LaborBreakdown:     laborBreakdown,
	}, nil
}

func (s *productionService) GetMitraPayrollSummary(mitraID uint64) ([]MitraPayrollSummary, error) {
	assignments, err := s.mitraRepo.FindAll(mitraID)
	if err != nil {
		return nil, err
	}

	mitraMap := make(map[uint64]*MitraPayrollSummary)

	// Fetch all completed/verified work order stations
	workOrders, _, _ := s.woRepo.FindAll("", "", "", 200, 0)

	for _, wo := range workOrders {
		for _, wos := range wo.Stations {
			if wos.AssignedType == models.AssignedTypeMitra && wos.AssignedUserID != nil {
				mUID := *wos.AssignedUserID
				if mitraID > 0 && mUID != mitraID {
					continue
				}

				// Find fee
				var rate float64 = 3500.0
				for _, a := range assignments {
					if a.MitraUserID == mUID && a.ProductID == wo.ProductID && a.StationID == wos.StationID {
						rate = a.PieceRateFee
						break
					}
				}

				if _, exists := mitraMap[mUID]; !exists {
					mName := "Mitra KWAS"
					mPhone := "-"
					if wos.AssignedUser != nil {
						mName = wos.AssignedUser.Name
						if wos.AssignedUser.PhoneNumber != nil {
							mPhone = *wos.AssignedUser.PhoneNumber
						}
					}

					mitraMap[mUID] = &MitraPayrollSummary{
						MitraID:      mUID,
						MitraName:    mName,
						Phone:        mPhone,
						TotalPassQty: 0,
						TotalPayout:  0,
						SPKBreakdown: []MitraSPKPayout{},
					}
				}

				subtotal := float64(wos.CompletedQty) * rate
				mitraMap[mUID].TotalPassQty += wos.CompletedQty
				mitraMap[mUID].TotalPayout += subtotal
				mitraMap[mUID].SPKBreakdown = append(mitraMap[mUID].SPKBreakdown, MitraSPKPayout{
					SPKNumber:     wo.SPKNumber,
					ProductName:   wo.Product.ProductName,
					StationName:   wos.Station.Name,
					PassQty:       wos.CompletedQty,
					RatePerPcs:    rate,
					TotalSubtotal: subtotal,
				})
			}
		}
	}

	result := make([]MitraPayrollSummary, 0, len(mitraMap))
	for _, summary := range mitraMap {
		result = append(result, *summary)
	}

	return result, nil
}

// ---------------- SPK / Work Orders ----------------
func (s *productionService) CreateSPK(actorID uint64, dto CreateSPKDTO) (*models.WorkOrder, error) {
	if dto.ProductID == 0 || dto.TotalTargetQty <= 0 {
		return nil, errors.New("produk dan target kuantitas (lebih dari 0) wajib diisi")
	}

	product, err := s.prodRepo.FindByID(dto.ProductID)
	if err != nil {
		return nil, errors.New("produk tidak ditemukan")
	}

	now := time.Now()
	spkNumber := fmt.Sprintf("SPK-%04d-%02d-%04d", now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	priority := dto.Priority
	if priority == "" {
		priority = "normal"
	}

	wo := &models.WorkOrder{
		SPKNumber:      spkNumber,
		ProductID:      dto.ProductID,
		TotalTargetQty: dto.TotalTargetQty,
		Priority:       priority,
		Status:         models.WOStatusInProgress,
		StartDate:      &now,
		DeadlineDate:   dto.DeadlineDate,
	}

	if err := s.woRepo.Create(wo); err != nil {
		return nil, fmt.Errorf("gagal membuat SPK: %w", err)
	}

	// Auto-create 5 WorkStation Routing steps
	stations, err := s.stationRepo.FindAll()
	if err == nil {
		for i, st := range stations {
			status := models.StationStatusPending
			if i == 0 {
				status = models.StationStatusInProgress
			}

			wos := models.WorkOrderStation{
				WorkOrderID:   wo.ID,
				StationID:     st.ID,
				SequenceOrder: st.SequenceOrder,
				AssignedType:  models.AssignedTypeInternal,
				Status:        status,
				InputQty:      dto.TotalTargetQty,
				CompletedQty:  0,
				RejectQty:     0,
				ReworkQty:     0,
				Notes:         fmt.Sprintf("Routing %s untuk %s", st.Name, product.ProductName),
			}
			_ = s.woRepo.UpdateStation(&wos)
		}
	}

	// Auto-deduct inventory if BOM is defined (MRP reservation)
	bomList, _ := s.bomRepo.FindByProductID(dto.ProductID)
	for _, bom := range bomList {
		requiredGrossQty := float64(dto.TotalTargetQty) * bom.Quantity * (1.0 + (bom.WastePct / 100.0))
		_ = s.matRepo.AdjustStock(bom.MaterialID, -requiredGrossQty)
	}

	createdWO, _ := s.woRepo.FindByID(wo.ID)
	s.auditServ.RecordLog(&actorID, "create_spk", fmt.Sprintf("Menerbitkan SPK Baru: %s untuk %s (Target: %d pcs)", spkNumber, product.ProductName, dto.TotalTargetQty))

	return createdWO, nil
}

func (s *productionService) ListSPK(status, priority, search string, page, limit int) ([]models.WorkOrder, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.woRepo.FindAll(status, priority, search, limit, offset)
}

func (s *productionService) GetSPKByID(id uint64) (*models.WorkOrder, error) {
	return s.woRepo.FindByID(id)
}

func (s *productionService) AssignStationWorker(actorID, wosID uint64, dto UpdateStationWorkerDTO) (*models.WorkOrderStation, error) {
	wos, err := s.woRepo.FindStationByID(wosID)
	if err != nil {
		return nil, errors.New("stasiun kerja SPK tidak ditemukan")
	}

	// Validate external restriction on Stasiun 4 & 5
	if dto.AssignedType == models.AssignedTypeMitra && !wos.Station.IsExternalAllowed {
		return nil, errors.New("stasiun 4 (Pasca Finishing) dan Stasiun 5 (Packing) WAJIB dikerjakan In-House di pabrik utama")
	}

	wos.AssignedType = dto.AssignedType
	wos.AssignedUserID = dto.AssignedUserID

	if err := s.woRepo.UpdateStation(wos); err != nil {
		return nil, err
	}

	s.auditServ.RecordLog(&actorID, "assign_spk_station", fmt.Sprintf("Mengubah penugasan stasiun %s (SPK Station ID %d)", wos.Station.Name, wos.ID))
	return wos, nil
}

func (s *productionService) ReportStationProgress(actorID, wosID uint64, dto ReportProgressDTO) (*models.WorkOrderStation, error) {
	wos, err := s.woRepo.FindStationByID(wosID)
	if err != nil {
		return nil, errors.New("stasiun kerja SPK tidak ditemukan")
	}

	wos.CompletedQty += dto.ReportedQtyPass
	wos.RejectQty += dto.ReportedQtyRej

	if wos.CompletedQty+wos.RejectQty >= wos.InputQty && wos.InputQty > 0 {
		wos.Status = models.StationStatusCompleted
	} else if dto.LogType == "start" {
		wos.Status = models.StationStatusInProgress
	}

	if err := s.woRepo.UpdateStation(wos); err != nil {
		return nil, err
	}

	// Create Production Log
	channel := dto.Channel
	if channel == "" {
		channel = "web"
	}
	pLog := &models.ProductionLog{
		WorkOrderStationID: wos.ID,
		UserID:             actorID,
		Channel:            channel,
		LogType:            dto.LogType,
		ReportedQtyPass:    dto.ReportedQtyPass,
		ReportedQtyReject:  dto.ReportedQtyRej,
		Notes:              dto.Notes,
	}
	_ = s.woRepo.CreateProductionLog(pLog)

	s.auditServ.RecordLog(&actorID, "report_spk_progress", fmt.Sprintf("Laporan progres stasiun %s: Selesai +%d, Cacat +%d", wos.Station.Name, dto.ReportedQtyPass, dto.ReportedQtyRej))
	return wos, nil
}

// ---------------- Mitra Assignments ----------------
func (s *productionService) ListMitraAssignments(mitraID uint64) ([]models.MitraProductStationAssignment, error) {
	return s.mitraRepo.FindAll(mitraID)
}

func (s *productionService) SaveMitraAssignment(actorID uint64, dto SaveMitraAssignmentDTO) (*models.MitraProductStationAssignment, error) {
	if dto.MitraUserID == 0 || dto.ProductID == 0 || dto.StationID == 0 {
		return nil, errors.New("mitra, produk, dan stasiun wajib diisi")
	}

	st, err := s.stationRepo.FindByID(dto.StationID)
	if err != nil || !st.IsExternalAllowed {
		return nil, errors.New("mitra hanya dapat ditugaskan pada Stasiun 1 s.d. 3")
	}

	existing, _ := s.mitraRepo.FindByMitraProductStation(dto.MitraUserID, dto.ProductID, dto.StationID)
	if existing != nil && existing.ID > 0 {
		existing.PieceRateFee = dto.PieceRateFee
		existing.DailyCapacityEstimate = dto.DailyCapacityEstimate
		existing.Notes = dto.Notes
		if err := s.mitraRepo.Update(existing); err != nil {
			return nil, err
		}
		s.auditServ.RecordLog(&actorID, "update_mitra_assignment", fmt.Sprintf("Memperbarui spesialisasi penugasan mitra ID %d untuk produk ID %d di stasiun %s", dto.MitraUserID, dto.ProductID, st.Name))
		return existing, nil
	}

	assign := &models.MitraProductStationAssignment{
		MitraUserID:           dto.MitraUserID,
		ProductID:             dto.ProductID,
		StationID:             dto.StationID,
		PieceRateFee:          dto.PieceRateFee,
		DailyCapacityEstimate: dto.DailyCapacityEstimate,
		IsPrimary:             true,
		Notes:                 dto.Notes,
	}

	if err := s.mitraRepo.Create(assign); err != nil {
		return nil, err
	}

	created, _ := s.mitraRepo.FindByID(assign.ID)
	s.auditServ.RecordLog(&actorID, "create_mitra_assignment", fmt.Sprintf("Mendaftarkan penugasan spesialisasi mitra: %s untuk produk %s di %s (Tarif: Rp %.2f)", created.MitraUser.Name, created.Product.ProductName, st.Name, dto.PieceRateFee))
	return created, nil
}

func (s *productionService) DeleteMitraAssignment(actorID, id uint64) error {
	s.auditServ.RecordLog(&actorID, "delete_mitra_assignment", fmt.Sprintf("Menghapus penugasan spesialisasi mitra assignment ID %d", id))
	return s.mitraRepo.Delete(id)
}

// ---------------- QC Inspection ----------------
func (s *productionService) SubmitQCInspection(inspectorID uint64, dto SubmitQCInspectionDTO) (*models.QCLog, error) {
	if dto.WorkOrderStationID == 0 {
		return nil, errors.New("work order station wajib disertakan")
	}

	totalReject := dto.RejectMinorQty + dto.RejectMajorQty + dto.RejectScrapQty

	actionTaken := models.QCActionAccept
	if dto.RejectScrapQty > 0 || dto.RejectMajorQty > 0 {
		actionTaken = models.QCActionReworkMitra
	}

	qcLog := &models.QCLog{
		WorkOrderStationID: dto.WorkOrderStationID,
		InspectorUserID:    inspectorID,
		InspectionModel:    dto.InspectionModel,
		SampleQty:          dto.SampleQty,
		PassQty:            dto.PassQty,
		RejectQty:          totalReject,
		RejectMinorQty:     dto.RejectMinorQty,
		RejectMajorQty:     dto.RejectMajorQty,
		RejectScrapQty:     dto.RejectScrapQty,
		DefectCategories:   dto.DefectCategories,
		ActionTaken:        actionTaken,
		Notes:              dto.Notes,
	}

	if err := s.qcRepo.CreateQCLog(qcLog); err != nil {
		return nil, err
	}

	// Update station numbers
	wos, err := s.woRepo.FindStationByID(dto.WorkOrderStationID)
	if err == nil {
		wos.CompletedQty += dto.PassQty
		wos.RejectQty += totalReject
		wos.ReworkQty += dto.RejectMinorQty + dto.RejectMajorQty
		_ = s.woRepo.UpdateStation(wos)
	}

	s.auditServ.RecordLog(&inspectorID, "qc_inspection_submitted", fmt.Sprintf("Inspeksi QC Stasiun %d: Lolos %d, Cacat %d (Minor: %d, Major: %d, Scrap: %d)", dto.WorkOrderStationID, dto.PassQty, totalReject, dto.RejectMinorQty, dto.RejectMajorQty, dto.RejectScrapQty))
	return qcLog, nil
}

func (s *productionService) ListRecentQCLogs(limit int) ([]models.QCLog, error) {
	if limit <= 0 {
		limit = 20
	}
	return s.qcRepo.FindRecentLogs(limit)
}

// ---------------- Logistics ----------------
func (s *productionService) CreateShipment(actorID uint64, dto CreateShipmentDTO) (*models.MitraShipment, error) {
	if dto.VehicleGateStatus == "" || dto.ProductAction == "" || dto.DriverName == "" {
		return nil, errors.New("status gerbang, aksi produk, dan nama supir wajib diisi")
	}

	now := time.Now()
	sjNumber := fmt.Sprintf("SJ-%s-%04d-%02d-%04d", dto.ProductAction, now.Year(), int(now.Month()), (now.Unix()%9000)+1000)

	movementDate := dto.MovementDate
	if movementDate == "" {
		movementDate = now.Format("2006-01-02")
	}
	movementTime := dto.MovementTime
	if movementTime == "" {
		movementTime = now.Format("15:04")
	}

	shipment := &models.MitraShipment{
		SJNumber:          sjNumber,
		VehicleGateStatus: dto.VehicleGateStatus,
		ProductAction:     dto.ProductAction,
		MovementDate:      movementDate,
		MovementTime:      movementTime,
		DriverName:        dto.DriverName,
		HelperName:        dto.HelperName,
		QCInspectorName:   dto.QCInspectorName,
		VehicleType:       dto.VehicleType,
		LicensePlate:      dto.LicensePlate,
		MitraID:           dto.MitraID,
		Notes:             dto.Notes,
	}

	items := make([]models.MitraShipmentItem, 0, len(dto.Items))
	for _, it := range dto.Items {
		items = append(items, models.MitraShipmentItem{
			ProductID:      it.ProductID,
			RawItemName:    it.RawItemName,
			Qty:            it.Qty,
			StatusCategory: it.StatusCategory,
			Notes:          it.Notes,
		})
	}
	shipment.Items = items

	if err := s.logistRepo.Create(shipment); err != nil {
		return nil, err
	}

	created, _ := s.logistRepo.FindByID(shipment.ID)
	s.auditServ.RecordLog(&actorID, "create_shipment", fmt.Sprintf("Menerbitkan Manifest Logistik: %s (Kendaraan: %s, Aksi Produk: %s, Supir: %s)", sjNumber, dto.VehicleGateStatus, dto.ProductAction, dto.DriverName))
	return created, nil
}

func (s *productionService) ListShipments(page, limit int) ([]models.MitraShipment, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit
	return s.logistRepo.FindAll(limit, offset)
}
