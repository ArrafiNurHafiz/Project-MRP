# 05. Model Data & Skema Database (PostgreSQL)

Skema database PostgreSQL lengkap dengan seluruh tabel, foreign key, index, serta tipe data yang mencakup seluruh fitur yang ditemukan di sistem `mrp.labamu.co.id`.

---

## 1. Skema DDL Lengkap

```sql
-- Ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 1. MULTI-TENANCY & IDENTITY MANAGEMENT
-- =========================================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'STAFF', -- OWNER, ADMIN, STAFF
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE TABLE user_group_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
    access_path VARCHAR(100) NOT NULL, -- e.g., 'SALES:QUOTES', 'MANUFACTURING:BILL_OF_MATERIALS'
    can_read BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_approve BOOLEAN DEFAULT FALSE,
    UNIQUE(group_id, access_path)
);

CREATE TABLE tenant_bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    swift_code VARCHAR(50),
    branch VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE currencies (
    code VARCHAR(10) PRIMARY KEY, -- IDR, USD, SGD
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    exchange_rate NUMERIC(18, 6) DEFAULT 1.0, -- Terhadap base currency (IDR = 1.0)
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================
-- 2. INVENTORY & VENDOR MANAGEMENT
-- =========================================================

CREATE TABLE material_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE material_uoms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL, -- PCS, KG, MTR, LTR, ROLL, BOX
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES material_categories(id),
    uom_id UUID NOT NULL REFERENCES material_uoms(id),
    abc_classification VARCHAR(1) DEFAULT 'A', -- 'A', 'B', 'C'
    material_type VARCHAR(50) DEFAULT 'RAW_MATERIAL', -- RAW_MATERIAL, PACKAGING, CONSUMABLE
    on_hand_stock NUMERIC(15, 4) DEFAULT 0,
    allocated_stock NUMERIC(15, 4) DEFAULT 0,
    minimum_stock NUMERIC(15, 4) DEFAULT 0,
    average_cost NUMERIC(18, 2) DEFAULT 0,
    stock_risk VARCHAR(255),
    description TEXT,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    alias VARCHAR(100),
    pic_name VARCHAR(255),
    pic_email VARCHAR(255),
    pic_phone VARCHAR(50),
    business_address TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================
-- 3. PRODUCT & BILL OF MATERIALS (BOM)
-- =========================================================

CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE routings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE routing_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routing_id UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    work_center_name VARCHAR(255) NOT NULL,
    estimated_hours NUMERIC(8, 2) DEFAULT 0,
    hourly_rate NUMERIC(15, 2) DEFAULT 0
);

CREATE TABLE bill_of_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(20) DEFAULT 'v1.0',
    description TEXT,
    routing_id UUID REFERENCES routings(id),
    material_cost NUMERIC(18, 2) DEFAULT 0,
    labour_cost NUMERIC(18, 2) DEFAULT 0,
    packing_cost NUMERIC(18, 2) DEFAULT 0,
    other_cost NUMERIC(18, 2) DEFAULT 0,
    total_cost NUMERIC(18, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bom_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID NOT NULL REFERENCES bill_of_materials(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    quantity NUMERIC(15, 4) NOT NULL,
    waste_percentage NUMERIC(5, 2) DEFAULT 0,
    unit_cost NUMERIC(18, 2) NOT NULL,
    subtotal_cost NUMERIC(18, 2) NOT NULL
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES product_categories(id),
    bom_id UUID REFERENCES bill_of_materials(id),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    description TEXT,
    primary_material VARCHAR(100),
    finishing VARCHAR(100),
    weight NUMERIC(10, 2), -- in kg
    height NUMERIC(10, 2), -- in cm
    width NUMERIC(10, 2),
    length NUMERIC(10, 2),
    pkg_height NUMERIC(10, 2),
    pkg_width NUMERIC(10, 2),
    pkg_length NUMERIC(10, 2),
    container_20ft_capacity INT,
    container_40ft_capacity INT,
    container_40hc_capacity INT,
    lead_time INT DEFAULT 1,
    lead_time_unit VARCHAR(20) DEFAULT 'WEEK', -- DAY, WEEK, MONTH
    base_price NUMERIC(18, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE product_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    currency_code VARCHAR(10) NOT NULL REFERENCES currencies(code),
    selling_price NUMERIC(18, 2) NOT NULL,
    UNIQUE(product_id, currency_code)
);

CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0
);

-- =========================================================
-- 4. SALES PIPELINE (CUSTOMER -> RFQ -> QUOTE -> SO -> INVOICE)
-- =========================================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE customer_pics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    pic_name VARCHAR(255) NOT NULL,
    pic_email VARCHAR(255),
    role VARCHAR(100), -- APPROVER, PURCHASING, FINANCE
    pic_phone VARCHAR(50)
);

CREATE TABLE sales_rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rfq_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    submission_status VARCHAR(50) DEFAULT 'SUBMITTED',
    processing_status VARCHAR(50) DEFAULT 'PENDING',
    customer_notes TEXT,
    internal_notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sales_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    quote_number VARCHAR(100) UNIQUE NOT NULL,
    rfq_id UUID REFERENCES sales_rfqs(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    currency_code VARCHAR(10) NOT NULL REFERENCES currencies(code),
    down_payment_percentage NUMERIC(5, 2) DEFAULT 0,
    valid_until DATE NOT NULL,
    bank_account_id UUID REFERENCES tenant_bank_accounts(id),
    payment_terms VARCHAR(255) NOT NULL,
    incoterms VARCHAR(50),
    risk_level VARCHAR(50) DEFAULT 'LOW',
    shipping_method VARCHAR(100),
    estimated_delivery DATE,
    dispute_resolution_method VARCHAR(255),
    governing_law VARCHAR(255),
    include_force_majeure BOOLEAN DEFAULT TRUE,
    include_late_payment_penalties BOOLEAN DEFAULT TRUE,
    include_performance_guarantees BOOLEAN DEFAULT FALSE,
    subtotal NUMERIC(18, 2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    tax_total NUMERIC(18, 2) DEFAULT 0,
    shipping_fee NUMERIC(18, 2) DEFAULT 0,
    other_fee NUMERIC(18, 2) DEFAULT 0,
    grand_total NUMERIC(18, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, WAITING_APPROVAL, SENT, ACCEPTED, REJECTED
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sales_quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES sales_quotes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    custom_product_name VARCHAR(255),
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(18, 2) NOT NULL,
    discount_amount NUMERIC(18, 2) DEFAULT 0,
    total_price NUMERIC(18, 2) NOT NULL
);

CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    quote_id UUID REFERENCES sales_quotes(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    order_type VARCHAR(50) DEFAULT 'STANDARD',
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    remarks TEXT,
    status VARCHAR(50) DEFAULT 'WAITING_APPROVAL', -- WAITING_APPROVAL, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sales_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES sales_orders(id),
    invoice_type VARCHAR(50) NOT NULL, -- DOWN_PAYMENT, FULL_PAYMENT, SETTLEMENT
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_due NUMERIC(18, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'UNPAID', -- UNPAID, PARTIAL, PAID, OVERDUE
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, VOID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================
-- 5. MANUFACTURING (WORK ORDERS & MATERIAL REQUESTS)
-- =========================================================

CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    work_order_number VARCHAR(100) UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES sales_orders(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity_to_produce NUMERIC(12, 2) NOT NULL,
    quantity_completed NUMERIC(12, 2) DEFAULT 0,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    planned_start_date DATE,
    planned_end_date DATE,
    assigned_user_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'NOT_STARTED', -- NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELLED
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE material_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    request_number VARCHAR(100) UNIQUE NOT NULL,
    work_order_id UUID NOT NULL REFERENCES work_orders(id),
    requested_by UUID REFERENCES users(id),
    requested_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'PREPARING', -- PREPARING, ALLOCATED, ISSUED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE material_request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_request_id UUID NOT NULL REFERENCES material_requests(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    quantity_requested NUMERIC(15, 4) NOT NULL,
    quantity_allocated NUMERIC(15, 4) DEFAULT 0
);

-- =========================================================
-- 6. PROCUREMENT (PURCHASE ORDERS)
-- =========================================================

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    po_number VARCHAR(100) UNIQUE NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    po_date DATE NOT NULL,
    expected_delivery_date DATE,
    currency_code VARCHAR(10) NOT NULL REFERENCES currencies(code),
    recipient_name VARCHAR(255),
    recipient_phone VARCHAR(50),
    recipient_email VARCHAR(255),
    recipient_address TEXT,
    notes TEXT,
    terms TEXT,
    total_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'UNPAID',
    po_status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, WAITING_APPROVAL, APPROVED, COMPLETED, CANCELLED
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    quantity NUMERIC(15, 4) NOT NULL,
    unit_cost NUMERIC(18, 2) NOT NULL,
    subtotal NUMERIC(18, 2) NOT NULL
);
```
