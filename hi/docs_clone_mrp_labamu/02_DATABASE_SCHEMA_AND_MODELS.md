# SKEMA BASIS DATA & MODEL DATA (DATABASE SCHEMA)
## Relational Schema (PostgreSQL / Prisma ORM) untuk Labamu MRP Clone

Dokumen ini berisi definisi lengkap skema database relasional yang mencakup seluruh entitas, relasi antar-tabel, indeks, dan tipe data.

---

## 1. Entity Relationship Diagram (ERD Overview)

```
[Company] ──┬── [User] ────────── [UserGroup / Role]
            ├── [Customer] ────── [CustomerContact (Multi-PIC)]
            ├── [Vendor] ──────── [VendorContact]
            │
            ├── [Material] ────── [StockBatch] ── [StockMovement]
            ├── [Product] ─────── [BOM] ───────── [BOMItem]
            │                     └── [Routing] ── [RoutingStep]
            │
            ├── [RFQ] ─────────── [RFQItem] ──── [CustomProductRequest (CPR)]
            │                         │
            ├── [Quotation] ───── [QuotationItem]
            │       │
            ├── [SalesOrder] ──── [SalesOrderItem] ── [ShippingRecord]
            │       │
            ├── [WorkOrder] ───── [WorkOrderAllocation]
            │       │             └── [WorkOrderStepProgress] (In-House / Subcontract)
            │       │
            ├── [MaterialRequest]─[MaterialRequestItem]
            │       │
            ├── [PurchaseOrder] ──[PurchaseOrderItem] ── [PurchaseReceipt]
            │
            ├── [Invoice] ─────── [InvoiceItem] ── [PaymentSettlement]
            └── [FxRate]
```

---

## 2. Skema Prisma ORM Lengkap (`schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// -------------------------------------------------------------
// 1. ORGANISASI & PENGGUNA (ORGANIZATION & AUTH)
// -------------------------------------------------------------

enum UserRole {
  OWNER
  SALES
  ENGINEERING
  PRODUCTION_PPIC
  PROCUREMENT
  WAREHOUSE
  QC_INSPECTOR
  FINANCE
}

model Company {
  id              String           @id @default(uuid())
  name            String
  code            String           @unique
  address         String?
  phone           String?
  email           String?
  logoUrl         String?
  taxNumber       String?          // NPWP
  bankName        String?
  bankAccountNo   String?
  bankAccountName String?
  currencyCode    String           @default("IDR")
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  users           User[]
  materials       Material[]
  vendors         Vendor[]
  customers       Customer[]
  products        Product[]
  boms            BOM[]
  routings        Routing[]
  rfqs            RFQ[]
  quotes          Quotation[]
  orders          SalesOrder[]
  workOrders      WorkOrder[]
  materialReqs    MaterialRequest[]
  purchaseOrders  PurchaseOrder[]
  invoices        Invoice[]
  fxRates         FxRate[]
}

model User {
  id              String       @id @default(uuid())
  companyId       String
  company         Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  fullName        String
  email           String?      @unique
  phoneNumber     String       @unique
  role            UserRole     @default(OWNER)
  isActive        Boolean      @default(true)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  createdRfqs     RFQ[]        @relation("RFQCreator")
  createdQuotes   Quotation[]  @relation("QuoteCreator")
  managedOrders   SalesOrder[] @relation("OrderPIC")
}

// -------------------------------------------------------------
// 2. MASTER DATA REKANAN & PELANGGAN (VENDORS & CUSTOMERS)
// -------------------------------------------------------------

model Vendor {
  id              String          @id @default(uuid())
  companyId       String
  company         Company         @relation(fields: [companyId], references: [id], onDelete: Cascade)
  code            String          // VEND-001
  name            String
  category        String          // Raw Material, Fastener, Subcontractor (Coating)
  address         String?
  paymentTermsDays Int            @default(30)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  contacts        VendorContact[]
  stockBatches    StockBatch[]
  purchaseOrders  PurchaseOrder[]
}

model VendorContact {
  id          String   @id @default(uuid())
  vendorId    String
  vendor      Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  name        String
  position    String?
  email       String?
  phoneNumber String
  isPrimary   Boolean  @default(false)
}

