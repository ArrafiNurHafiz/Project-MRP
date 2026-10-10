package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"github.com/kayukwas/tracking-backend/config"
	"github.com/kayukwas/tracking-backend/internal/agent"
	"github.com/kayukwas/tracking-backend/internal/database"
	"github.com/kayukwas/tracking-backend/internal/handler"
	"github.com/kayukwas/tracking-backend/internal/middleware"
	"github.com/kayukwas/tracking-backend/internal/models"
	"github.com/kayukwas/tracking-backend/internal/repository"
	"github.com/kayukwas/tracking-backend/internal/service"
)

func main() {
	// 1. Load Config
	cfg := config.LoadConfig()

	// 2. Init Database
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// 3. Init Repositories
	userRepo := repository.NewUserRepository(db)
	roleRepo := repository.NewRoleRepository(db)
	auditRepo := repository.NewAuditLogRepository(db)
	waResetRepo := repository.NewWaResetRepository(db)

	prodRepo := repository.NewProductRepository(db)
	matRepo := repository.NewMaterialRepository(db)
	bomRepo := repository.NewBOMRepository(db)
	stationRepo := repository.NewWorkStationRepository(db)
	woRepo := repository.NewWorkOrderRepository(db)
	mitraRepo := repository.NewMitraAssignmentRepository(db)
	qcRepo := repository.NewQCRepository(db)
	logistRepo := repository.NewLogisticsRepository(db)

	custRepo := repository.NewCustomerRepository(db)
	vendRepo := repository.NewVendorRepository(db)
	quoteRepo := repository.NewQuotationRepository(db)
	soRepo := repository.NewSalesOrderRepository(db)
	mrRepo := repository.NewMaterialRequestRepository(db)
	poRepo := repository.NewPurchaseOrderRepository(db)
	invRepo := repository.NewInvoiceRepository(db)

	rfqRepo := repository.NewRFQRepository(db)
	cprRepo := repository.NewCPRRepository(db)
	currRepo := repository.NewCurrencyRepository(db)
	compRepo := repository.NewCompanySettingRepository(db)
	indRepo := repository.NewIndustrialMRPRepository(db)
	tenantRepo := repository.NewTenantRepository(db)
	extEntRepo := repository.NewEnterpriseExtensionsRepository(db)
	asianRepo := repository.NewAsianMRPExtensionsRepository(db)
	whRepo := repository.NewWarehouseRepository(db)
	grRepo := repository.NewGoodsReceiptRepository(db)
	doRepo := repository.NewDeliveryOrderRepository(db)

	// 4. Init Services
	services := service.NewAppServices(cfg, userRepo, roleRepo, auditRepo, waResetRepo)
	importService := service.NewImportService(custRepo, vendRepo, matRepo, prodRepo, bomRepo, stationRepo, mitraRepo, services)
	indService := service.NewIndustrialMRPService(indRepo, matRepo, services)
	tenantService := service.NewTenantSaaSService(tenantRepo, userRepo, roleRepo, services)
	extEntService := service.NewEnterpriseExtensionsService(extEntRepo, bomRepo, matRepo, prodRepo, services)
	asianService := service.NewAsianMRPExtensionsService(asianRepo, poRepo, matRepo, services)
	prodService := service.NewProductionService(prodRepo, matRepo, bomRepo, stationRepo, woRepo, mitraRepo, qcRepo, logistRepo, services)
	mrpService := service.NewMRPService(custRepo, vendRepo, quoteRepo, soRepo, mrRepo, poRepo, invRepo, prodRepo, matRepo, bomRepo, woRepo, stationRepo, indRepo, services)
	extMRPService := service.NewExtendedMRPService(rfqRepo, cprRepo, currRepo, compRepo, quoteRepo, soRepo, woRepo, mrRepo, prodRepo, matRepo, bomRepo, stationRepo, custRepo, invRepo, services)
	whService := service.NewWarehouseService(whRepo, services)
	fulfillmentService := service.NewFulfillmentService(grRepo, doRepo, poRepo, soRepo, woRepo, matRepo, prodRepo, bomRepo, whRepo, indRepo, services)

	// 5. Init LLM & OpenWA Clients
	llmKey := cfg.GeminiAPIKey
	if cfg.AIProvider == "openai" {
		llmKey = cfg.OpenAIAPIKey
	}
	llmClient := agent.NewLLMClient(agent.LLMConfig{
		Provider: cfg.AIProvider,
		APIKey:   llmKey,
		Model:    cfg.AIModel,
	})
	openwaClient := agent.NewOpenWAClient(agent.OpenWAConfig{
		BaseURL:       cfg.OpenWAURL,
		SessionID:     cfg.OpenWASessionID,
		APIKey:        cfg.OpenWAAPIKey,
		WebhookSecret: cfg.OpenWASecret,
	})

	// Inject Real WhatsApp Notifier for cold bonding OTP
	services.SetWANotifier(openwaClient)

	// 6. Init Handlers
	handlers := handler.NewHandlers(services, services, services, services, services)
	importHandlers := handler.NewImportHandlers(importService)
	indHandlers := handler.NewIndustrialMRPHandlers(indService)
	tenantHandlers := handler.NewTenantSaaSHandlers(tenantService)
	extEntHandlers := handler.NewEnterpriseExtensionsHandlers(extEntService)
	asianHandlers := handler.NewAsianMRPExtensionsHandlers(asianService)
	prodHandlers := handler.NewProductionHandlers(prodService)
	mrpHandlers := handler.NewMRPHandlers(mrpService)
	extMRPHandlers := handler.NewMRPExtendedHandlers(extMRPService)
	whHandlers := handler.NewWarehouseHandlers(whService)
	fulfillmentHandlers := handler.NewFulfillmentHandler(fulfillmentService)
	agentHandlers := handler.NewAgentHandlers(db, prodService, llmClient, openwaClient)
	openwaHandler := handler.NewOpenWAWebhookHandler(agent.NewAgentEngine(db, llmClient, openwaClient), openwaClient)

	// 7. Setup Fiber App
	app := fiber.New(fiber.Config{
		AppName: "EMTKu Tracking System v2 - Modular MRP Edition",
	})

	// Global Middlewares
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "*",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-OpenWA-Signature, X-OpenWA-Event, X-OpenWA-Idempotency-Key",
		AllowMethods:     "GET, POST, HEAD, PUT, DELETE, PATCH, OPTIONS",
		AllowCredentials: false,
	}))

	// Health Check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"system":  "EMTKu Tracking API (MRP Multi-Tenant Edition)",
			"version": "2.2.0",
		})
	})

	// API v1 Router
	api := app.Group("/api/v1")

	// Public Auth & Activation Endpoints
	authGroup := api.Group("/auth")
	authGroup.Post("/login", handlers.Login)

	activationGroup := api.Group("/activation")
	activationGroup.Post("/request", handlers.RequestActivation)
	activationGroup.Get("/verify", handlers.VerifyMagicLink)
	activationGroup.Post("/set-password", handlers.VerifyOtpAndSetPassword)

	// Public Customer Portal / Microsite Endpoints (No Login Required, Secured by UUID Token)
	publicPortal := api.Group("/public/quotes")
	publicPortal.Get("/:token", mrpHandlers.GetPublicQuotation)
	publicPortal.Post("/:token/approve", mrpHandlers.PublicCustomerApprove)
	publicPortal.Post("/:token/revise", mrpHandlers.PublicCustomerRevise)

	// Protected Endpoints
	authMiddleware := middleware.AuthMiddleware(cfg.JWTSecret)

	// User Profile
	authGroup.Get("/me", authMiddleware, handlers.GetProfile)

	// User Management (Requires 'kelola pengguna')
	userGroup := api.Group("/users", authMiddleware)
	userGroup.Get("/", middleware.RequirePermission(models.PermManageUsers), handlers.ListUsers)
	userGroup.Post("/", middleware.RequirePermission(models.PermManageUsers), handlers.CreateUser)
	userGroup.Get("/:id", middleware.RequirePermission(models.PermManageUsers), handlers.GetUserByID)
	userGroup.Put("/:id", middleware.RequirePermission(models.PermManageUsers), handlers.UpdateUser)
	userGroup.Patch("/:id/toggle-active", middleware.RequirePermission(models.PermManageUsers), handlers.ToggleUserActive)

	// Role & Permission Management
	roleGroup := api.Group("/roles", authMiddleware)
	roleGroup.Get("/", handlers.ListRoles)
	roleGroup.Post("/", middleware.RequirePermission(models.PermManageRoles), handlers.CreateRole)
	roleGroup.Get("/:id", handlers.GetRoleByID)
	roleGroup.Put("/:id/permissions", middleware.RequirePermission(models.PermManagePermissions), handlers.UpdateRolePermissions)
	roleGroup.Delete("/:id", middleware.RequirePermission(models.PermManageRoles), handlers.DeleteRole)

	// Permissions List
	api.Get("/permissions", authMiddleware, handlers.ListPermissions)

	// Audit Logs (Requires 'lihat catatan aktivitas')
	api.Get("/audit-logs", authMiddleware, middleware.RequirePermission(models.PermViewAuditLog), handlers.ListAuditLogs)

	// ----------------- Production & MRP Endpoints -----------------
	// Products
	productGroup := api.Group("/products", authMiddleware)
	productGroup.Get("/", prodHandlers.ListProducts)
	productGroup.Post("/", middleware.RequirePermission(models.PermManageWorkOrders), prodHandlers.CreateProduct)
	productGroup.Get("/:product_id/bom", prodHandlers.GetProductBOM)
	productGroup.Post("/:product_id/bom", middleware.RequirePermission(models.PermManageWorkOrders), prodHandlers.SaveProductBOM)
	productGroup.Delete("/bom/:id", middleware.RequirePermission(models.PermManageWorkOrders), prodHandlers.DeleteProductBOM)
	productGroup.Get("/:product_id/hpp-calc", prodHandlers.CalculateProductHPP)

	// Materials & Inventory
	materialGroup := api.Group("/materials", authMiddleware)
	materialGroup.Get("/", prodHandlers.ListMaterials)
	materialGroup.Post("/", middleware.RequirePermission(models.PermManageWorkOrders), prodHandlers.CreateMaterial)
	materialGroup.Patch("/:id/adjust-stock", middleware.RequirePermission(models.PermManageWorkOrders), prodHandlers.AdjustMaterialStock)

	// Financials & Mitra Payroll Summary
	api.Get("/finance/mitra-payroll", authMiddleware, prodHandlers.GetMitraPayrollSummary)

	// Work Stations
	api.Get("/stations", authMiddleware, prodHandlers.ListStations)

	// SPK / Work Orders
	spkGroup := api.Group("/spk", authMiddleware)
	spkGroup.Get("/", prodHandlers.ListSPK)
	spkGroup.Post("/", middleware.RequirePermission(models.PermManageWorkOrders), prodHandlers.CreateSPK)
	spkGroup.Get("/:id", prodHandlers.GetSPKByID)
	spkGroup.Put("/stations/:wos_id/assign", middleware.RequirePermission(models.PermManageWorkOrders), prodHandlers.AssignStationWorker)
	spkGroup.Post("/stations/:wos_id/progress", prodHandlers.ReportStationProgress)

	// Mitra Specialization Assignments
	mitraGroup := api.Group("/mitra-assignments", authMiddleware)
	mitraGroup.Get("/", prodHandlers.ListMitraAssignments)
	mitraGroup.Post("/", middleware.RequirePermission(models.PermManageWorkOrders), prodHandlers.SaveMitraAssignment)
	mitraGroup.Delete("/:id", middleware.RequirePermission(models.PermManageWorkOrders), prodHandlers.DeleteMitraAssignment)

	// QC Inspection
	qcGroup := api.Group("/qc", authMiddleware)
	qcGroup.Post("/inspect", middleware.RequirePermission(models.PermInputQCInspection), prodHandlers.SubmitQCInspection)
	qcGroup.Get("/recent", prodHandlers.ListRecentQCLogs)
	qcGroup.Get("/logs", prodHandlers.ListRecentQCLogs)

	// Logistics Manifests
	logisticsGroup := api.Group("/logistics", authMiddleware)
	logisticsGroup.Get("/", prodHandlers.ListShipments)
	logisticsGroup.Get("/shipments", prodHandlers.ListShipments)
	logisticsGroup.Post("/", middleware.RequirePermission(models.PermManageLogistics), prodHandlers.CreateShipment)
	logisticsGroup.Post("/shipments", middleware.RequirePermission(models.PermManageLogistics), prodHandlers.CreateShipment)

	// ----------------- Labamu MRP Core Endpoints -----------------
	// Customers
	custGroup := api.Group("/customers", authMiddleware)
	custGroup.Get("/", mrpHandlers.ListCustomers)
	custGroup.Post("/", mrpHandlers.CreateCustomer)
	custGroup.Get("/:id", mrpHandlers.GetCustomerByID)
	custGroup.Put("/:id", mrpHandlers.UpdateCustomer)
	custGroup.Delete("/:id", mrpHandlers.DeleteCustomer)

	// Vendors
	vendGroup := api.Group("/vendors", authMiddleware)
	vendGroup.Get("/", mrpHandlers.ListVendors)
	vendGroup.Post("/", mrpHandlers.CreateVendor)

	// Penawaran (Quotes)
	quoteGroup := api.Group("/quotes", authMiddleware)
	quoteGroup.Get("/", mrpHandlers.ListQuotations)
	quoteGroup.Post("/", mrpHandlers.CreateQuotation)
	quoteGroup.Get("/:id", mrpHandlers.GetQuotationByID)
	quoteGroup.Patch("/:id/approve", mrpHandlers.ApproveQuotation) // ACC Penawaran
	quoteGroup.Patch("/:id/reject", mrpHandlers.RejectQuotation)
	quoteGroup.Post("/:id/convert-to-order", mrpHandlers.ConvertToSalesOrder) // Konversi ke Pesanan

	// Pesanan (Orders)
	orderGroup := api.Group("/orders", authMiddleware)
	orderGroup.Get("/", mrpHandlers.ListSalesOrders)
	orderGroup.Post("/", mrpHandlers.CreateSalesOrder)
	orderGroup.Get("/:id", mrpHandlers.GetSalesOrderByID)
	orderGroup.Patch("/:id/publish", mrpHandlers.PublishSalesOrder) // Terbitkan Pesanan & Buat SPK

	// Work Orders MRP Extension (Klik detail -> Siap Proses -> Terbit SPK & Permintaan Material Gudang)
	api.Post("/work-orders/:id/process", authMiddleware, mrpHandlers.ProcessWorkOrder)
	api.Post("/work-orders/:id/auto-allocate", authMiddleware, mrpHandlers.AutoAllocateFIFOBatches)
	api.Post("/work-orders/:id/create-shortage-po", authMiddleware, mrpHandlers.CreatePOFromMaterialShortage)

	// Permintaan Material Gudang (Material Requests)
	mrGroup := api.Group("/material-requests", authMiddleware)
	mrGroup.Get("/", mrpHandlers.ListMaterialRequests)
	mrGroup.Get("/:id", mrpHandlers.GetMaterialRequestByID)
	mrGroup.Patch("/:id/check-stock", mrpHandlers.CheckMaterialAvailability) // Gudang cek ketersediaan
	mrGroup.Patch("/:id/allocate-issue", mrpHandlers.AllocateAndIssueMaterials) // Gudang ambil & alokasikan barang

	// Purchase Orders (Pengadaan)
	poGroup := api.Group("/purchase-orders", authMiddleware)
	poGroup.Get("/", mrpHandlers.ListPurchaseOrders)
	poGroup.Post("/", mrpHandlers.CreatePurchaseOrder)
	poGroup.Patch("/:id/receive", mrpHandlers.ReceivePurchaseOrder)

	// Invoices (Faktur)
	invGroup := api.Group("/invoices", authMiddleware)
	invGroup.Get("/", mrpHandlers.ListInvoices)
	invGroup.Post("/", mrpHandlers.CreateInvoice)
	invGroup.Patch("/:id/pay", mrpHandlers.MarkInvoicePaid)

	// ----------------- Extended Labamu MRP Enterprise Endpoints -----------------
	// CPR (Custom Product Requests)
	cprGroup := api.Group("/cpr", authMiddleware)
	cprGroup.Get("/", extMRPHandlers.ListCPRs)
	cprGroup.Post("/", extMRPHandlers.CreateCPR)
	cprGroup.Get("/:id", extMRPHandlers.GetCPRByID)
	cprGroup.Put("/:id", extMRPHandlers.UpdateCPR)
	cprGroup.Patch("/:id/approve", extMRPHandlers.ApproveCPR)
	cprGroup.Patch("/:id/reject", extMRPHandlers.RejectCPR)
	cprGroup.Post("/:id/convert-to-quote", extMRPHandlers.ConvertCPRToQuotation)

	// RFQ
	rfqGroup := api.Group("/rfq", authMiddleware)
	rfqGroup.Get("/", extMRPHandlers.ListRFQs)
	rfqGroup.Post("/", extMRPHandlers.CreateRFQ)
	rfqGroup.Get("/:id", extMRPHandlers.GetRFQByID)
	rfqGroup.Patch("/:id/approve", extMRPHandlers.ApproveRFQ)
	rfqGroup.Post("/:id/convert-to-quote", extMRPHandlers.ConvertToQuotation)

	// Order Simulation Engine (MPS / CRP)
	api.Post("/order-simulation/calculate", authMiddleware, extMRPHandlers.SimulateOrder)

	// Foreign Exchange (FX) Currencies
	currGroup := api.Group("/fx-currencies", authMiddleware)
	currGroup.Get("/", extMRPHandlers.ListCurrencies)
	currGroup.Patch("/:code", extMRPHandlers.UpdateCurrencyRate)

	// Company Settings
	api.Get("/company-settings", authMiddleware, extMRPHandlers.GetCompanySetting)
	api.Put("/company-settings", authMiddleware, extMRPHandlers.UpdateCompanySetting)

	// Reports / Analytics
	reportGroup := api.Group("/reports", authMiddleware)
	reportGroup.Get("/financial", extMRPHandlers.GetFinancialReport)
	reportGroup.Get("/inventory", extMRPHandlers.GetInventoryReport)
	reportGroup.Get("/sales-funnel", extMRPHandlers.GetSalesFunnelReport)

	// ----------------- Import Data Templates & Bulk Upload -----------------
	importGroup := api.Group("/import", authMiddleware)
	importGroup.Get("/template/:module", importHandlers.DownloadTemplate)
	importGroup.Post("/:module", importHandlers.ImportCSV)

	// ----------------- Industrial Shop-floor Endpoints (Downtime, Rework, Lots) -----------------
	indGroup := api.Group("/industrial", authMiddleware)
	indGroup.Get("/downtimes", indHandlers.ListDowntimes)
	indGroup.Post("/downtimes", indHandlers.ReportDowntime)
	indGroup.Patch("/downtimes/:id/resolve", indHandlers.ResolveDowntime)

	indGroup.Get("/reworks", indHandlers.ListReworkOrders)
	indGroup.Post("/reworks", indHandlers.CreateReworkOrder)
	indGroup.Patch("/reworks/:id/progress", indHandlers.UpdateReworkProgress)

	indGroup.Get("/batches", indHandlers.ListBatchLots)
	indGroup.Post("/batches", indHandlers.RegisterBatchLot)

	// ----------------- Multi-Company SaaS & Subscription Management -----------------
	saasGroup := api.Group("/saas")
	saasGroup.Get("/plans", tenantHandlers.GetPricingPlans) // Public
	saasGroup.Get("/overview", authMiddleware, tenantHandlers.GetSaaSOverview)
	saasGroup.Get("/tenants", authMiddleware, tenantHandlers.ListTenants)
	saasGroup.Post("/tenants", authMiddleware, tenantHandlers.CreateTenant)
	saasGroup.Get("/tenants/:id", authMiddleware, tenantHandlers.GetTenantByID)
	saasGroup.Patch("/tenants/:id/subscription", authMiddleware, tenantHandlers.UpdateSubscription)

	// ----------------- Global Enterprise MRP Extensions (ECO, Shopfloor, Mnt, Unbuild) -----------------
	enterpriseGroup := api.Group("/enterprise", authMiddleware)
	// ECO
	enterpriseGroup.Get("/ecos", extEntHandlers.ListECOs)
	enterpriseGroup.Get("/ecos/:id", extEntHandlers.GetECOByID)
	enterpriseGroup.Post("/ecos", extEntHandlers.CreateECO)
	enterpriseGroup.Patch("/ecos/:id/apply", extEntHandlers.ApproveAndApplyECO)

	// Shopfloor Kiosk
	enterpriseGroup.Get("/shopfloor/logs", extEntHandlers.ListShopFloorLogs)
	enterpriseGroup.Post("/shopfloor/clock-in", extEntHandlers.ClockInShopFloor)
	enterpriseGroup.Patch("/shopfloor/clock-out/:id", extEntHandlers.ClockOutShopFloor)

	// Maintenance
	enterpriseGroup.Get("/maintenance", extEntHandlers.ListMaintenanceTasks)
	enterpriseGroup.Post("/maintenance", extEntHandlers.CreateMaintenanceTask)
	enterpriseGroup.Patch("/maintenance/:id/complete", extEntHandlers.CompleteMaintenanceTask)

	// Unbuild Orders
	enterpriseGroup.Get("/unbuilds", extEntHandlers.ListUnbuildOrders)
	enterpriseGroup.Get("/unbuilds/:id", extEntHandlers.GetUnbuildByID)
	enterpriseGroup.Post("/unbuilds", extEntHandlers.CreateUnbuildOrder)
	enterpriseGroup.Patch("/unbuilds/:id/execute", extEntHandlers.ExecuteUnbuild)

	// ----------------- Asian Premier MRP Extensions (Landed Cost, Maklon Reconcile, Overhead) -----------------
	asianGroup := api.Group("/asian", authMiddleware)
	asianGroup.Get("/landed-costs", asianHandlers.ListLandedCosts)
	asianGroup.Get("/landed-costs/:id", asianHandlers.GetLandedCostByID)
	asianGroup.Post("/landed-costs", asianHandlers.CreateLandedCost)
	asianGroup.Patch("/landed-costs/:id/post", asianHandlers.PostLandedCost)

	asianGroup.Get("/subcontract-reconciles", asianHandlers.ListSubcontractReconciliations)
	asianGroup.Post("/subcontract-reconciles", asianHandlers.CreateSubcontractReconciliation)
	asianGroup.Patch("/subcontract-reconciles/:id/pay", asianHandlers.PaySubcontractReconciliation)

	asianGroup.Get("/overheads", asianHandlers.ListOverheadAbsorptions)
	asianGroup.Post("/overheads", asianHandlers.CalculateAndStoreOverhead)

	// ----------------- Multi-Warehouse & Inventory Movements -----------------
	whGroup := api.Group("/warehouses", authMiddleware)
	whGroup.Get("/", whHandlers.ListWarehouses)
	whGroup.Post("/", whHandlers.CreateWarehouse)
	whGroup.Get("/:id", whHandlers.GetWarehouseByID)
	whGroup.Put("/:id", whHandlers.UpdateWarehouse)
	whGroup.Delete("/:id", whHandlers.DeleteWarehouse)

	trfGroup := api.Group("/stock-transfers", authMiddleware)
	trfGroup.Get("/", whHandlers.ListStockTransfers)
	trfGroup.Post("/", whHandlers.CreateStockTransfer)
	trfGroup.Post("/:id/complete", whHandlers.CompleteStockTransfer)
	trfGroup.Post("/:id/cancel", whHandlers.CancelStockTransfer)

	adjGroup := api.Group("/stock-adjustments", authMiddleware)
	adjGroup.Get("/", whHandlers.ListStockAdjustments)
	adjGroup.Post("/", whHandlers.CreateStockAdjustment)
	adjGroup.Post("/:id/approve", whHandlers.ApproveStockAdjustment)

	// ----------------- Automated MRP Engine -----------------
	mrpEngineGroup := api.Group("/mrp", authMiddleware)
	mrpEngineGroup.Get("/net-requirements", mrpHandlers.GetMRPNetRequirements)
	mrpEngineGroup.Post("/generate-po-batch", mrpHandlers.BatchGeneratePOsFromMRP)

	// ----------------- Inbound Goods Receipt (GRN) -----------------
	grGroup := api.Group("/goods-receipts", authMiddleware)
	grGroup.Get("/", fulfillmentHandlers.ListGoodsReceipts)
	grGroup.Post("/", fulfillmentHandlers.CreateGoodsReceipt)
	grGroup.Get("/:id", fulfillmentHandlers.GetGoodsReceiptByID)
	grGroup.Patch("/:id/confirm", fulfillmentHandlers.ConfirmGoodsReceipt)

	// ----------------- Outbound Delivery Orders (Surat Jalan Pelanggan) -----------------
	doGroup := api.Group("/delivery-orders", authMiddleware)
	doGroup.Get("/", fulfillmentHandlers.ListDeliveryOrders)
	doGroup.Post("/", fulfillmentHandlers.CreateDeliveryOrder)
	doGroup.Get("/:id", fulfillmentHandlers.GetDeliveryOrderByID)
	doGroup.Patch("/:id/ship", fulfillmentHandlers.ShipDeliveryOrder)
	doGroup.Patch("/:id/deliver", fulfillmentHandlers.DeliverDeliveryOrder)

	// ----------------- MTS Check, FG Put-Away & Cost Variance -----------------
	api.Get("/orders/:id/mts-check", authMiddleware, fulfillmentHandlers.CheckMTSAvailability)
	api.Post("/work-orders/:id/put-away", authMiddleware, fulfillmentHandlers.PutAwayFinishedGoods)
	api.Get("/work-orders/:id/cost-variance", authMiddleware, fulfillmentHandlers.CalculateJobCostVariance)

	// ----------------- Agentic AI Endpoints -----------------
	agentGroup := api.Group("/agent")
	agentGroup.Get("/config", agentHandlers.GetAgentConfig)
	agentGroup.Post("/config", authMiddleware, agentHandlers.UpdateAgentConfig)
	agentGroup.Post("/parse", agentHandlers.ParseMessage)
	agentGroup.Post("/commit", authMiddleware, agentHandlers.CommitAction)
	agentGroup.Get("/presets", agentHandlers.GetPresets)

	// ----------------- OpenWA Real WhatsApp Webhook -----------------
	webhookGroup := api.Group("/webhook")
	webhookGroup.Post("/openwa", middleware.OpenWASignatureMiddleware(cfg.OpenWASecret), openwaHandler.HandleWebhook)
	webhookGroup.Get("/openwa/status", openwaHandler.GetOpenWAStatus)

	// Start Server
	log.Printf("[Server] Starting Kayu KWAS Tracking & MRP API on port %s...\n", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
