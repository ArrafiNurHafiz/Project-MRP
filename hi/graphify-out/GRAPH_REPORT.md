# Graph Report - hi  (2026-09-27)

## Corpus Check
- Large corpus: 317 files · ~718,195 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1259 nodes · 3445 edges · 105 communities (59 shown, 46 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- RBAC & Access Control
- RBAC & Access Control
- RBAC & Access Control
- Authentication & OTP Verification
- RBAC & Access Control
- FX & Currency Management
- Frontend Dependencies & Framework
- RBAC & Access Control
- RBAC & Access Control
- Commercial Quotes & Sales Pipeline
- RBAC & Access Control
- Authentication & OTP Verification
- Authentication & OTP Verification
- FX & Currency Management
- Inventory & Warehouse Management
- RBAC & Access Control
- QCLog Domain
- RBAC & Access Control
- Authentication & OTP Verification
- FX & Currency Management
- Commercial Quotes & Sales Pipeline
- RBAC & Access Control
- Configuration & Database Initialization
- Industrial Operations & Batch Control
- Inventory & Warehouse Management
- Configuration & Database Initialization
- Core Backend Engine & Lexicon
- .parseLogisticsManifest Domain
- Enterprise MRP & Shop Floor
- Inventory & Warehouse Management
- FX & Currency Management
- RBAC & Access Control
- RBAC & Access Control
- Invoicing & Financial Settlement
- Configuration & Database Initialization
- Configuration & Database Initialization
- Authentication & OTP Verification
- Configuration & Database Initialization
- Inventory & Warehouse Management
- Commercial Quotes & Sales Pipeline
- Commercial Quotes & Sales Pipeline
- Configuration & Database Initialization
- Costing & Subcontracting
- Configuration & Database Initialization
- Configuration & Database Initialization
- HTTP Handlers & API Endpoints
- Industrial Operations & Batch Control
- RBAC & Access Control
- Authentication & OTP Verification
- Inventory & Warehouse Management
- HTTP Handlers & API Endpoints
- Authentication & OTP Verification
- Authentication & OTP Verification
- Community 53
- HTTP Handlers & API Endpoints
- Commercial Quotes & Sales Pipeline
- Inventory & Warehouse Management
- FX & Currency Management
- Frontend Views & UI Components
- Inventory & Warehouse Management
- Commercial Quotes & Sales Pipeline
- Commercial Quotes & Sales Pipeline
- Inventory & Warehouse Management
- Commercial Quotes & Sales Pipeline
- HTTP Handlers & API Endpoints
- Frontend Dependencies & Framework
- Inventory & Warehouse Management
- RBAC & Access Control
- Inventory & Warehouse Management
- Create Product Category Selection View Domain
- Create Product BOM and COGS Attached View Domain
- Product Catalog Management Workflow Domain
- Order Simulation Engine Concept Domain
- Configuration & Database Initialization
- Authentication & OTP Verification
- Create Product Form with Pricing View Domain
- Create Product BOM Selection Dialog View Domain
- Authentication & OTP Verification
- Order Simulation Date Picker View Domain
- Order Simulation Date Selected View Domain
- Order Simulation Product Selection View Domain
- Order Simulation Product Dropdown View Domain
- Order Simulation Item Added View Domain
- Authentication & OTP Verification
- Authentication & OTP Verification
- Authentication & OTP Verification
- Authentication & OTP Verification
- Authentication & OTP Verification
- Authentication & OTP Verification
- Authentication & OTP Verification
- Authentication & OTP Verification
- Frontend Claude Instructions Domain
- github.com/kayukwas/tracking-backend Domain
- Logout View Domain
- Authentication & OTP Verification
- 01 Login Page Domain
- Dashboard & Analytics
- Dashboard & Analytics
- Commercial Quotes & Sales Pipeline
- Invoicing & Financial Settlement
- 06 Purchase Orders List Domain
- Commercial Quotes & Sales Pipeline
- 08 Work Orders List Domain
- 09 Delivery Orders List Domain
- Invoicing & Financial Settlement

## God Nodes (most connected - your core abstractions)
1. `JSONError()` - 129 edges
2. `JSONSuccess()` - 127 edges
3. `apiFetch()` - 76 edges
4. `main()` - 55 edges
5. `MRPService` - 48 edges
6. `lucide-react` - 43 edges
7. `getStoredUser()` - 43 edges
8. `react` - 42 edges
9. `ProductionService` - 39 edges
10. `User` - 36 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `NewAgentEngine()`  [EXTRACTED]
  main.go → backend/internal/agent/engine.go
- `main()` --calls--> `NewLLMClient()`  [EXTRACTED]
  main.go → backend/internal/agent/llm_client.go
- `main()` --calls--> `NewOpenWAClient()`  [EXTRACTED]
  main.go → backend/internal/agent/openwa_client.go
- `main()` --calls--> `NewAgentHandlers()`  [EXTRACTED]
  main.go → backend/internal/handler/agent_handlers.go
- `main()` --calls--> `NewOpenWAWebhookHandler()`  [EXTRACTED]
  main.go → backend/internal/handler/openwa_handler.go

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Product and BOM Creation Flow** — _playwright_mcp_page_2026_09_25t07_49_04_858z_create_bom_view, _playwright_mcp_page_2026_09_25t07_49_04_858z_bom_formula_config, _playwright_mcp_page_2026_09_25t07_53_04_424z_create_product_complete_view, _playwright_mcp_page_2026_09_25t07_53_04_424z_product_bom_cogs_sync [INFERRED 0.85]
- **Order Simulation MRP Engine Execution Flow** — _playwright_mcp_page_2026_09_25t08_05_27_104z_order_simulation_initial_view, _playwright_mcp_page_2026_09_25t08_07_47_550z_order_simulation_results_view, _playwright_mcp_page_2026_09_25t08_07_47_550z_production_planning_summary, _playwright_mcp_page_2026_09_25t08_07_47_550z_material_forecast_summary, _playwright_mcp_page_2026_09_25t08_07_47_550z_cogs_forecast_summary [INFERRED 0.85]
- **Quote Lifecycle and Sales Flow** — _playwright_mcp_page_2026_09_26t01_26_45_089z_quotes_view, _playwright_mcp_page_2026_09_26t01_26_45_089z_quote_status_workflow, _playwright_mcp_page_2026_09_26t01_26_45_089z_quote_rfq_linkage [INFERRED 0.85]
- **MRP Commercial Sales and Billing Flow** — scraped_labamu_data_pages_customers_page, scraped_labamu_data_pages_invoices_page, concept_invoice_management [INFERRED 0.85]
- **Sales RFQ to Quotes and Materials Flow** — scraped_labamu_data_pages_rfq_create_form, scraped_labamu_data_pages_quotes_list_page, scraped_labamu_data_pages_products_catalog_page, scraped_labamu_data_pages_materials_page [INFERRED 0.85]
- **Order to Cash & Financial Settlement Workflow** — scraped_labamu_data_screenshots_invoices_data_table, scraped_labamu_data_screenshots_invoice_detail_payment_summary, scraped_labamu_data_screenshots_payment_gateways_integration_panel, scraped_labamu_data_screenshots_general_ledger_journal_entry_table [INFERRED 0.95]
- **Procure to Pay & Material Inventory Workflow** — scraped_labamu_data_screenshots_po_create_vendor_item_selector, scraped_labamu_data_screenshots_po_detail_receiving_status, scraped_labamu_data_screenshots_materials_inventory_table, scraped_labamu_data_screenshots_general_ledger_journal_entry_table [INFERRED 0.95]
- **Production Scheduling & Material Consumption Workflow** — scraped_labamu_data_screenshots_production_dashboard_work_order_metrics, scraped_labamu_data_screenshots_materials_inventory_table, scraped_labamu_data_screenshots_po_detail_receiving_status [INFERRED 0.85]
- **Labamu MRP Commercial and Procurement UI Flow** — scraped_labamu_data_screenshots_products_ui, scraped_labamu_data_screenshots_quotes_ui, scraped_labamu_data_screenshots_quote_detail_ui, scraped_labamu_data_screenshots_rfq_create_ui [INFERRED 0.85]
- **Work Order Execution and Material Allocation Lifecycle** — scraped_labamu_data_screenshots_work_order_detail_view, scraped_labamu_data_screenshots_work_order_detail_bom_allocation, scraped_labamu_data_screenshots_work_order_detail_routing_operations, scraped_labamu_data_screenshots_work_order_detail_status_workflow [EXTRACTED 1.00]
- **Vendor Master Data Management Interface** — scraped_labamu_data_screenshots_vendors_view, scraped_labamu_data_screenshots_vendors_table, scraped_labamu_data_screenshots_vendors_search_filter, scraped_labamu_data_screenshots_vendors_add_action [EXTRACTED 1.00]

## Communities (105 total, 46 thin omitted)

### Community 0 - "RBAC & Access Control"
Cohesion: 0.14
Nodes (44): Material, go_pkg_bytes, go_pkg_context, go_pkg_crypto_hmac, go_pkg_crypto_rand, go_pkg_crypto_sha256, go_pkg_encoding_csv, go_pkg_encoding_hex (+36 more)

### Community 1 - "RBAC & Access Control"
Cohesion: 0.08
Nodes (33): AktivasiContent(), AgentParserPage(), MachineDowntimesPage(), FXManagementPage(), MaintenancePage(), OverheadPage(), DashboardOverviewPage(), loadData() (+25 more)

### Community 2 - "RBAC & Access Control"
Cohesion: 0.06
Nodes (20): NewEnterpriseExtensionsHandlers(), EngineeringChangeOrder, MaintenanceTask, ShopFloorLog, UnbuildOrder, Product, User, WorkOrderStation (+12 more)

### Community 3 - "Authentication & OTP Verification"
Cohesion: 0.06
Nodes (37): BatchesPage(), ECOPage(), LandedCostsPage(), UnbuildsPage(), LoginPage(), ApiResponse, BOMCostDetail, CompanySetting (+29 more)

### Community 4 - "RBAC & Access Control"
Cohesion: 0.11
Nodes (39): main(), Config, LoadConfig(), InitDB(), SeedExtendedMRPData(), SeedProductionData(), SeedRBAC(), NewHandlers() (+31 more)

### Community 5 - "FX & Currency Management"
Cohesion: 0.08
Nodes (13): NewMRPExtendedHandlers(), CompanySetting, CurrencyFX, RFQ, CompanySettingRepository, CurrencyRepository, RFQRepository, ExtendedMRPService (+5 more)

### Community 6 - "Frontend Dependencies & Framework"
Cohesion: 0.06
Nodes (35): dependencies, clsx, lucide-react, next, react, react-dom, tailwind-merge, devDependencies (+27 more)

### Community 7 - "RBAC & Access Control"
Cohesion: 0.08
Nodes (17): NewIndustrialMRPHandlers(), Material, MachineDowntime, MaterialBatchLot, ReworkOrder, User, WorkOrder, WorkStation (+9 more)

### Community 8 - "RBAC & Access Control"
Cohesion: 0.09
Nodes (13): NewAsianMRPExtensionsHandlers(), LandedCost, OverheadAbsorption, SubcontractReconciliation, User, WorkOrder, AsianMRPExtensionsRepository, AsianMRPExtensionsService (+5 more)

### Community 10 - "RBAC & Access Control"
Cohesion: 0.11
Nodes (7): Permission, Role, RoleRepository, RoleService, Permission, CreateRoleDTO, SyncRolePermissionsDTO

### Community 11 - "Authentication & OTP Verification"
Cohesion: 0.23
Nodes (20): AuditLogsPage(), CostingPayrollPage(), DashboardLayout(), NavItem, LogisticsPage(), MaterialsPage(), MitraAssignmentsPage(), ProductsPage() (+12 more)

### Community 12 - "Authentication & OTP Verification"
Cohesion: 0.13
Nodes (11): WhatsAppActivationService, Generate6DigitOTP(), GenerateSecureToken(), HashPassword(), NormalizePhoneNumber(), AppServices, RequestActivationDTO, RequestActivationResponse (+3 more)

### Community 13 - "FX & Currency Management"
Cohesion: 0.08
Nodes (27): Base and Target Currency Controls, Currency Rate Form, Add/Edit Currency Rate Modal, FX Rate Data Table, FX Management Page, ERP Home Dashboard View, Dashboard Metric Cards, Dashboard Quick Action Buttons (+19 more)

### Community 14 - "Inventory & Warehouse Management"
Cohesion: 0.21
Nodes (3): fiber.Ctx, JSONSuccess(), ProductionHandlers

### Community 15 - "RBAC & Access Control"
Cohesion: 0.13
Nodes (7): AuditLog, User, UserRepository, UserService, Role, CreateUserDTO, UpdateUserDTO

### Community 16 - "QCLog Domain"
Cohesion: 0.10
Nodes (12): QCLog, QCRepository, ProductionService, NewProductionService(), BOMCostDetail, LaborCostDetail, MitraSPKPayout, MitraPayrollSummary (+4 more)

### Community 17 - "RBAC & Access Control"
Cohesion: 0.13
Nodes (8): NewTenantSaaSHandlers(), SaaSPlanInfo, Tenant, User, TenantRepository, TenantSaaSService, CreateTenantDTO, UpdateTenantSubscriptionDTO

### Community 18 - "Authentication & OTP Verification"
Cohesion: 0.25
Nodes (4): fiber.Ctx, fiber.Ctx, JSONError(), Handlers

### Community 19 - "FX & Currency Management"
Cohesion: 0.11
Nodes (20): Currency Exchange Rates Table, FX Management UI View, General Ledger Journal Entry Table, General Ledger UI View, Sales Invoice Form Builder, Invoice Creation UI View, Invoice Payment Status & Settlement Summary, Invoice Detail UI View (+12 more)

### Community 20 - "Commercial Quotes & Sales Pipeline"
Cohesion: 0.12
Nodes (11): nextConfig, CustomersPage(), OrderSimulationPage(), QuotesPage(), RFQPage(), Customer, OrderSimulationResult, Quotation (+3 more)

### Community 21 - "RBAC & Access Control"
Cohesion: 0.16
Nodes (12): InvoicesPage(), MaterialRequestsPage(), OrdersPage(), AccessDenied(), AccessDeniedProps, AuditLog, Invoice, MaterialRequest (+4 more)

### Community 22 - "Configuration & Database Initialization"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 23 - "Industrial Operations & Batch Control"
Cohesion: 0.20
Nodes (9): asyncio, main(), run_mrp_verification(), main(), run_comprehensive_suite(), main(), verify_all_mrp_routes(), playwright_async_api (+1 more)

### Community 24 - "Inventory & Warehouse Management"
Cohesion: 0.16
Nodes (7): NewMRPHandlers(), MaterialRequest, WorkOrder, MaterialRequestRepository, MRPService, MaterialRequestItem, ProcessWorkOrderDTO

### Community 25 - "Configuration & Database Initialization"
Cohesion: 0.14
Nodes (5): MitraProductStationAssignment, ProductBOM, BOMRepository, MitraAssignmentRepository, NewImportService()

### Community 26 - "Core Backend Engine & Lexicon"
Cohesion: 0.17
Nodes (6): LLMConfig, LLMClient, NewLLMClient(), formatToOpenWAID(), context.Context, net/http.Client

### Community 27 - ".parseLogisticsManifest Domain"
Cohesion: 0.20
Nodes (12): AgentParseRequest, AgentParseResponse, DefectMapping, OperationMapping, ReasoningStep, ToolCallRecord, ValidationChecks, extractPassAndRejectQuantities() (+4 more)

### Community 29 - "Inventory & Warehouse Management"
Cohesion: 0.24
Nodes (7): fiber.Ctx, NewImportHandlers(), getCol(), ImportService, io.Reader, ImportHandlers, ImportResult

### Community 31 - "RBAC & Access Control"
Cohesion: 0.16
Nodes (6): PurchaseOrder, User, PurchaseOrderRepository, NewAsianMRPExtensionsService(), PurchaseOrderItem, CreatePurchaseOrderDTO

### Community 32 - "RBAC & Access Control"
Cohesion: 0.16
Nodes (7): MitraShipment, ProductionLog, User, LogisticsRepository, MitraShipmentItem, CreateShipmentDTO, CreateShipmentItemDTO

### Community 33 - "Invoicing & Financial Settlement"
Cohesion: 0.16
Nodes (4): Invoice, InvoiceRepository, NewMRPService(), CreateInvoiceDTO

### Community 34 - "Configuration & Database Initialization"
Cohesion: 0.19
Nodes (3): Vendor, VendorRepository, CreateVendorDTO

### Community 35 - "Configuration & Database Initialization"
Cohesion: 0.16
Nodes (6): WorkOrderStation, WorkStation, WorkStationRepository, QCLog, ReportProgressDTO, UpdateStationWorkerDTO

### Community 36 - "Authentication & OTP Verification"
Cohesion: 0.20
Nodes (8): AuthService, CheckPasswordHash(), GenerateJWT(), time.Duration, LoginRequest, LoginResponse, RequestLoginOTPDTO, VerifyLoginOTPDTO

### Community 37 - "Configuration & Database Initialization"
Cohesion: 0.21
Nodes (5): Customer, CustomerPIC, CustomerRepository, CustomerPIC, CreateCustomerDTO

### Community 38 - "Inventory & Warehouse Management"
Cohesion: 0.21
Nodes (4): Material, MaterialRepository, AdjustStockDTO, CreateMaterialDTO

### Community 39 - "Commercial Quotes & Sales Pipeline"
Cohesion: 0.20
Nodes (12): Material, Product, Material, Product, time.Time, ECOItem, MaterialRequestItem, PurchaseOrderItem (+4 more)

### Community 40 - "Commercial Quotes & Sales Pipeline"
Cohesion: 0.21
Nodes (4): SalesOrder, SalesOrderRepository, SalesOrderItem, PublishSalesOrderDTO

### Community 41 - "Configuration & Database Initialization"
Cohesion: 0.21
Nodes (5): Product, ProductRepository, MitraShipmentItem, ProductBOM, CreateProductDTO

### Community 43 - "Configuration & Database Initialization"
Cohesion: 0.24
Nodes (3): Quotation, QuotationRepository, QuotationItem

### Community 44 - "Configuration & Database Initialization"
Cohesion: 0.25
Nodes (4): WorkOrder, WorkOrderStation, WorkOrderRepository, CreateSPKDTO

### Community 45 - "HTTP Handlers & API Endpoints"
Cohesion: 0.33
Nodes (7): OpenWAConfig, AgentEngine, NewAgentEngine(), OpenWAClient, NewOpenWAClient(), NewAgentHandlers(), NewOpenWAWebhookHandler()

### Community 47 - "RBAC & Access Control"
Cohesion: 0.22
Nodes (3): AuditLog, AuditLogService, NewTenantSaaSService()

### Community 48 - "Authentication & OTP Verification"
Cohesion: 0.28
Nodes (6): VendorsPage(), ImportDataModal(), ImportModalProps, API_BASE, getToken(), Vendor

### Community 49 - "Inventory & Warehouse Management"
Cohesion: 0.25
Nodes (9): Add Vendor Action Trigger, Vendor Search and Category Filter, Vendor Master Data Table, Vendor Management List View, BOM Material Allocation Table, Actual vs Standard Production Costing Summary, Work Center Production Routing Operations, Work Order Lifecycle Status Controls (+1 more)

### Community 51 - "Authentication & OTP Verification"
Cohesion: 0.25
Nodes (8): AuthMiddleware(), OpenWASignatureMiddleware(), RequirePermission(), RequireSuperuser(), ValidateJWT(), fiber.Handler, jwt.RegisteredClaims, JWTCustomClaims

### Community 53 - "Community 53"
Cohesion: 0.36
Nodes (8): Date and Status Filter Controls, Top Application Header, Dashboard Main View, Master Data Navigation Group, Operational Metrics KPI Cards, Manufacturing Operations Navigation Group, Sidebar Navigation Menu, Active Production Work Orders Table

### Community 55 - "Commercial Quotes & Sales Pipeline"
Cohesion: 0.33
Nodes (7): MRP Finished Goods Catalog System, Products Management UI, Quote Detail & Pricing UI, Quotes List UI, RFQ Creation Form UI, Request for Quotation Procurement Workflow, Sales Quotation and Pricing Workflow

### Community 56 - "Inventory & Warehouse Management"
Cohesion: 0.33
Nodes (5): OrderSimulationResult, MaterialDemandBreakdown, PORecommendation, SimulateOrderDTO, StationCapacityBreakdown

### Community 57 - "FX & Currency Management"
Cohesion: 0.33
Nodes (6): Customer Directory and PIC Management, Foreign Exchange and Base Currency Management, Sales Invoice and Payment Tracking, Customers Management Page, FX Management Page, Invoices Management Page

### Community 58 - "Frontend Views & UI Components"
Cohesion: 0.33
Nodes (4): frontend_src_app_globals, geistMono, geistSans, metadata

### Community 59 - "Inventory & Warehouse Management"
Cohesion: 0.33
Nodes (6): ABC Inventory Classification, Raw and Finished Material Types, Materials Inventory Page, Product Catalog Management Page, Standard Catalog & SKU Management, Vendors Directory Page

### Community 60 - "Commercial Quotes & Sales Pipeline"
Cohesion: 0.40
Nodes (5): Quote Detail & Status View, Quote Approval Lifecycle, Quotes Management List Page, Add New RFQ Form Page, RFQ Customer & PIC Specification

### Community 61 - "Commercial Quotes & Sales Pipeline"
Cohesion: 0.40
Nodes (3): CreateQuotationDTO, CreateQuotationItemDTO, CreateSalesOrderDTO

### Community 62 - "Inventory & Warehouse Management"
Cohesion: 0.83
Nodes (4): Forecasted COGS and Profitability Summary, Material Demand Forecast, Order Simulation Results Summary View, Production Planning Summary

### Community 63 - "Commercial Quotes & Sales Pipeline"
Cohesion: 0.67
Nodes (4): Quote RFQ Linkage, Quote Status Workflow, Quotes Management View, Sales Module Navigation

### Community 65 - "Frontend Dependencies & Framework"
Cohesion: 0.50
Nodes (3): frontend_next_dev_types_root_params_d, frontend_next_dev_types_routes_d, NOTE: This file should not be edited

### Community 66 - "Inventory & Warehouse Management"
Cohesion: 1.00
Nodes (3): BOM Cost Breakdown Structure, BOM Formula and Material Mapping, Create Bill of Materials View

### Community 67 - "RBAC & Access Control"
Cohesion: 0.67
Nodes (3): Module Help Categories, User Guide Search Bar, Help & User Guide Portal

## Knowledge Gaps
- **172 isolated node(s):** `github.com/kayukwas/tracking-backend`, `MaterialDemandBreakdown`, `StationCapacityBreakdown`, `PORecommendation`, `AllocateMaterialRequestDTO` (+167 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 272 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **46 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `JSONError()` connect `Authentication & OTP Verification` to `RBAC & Access Control`, `HTTP Handlers & API Endpoints`, `Commercial Quotes & Sales Pipeline`, `Costing & Subcontracting`, `Industrial Operations & Batch Control`, `Inventory & Warehouse Management`, `HTTP Handlers & API Endpoints`, `Authentication & OTP Verification`, `HTTP Handlers & API Endpoints`, `Enterprise MRP & Shop Floor`, `Inventory & Warehouse Management`, `FX & Currency Management`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `JSONSuccess()` connect `Inventory & Warehouse Management` to `RBAC & Access Control`, `HTTP Handlers & API Endpoints`, `Commercial Quotes & Sales Pipeline`, `Costing & Subcontracting`, `Industrial Operations & Batch Control`, `Authentication & OTP Verification`, `HTTP Handlers & API Endpoints`, `HTTP Handlers & API Endpoints`, `Enterprise MRP & Shop Floor`, `Inventory & Warehouse Management`, `FX & Currency Management`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `MRPService` connect `Inventory & Warehouse Management` to `RBAC & Access Control`, `Invoicing & Financial Settlement`, `Configuration & Database Initialization`, `Configuration & Database Initialization`, `Configuration & Database Initialization`, `Inventory & Warehouse Management`, `Commercial Quotes & Sales Pipeline`, `Configuration & Database Initialization`, `Commercial Quotes & Sales Pipeline`, `Configuration & Database Initialization`, `Configuration & Database Initialization`, `RBAC & Access Control`, `Configuration & Database Initialization`, `Commercial Quotes & Sales Pipeline`, `RBAC & Access Control`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `github.com/kayukwas/tracking-backend`, `MaterialDemandBreakdown`, `StationCapacityBreakdown` to the rest of the system?**
  _172 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `RBAC & Access Control` be split into smaller, more focused modules?**
  _Cohesion score 0.14244120940649496 - nodes in this community are weakly interconnected._
- **Should `RBAC & Access Control` be split into smaller, more focused modules?**
  _Cohesion score 0.08326530612244898 - nodes in this community are weakly interconnected._
- **Should `RBAC & Access Control` be split into smaller, more focused modules?**
  _Cohesion score 0.06382978723404255 - nodes in this community are weakly interconnected._