model Customer {
  id              String            @id @default(uuid())
  companyId       String
  company         Company           @relation(fields: [companyId], references: [id], onDelete: Cascade)
  code            String            // CUST-001
  name            String
  industry        String?           // Pharmaceuticals, Automotive, Construction
  address         String?
  shippingAddress String?
  paymentTermsDays Int              @default(30)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  contacts        CustomerContact[]
  rfqs            RFQ[]
  quotes          Quotation[]
  orders          SalesOrder[]
  invoices        Invoice[]
}

enum ContactPortalRole {
  APPROVER   // Berhak menyetujui penawaran di microsite
  VIEWER     // Hanya melihat gambar & faktur
}

model CustomerContact {
  id          String            @id @default(uuid())
  customerId  String
  customer    Customer          @relation(fields: [customerId], references: [id], onDelete: Cascade)
  name        String
  position    String?
  email       String
  phoneNumber String
  portalRole  ContactPortalRole @default(VIEWER)
  isPrimary   Boolean           @default(false)
}

// -------------------------------------------------------------
// 3. MASTER MATERIAL, STOK BATCH & PRODUK (INVENTORY & PRODUCTS)
// -------------------------------------------------------------

enum AbcClass {
  A
  B
  C
}

enum MaterialType {
  RAW_MATERIAL
  SEMI_FINISHED
  FINISHED_COMPONENT
}

model Material {
  id              String          @id @default(uuid())
  companyId       String
  company         Company         @relation(fields: [companyId], references: [id], onDelete: Cascade)
  sku             String          // MAT-SS304-2MM
  name            String
  category        String          // Logam & Plat, Fastener, Kimia & Cat
  abcClass        AbcClass        @default(B)
  materialType    MaterialType    @default(RAW_MATERIAL)
  uom             String          // Lembar, Batang, Tube, Pcs, Box
  minStockRisk    Float           @default(10)
  avgCostPrice    Decimal         @db.Decimal(15, 2)
  description     String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  batches         StockBatch[]
  bomItems        BOMItem[]
  materialReqItems MaterialRequestItem[]
  poItems         PurchaseOrderItem[]
  allocations     WorkOrderAllocation[]

  @@unique([companyId, sku])
}

enum BatchStatus {
  RECEIVED
  IN_USE
  DEPLETED
  EXPIRED
}

model StockBatch {
  id              String       @id @default(uuid())
  materialId      String
  material        Material     @relation(fields: [materialId], references: [id], onDelete: Cascade)
  vendorId        String?
  vendor          Vendor?      @relation(fields: [vendorId], references: [id])
  batchNumber     String       // BAT-20260901-001
  initialQuantity Float
  currentQuantity Float
  allocatedQuantity Float      @default(0) // Reserved for active WOs
  unitCost        Decimal      @db.Decimal(15, 2)
  purchaseDate    DateTime     @default(now())
  expiryDate      DateTime?
  status          BatchStatus  @default(RECEIVED)
  warehouseRack   String?      // Gudang A - Rak Besi 01
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  allocations     WorkOrderAllocation[]
}

model Product {
  id              String       @id @default(uuid())
  companyId       String
  company         Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  sku             String       // PROD-TBL-SS180
  name            String
  category        String
  uom             String       @default("Unit")
  sellingPrice    Decimal      @db.Decimal(15, 2)
  standardCost    Decimal      @db.Decimal(15, 2) // Total BOM + Routing
  currentStock    Float        @default(0)
  isCustom        Boolean      @default(false)
  description     String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  boms            BOM[]
  routings        Routing[]
  rfqItems        RFQItem[]
  quoteItems      QuotationItem[]
  orderItems      SalesOrderItem[]
  workOrders      WorkOrder[]

  @@unique([companyId, sku])
}

// -------------------------------------------------------------
// 4. BILL OF MATERIALS (BOM) & ROUTING TAHAPAN KERJA
// -------------------------------------------------------------

model BOM {
  id              String       @id @default(uuid())
  companyId       String
  company         Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  productId       String
  product         Product      @relation(fields: [productId], references: [id], onDelete: Cascade)
  code            String       // BOM-TBL-SS180-V1
  version         Int          @default(1)
  isActive        Boolean      @default(true)
  totalMaterialCost Decimal    @db.Decimal(15, 2)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  items           BOMItem[]
  workOrders      WorkOrder[]
}

model BOMItem {
  id          String   @id @default(uuid())
  bomId       String
  bom         BOM      @relation(fields: [bomId], references: [id], onDelete: Cascade)
  materialId  String
  material    Material @relation(fields: [materialId], references: [id])
  quantity    Float
  unitCost    Decimal  @db.Decimal(15, 2)
  subtotal    Decimal  @db.Decimal(15, 2)
}

enum RoutingExecutionType {
  IN_HOUSE
  OUTSOURCE_SUBCONTRACT
}

model Routing {
  id              String       @id @default(uuid())
  companyId       String
  company         Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  productId       String
  product         Product      @relation(fields: [productId], references: [id], onDelete: Cascade)
  code            String       // ROUT-TBL-SS180
  name            String
  totalCost       Decimal      @db.Decimal(15, 2)
  totalLeadHours  Float
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  steps           RoutingStep[]
  workOrders      WorkOrder[]
}

model RoutingStep {
  id              String               @id @default(uuid())
  routingId       String
  routing         Routing              @relation(fields: [routingId], references: [id], onDelete: Cascade)
  stepNumber      Int                  // 1, 2, 3...
  code            String               // ROUT-CUTTING
  name            String               // Pemotongan Plat & Pipa
  description     String?
  type            RoutingExecutionType @default(IN_HOUSE)
  standardHours   Float                @default(1.0)
  hourlyLaborCost Decimal              @default(0) @db.Decimal(15, 2)
  subcontractCost Decimal              @default(0) @db.Decimal(15, 2)
}

// -------------------------------------------------------------
// 5. SALES: RFQ, CPR (CUSTOM PRODUCT REQUEST) & QUOTATIONS
// -------------------------------------------------------------

enum RFQStatus {
  DRAFT
  ANALYSIS_PENDING  // Waiting for CPR completion if custom product
  READY_TO_QUOTE
  QUOTED
  EXPIRED
}

model RFQ {
  id              String       @id @default(uuid())
  companyId       String
  company         Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  rfqNumber       String       // RFQ-2026-0091
  customerId      String
  customer        Customer     @relation(fields: [customerId], references: [id])
  createdById     String
  createdBy       User         @relation("RFQCreator", fields: [createdById], references: [id])
  targetDelivery  DateTime?
  status          RFQStatus    @default(DRAFT)
  notes           String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  items           RFQItem[]
  quotations      Quotation[]
}

model RFQItem {
  id          String   @id @default(uuid())
  rfqId       String
  rfq         RFQ      @relation(fields: [rfqId], references: [id], onDelete: Cascade)
  productId   String?
  product     Product? @relation(fields: [productId], references: [id])
  customName  String?  // If not in standard product catalog
  quantity    Float
  targetPrice Decimal? @db.Decimal(15, 2)
  notes       String?

  cpr         CustomProductRequest?
}

enum CPRStatus {
  SUBMITTED
  IN_ENGINEERING_REVIEW
  COMPLETED
  REJECTED
}

model CustomProductRequest {
  id              String      @id @default(uuid())
  rfqItemId       String      @unique
  rfqItem         RFQItem     @relation(fields: [rfqItemId], references: [id], onDelete: Cascade)
  cprNumber       String      // CPR-20260925-001
  drawingsUrl     String?     // Technical CAD file / drawing attachment
  estimatedBOMJson Json       // Calculated materials & quantities
  estimatedRoutingJson Json   // Calculated processes & hours
  estimatedHpp    Decimal     @db.Decimal(15, 2)
  suggestedMargin Float       @default(30.0) // 30%
  suggestedPrice  Decimal     @db.Decimal(15, 2)
  estimatedLeadDays Int       @default(14)
  status          CPRStatus   @default(SUBMITTED)
  reviewedBy      String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

enum QuoteStatus {
  DRAFT
  SENT_TO_CUSTOMER
  APPROVED_BY_CUSTOMER
  REJECTED_BY_CUSTOMER
  REVISED
  CONVERTED_TO_ORDER
}

model Quotation {
  id                String       @id @default(uuid())
  companyId         String
  company           Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  quoteNumber       String       // QUO-2026-0045
  rfqId             String?
  rfq               RFQ?         @relation(fields: [rfqId], references: [id])
  customerId        String
  customer          Customer     @relation(fields: [customerId], references: [id])
  createdById       String
  createdBy         User         @relation("QuoteCreator", fields: [createdById], references: [id])
  currencyCode      String       @default("IDR")
  exchangeRate      Decimal      @default(1.0) @db.Decimal(15, 6)
  downPaymentPercent Float       @default(50.0) // 50% DP
  incoterms         String?      // FOB Jakarta, Loco Pabrik, DDP
  validUntil        DateTime
  subtotal          Decimal      @db.Decimal(15, 2)
  taxPercent        Float        @default(11.0) // PPN 11%
  taxAmount         Decimal      @db.Decimal(15, 2)
  grandTotal        Decimal      @db.Decimal(15, 2)
  status            QuoteStatus  @default(DRAFT)
  micrositeToken    String       @unique @default(uuid())
  approvedAt        DateTime?
  approvedByContact String?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  items             QuotationItem[]
  salesOrder        SalesOrder?
}

model QuotationItem {
  id          String    @id @default(uuid())
  quotationId String
  quotation   Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  productId   String?
  product     Product?  @relation(fields: [productId], references: [id])
  description String
  quantity    Float
  unitPrice   Decimal   @db.Decimal(15, 2)
  discount    Decimal   @default(0) @db.Decimal(15, 2)
  subtotal    Decimal   @db.Decimal(15, 2)
}

// -------------------------------------------------------------
// 6. SALES ORDERS & WORK ORDERS (MANUFACTURING EXECUTION)
// -------------------------------------------------------------

enum OrderStatus {
  CONFIRMED
  DOWN_PAYMENT_PENDING
  IN_PRODUCTION
  READY_TO_SHIP
  ON_SHIPPING
  DELIVERED
  COMPLETED
  CANCELLED
}

model SalesOrder {
  id              String       @id @default(uuid())
  companyId       String
  company         Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  orderNumber     String       @unique // SO-2026-0038
  quotationId     String       @unique
  quotation       Quotation    @relation(fields: [quotationId], references: [id])
  customerId      String
  customer        Customer     @relation(fields: [customerId], references: [id])
  picId           String
  pic             User         @relation("OrderPIC", fields: [picId], references: [id])
  status          OrderStatus  @default(CONFIRMED)
  targetDelivery  DateTime?
  totalAmount     Decimal      @db.Decimal(15, 2)
  dpAmountPaid    Decimal      @default(0) @db.Decimal(15, 2)
  finalAmountPaid Decimal      @default(0) @db.Decimal(15, 2)
  shippingRef     String?      // Nomor Resi / No Polisi Truk
  deliveredAt     DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  items           SalesOrderItem[]
  workOrders      WorkOrder[]
  invoices        Invoice[]
}

model SalesOrderItem {
  id          String     @id @default(uuid())
  orderId     String
  order       SalesOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String
  product     Product    @relation(fields: [productId], references: [id])
  quantity    Float
  unitPrice   Decimal    @db.Decimal(15, 2)
  subtotal    Decimal    @db.Decimal(15, 2)
}

enum WOStatus {
  PENDING_ALLOCATION
  ALLOCATED
  IN_PROGRESS
  QUALITY_CONTROL
  COMPLETED
  CANCELLED
}

model WorkOrder {
  id              String       @id @default(uuid())
  companyId       String
  company         Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  woNumber        String       @unique // WO-2026-0041
  orderId         String
  order           SalesOrder   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId       String
  product         Product      @relation(fields: [productId], references: [id])
  bomId           String
  bom             BOM          @relation(fields: [bomId], references: [id])
  routingId       String
  routing         Routing      @relation(fields: [routingId], references: [id])
  quantity        Float
  allocatedStatus Boolean      @default(false)
  status          WOStatus     @default(PENDING_ALLOCATION)
  startDate       DateTime?
  completionDate  DateTime?
  qcPassStatus    Boolean      @default(false)
  qcNotes         String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  allocations     WorkOrderAllocation[]
  stepProgresses  WorkOrderStepProgress[]
}

model WorkOrderAllocation {
  id          String     @id @default(uuid())
  workOrderId String
  workOrder   WorkOrder  @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  materialId  String
  material    Material   @relation(fields: [materialId], references: [id])
  batchId     String?
  batch       StockBatch? @relation(fields: [batchId], references: [id])
  reqQty      Float
  allocatedQty Float
  isFulfilled Boolean    @default(false)
}

enum StepProgressStatus {
  PENDING
  IN_PROGRESS
  RELEASED_TO_VENDOR // Subcontract sent out
  RECEIVED_FROM_VENDOR
  COMPLETED
}

model WorkOrderStepProgress {
  id              String             @id @default(uuid())
  workOrderId     String
  workOrder       WorkOrder          @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  stepNumber      Int
  stepName        String
  stepType        RoutingExecutionType
  assignedVendorId String?
  poId            String?            // Linked subcontract PO
  status          StepProgressStatus @default(PENDING)
  actualHours     Float              @default(0)
  notes           String?
  updatedAt       DateTime           @updatedAt
}

// -------------------------------------------------------------
// 7. PROCUREMENT: MATERIAL REQUEST & PURCHASE ORDERS
// -------------------------------------------------------------

enum MaterialReqStatus {
  PENDING
  PO_CREATED
  FULFILLED
  REJECTED
}

model MaterialRequest {
  id              String            @id @default(uuid())
  companyId       String
  company         Company           @relation(fields: [companyId], references: [id], onDelete: Cascade)
  reqNumber       String            @unique // MR-2026-0012
  workOrderId     String?
  requestedBy     String
  status          MaterialReqStatus @default(PENDING)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  items           MaterialRequestItem[]
}

model MaterialRequestItem {
  id          String          @id @default(uuid())
  reqId       String
  req         MaterialRequest @relation(fields: [reqId], references: [id], onDelete: Cascade)
  materialId  String
  material    Material        @relation(fields: [materialId], references: [id])
  quantity    Float
  reason      String?
}

enum POType {
  RAW_MATERIAL
  SUBCONTRACT_SERVICE
}

enum POStatus {
  DRAFT
  SENT_TO_VENDOR
  PARTIALLY_RECEIVED
  FULLY_RECEIVED
  CANCELLED
}

model PurchaseOrder {
  id              String          @id @default(uuid())
  companyId       String
  company         Company         @relation(fields: [companyId], references: [id], onDelete: Cascade)
  poNumber        String          @unique // PO-2026-0056
  vendorId        String
  vendor          Vendor          @relation(fields: [vendorId], references: [id])
  type            POType          @default(RAW_MATERIAL)
  status          POStatus        @default(DRAFT)
  subtotal        Decimal         @db.Decimal(15, 2)
  taxAmount       Decimal         @db.Decimal(15, 2)
  grandTotal      Decimal         @db.Decimal(15, 2)
  expectedDate    DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  items           PurchaseOrderItem[]
  receipts        PurchaseReceipt[]
}

model PurchaseOrderItem {
  id          String        @id @default(uuid())
  poId        String
  po          PurchaseOrder @relation(fields: [poId], references: [id], onDelete: Cascade)
  materialId  String?
  material    Material?     @relation(fields: [materialId], references: [id])
  description String
  quantity    Float
  unitCost    Decimal       @db.Decimal(15, 2)
  subtotal    Decimal       @db.Decimal(15, 2)
}

model PurchaseReceipt {
  id            String        @id @default(uuid())
  poId          String
  po            PurchaseOrder @relation(fields: [poId], references: [id], onDelete: Cascade)
  receiptNumber String        // REC-20260920-001
  receivedDate  DateTime      @default(now())
  receivedBy    String
  deliveryNote  String?       // Surat Jalan Vendor No.
  itemsReceived Json          // [{materialId, batchNo, qtyReceived, warehouseRack}]
}

// -------------------------------------------------------------
// 8. FINANCE: INVOICES & SETTLEMENTS & FX RATES
// -------------------------------------------------------------

enum InvoiceType {
  DOWN_PAYMENT
  PROGRESS_PAYMENT
  FINAL_SETTLEMENT
}

enum InvoiceStatus {
  UNPAID
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
}

model Invoice {
  id              String        @id @default(uuid())
  companyId       String
  company         Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  invoiceNumber   String        @unique // INV-2026-0023
  orderId         String
  order           SalesOrder    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  customerId      String
  customer        Customer      @relation(fields: [customerId], references: [id])
  type            InvoiceType   @default(DOWN_PAYMENT)
  status          InvoiceStatus @default(UNPAID)
  dueDate         DateTime
  amountDue       Decimal       @db.Decimal(15, 2)
  amountPaid      Decimal       @default(0) @db.Decimal(15, 2)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  settlements     PaymentSettlement[]
}

model PaymentSettlement {
  id            String   @id @default(uuid())
  invoiceId     String
  invoice       Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  paymentDate   DateTime @default(now())
  amount        Decimal  @db.Decimal(15, 2)
  paymentMethod String   // Bank Transfer, Virtual Account, Giro
  referenceNo   String?  // Bukti Transfer / Bank Ref
  notes         String?
}

model FxRate {
  id           String   @id @default(uuid())
  companyId    String
  company      Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  currencyCode String   // USD, EUR, SGD, JPY
  rateToIdr    Decimal  @db.Decimal(15, 6)
  effectiveDate DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([companyId, currencyCode])
}
```
