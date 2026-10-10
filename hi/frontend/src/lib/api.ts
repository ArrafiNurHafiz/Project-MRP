export const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '/api/v1' : 'http://localhost:8080/api/v1');

export interface User {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  status: 'ACTIVE' | 'PENDING_ACTIVATION';
  is_active: boolean;
  email_verified_at?: string;
  whatsapp_verified_at?: string;
  roles?: Role[];
  permissions?: string[];
  created_at: string;
}

export interface Role {
  id: number;
  name: string;
  is_active: boolean;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
}

// Import Response Type
export interface ImportResult {
  total_processed: number;
  success_count: number;
  failed_count: number;
  errors?: string[];
}

export function downloadTemplateUrl(module: string): string {
  return `${API_BASE}/import/template/${module}`;
}

export const isSuperuser = (user: User | null): boolean => {
  if (!user) return false;
  return user.roles?.some((r) => r.name.toLowerCase() === 'superuser') ?? false;
};

export const hasRole = (user: User | null, roleName: string): boolean => {
  if (!user) return false;
  if (isSuperuser(user)) return true;
  return user.roles?.some((r) => r.name.toLowerCase() === roleName.toLowerCase()) ?? false;
};

export const hasAnyRole = (user: User | null, roleNames: string[]): boolean => {
  if (!user) return false;
  if (isSuperuser(user)) return true;
  const lowerNames = roleNames.map((n) => n.toLowerCase());
  return user.roles?.some((r) => lowerNames.includes(r.name.toLowerCase())) ?? false;
};

export const hasPermission = (user: User | null, permissionName: string): boolean => {
  if (!user) return false;
  if (isSuperuser(user)) return true;

  if (user.permissions && Array.isArray(user.permissions)) {
    if (user.permissions.some((p) => p.toLowerCase() === permissionName.toLowerCase())) {
      return true;
    }
  }

  if (user.roles) {
    for (const r of user.roles) {
      if (r.permissions) {
        for (const p of r.permissions) {
          if (p.name.toLowerCase() === permissionName.toLowerCase()) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

export interface AuditLog {
  id: number;
  user_id?: number;
  user?: User;
  action_type: string;
  description: string;
  created_at: string;
}

// ---------------- Production & Modular MRP Types ----------------

export interface BOMCostDetail {
  material_name: string;
  category: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  subtotal: number;
}

export interface LaborCostDetail {
  station_name: string;
  assigned_type: string;
  worker_name: string;
  fee_per_unit: number;
}

export interface ProductCostCalculation {
  product_id: number;
  product_name: string;
  product_code: string;
  total_material_cost: number;
  total_labor_cost: number;
  total_hpp_per_unit: number;
  materials_breakdown: BOMCostDetail[];
  labor_breakdown: LaborCostDetail[];
}

export interface MitraSPKPayout {
  spk_number: string;
  product_name: string;
  station_name: string;
  pass_qty: number;
  rate_per_pcs: number;
  total_subtotal: number;
}

export interface MitraPayrollSummary {
  mitra_id: number;
  mitra_name: string;
  phone: string;
  total_pass_qty: number;
  total_payout: number;
  spk_breakdown: MitraSPKPayout[];
}

export interface Material {
  id: number;
  material_code: string;
  name: string;
  category: 'wood' | 'chemical' | 'packaging' | 'accessory';
  abc_classification?: 'A' | 'B' | 'C';
  material_type?: 'Raw Material' | 'Packaging' | 'Consumable';
  unit: string;
  stock_qty: number;
  minimum_stock: number;
  cost_per_unit: number;
  description?: string;
  created_at: string;
}

export interface ProductBOM {
  id: number;
  product_id: number;
  material_id: number;
  material?: Material;
  station_id: number;
  station?: WorkStation;
  quantity: number;
  waste_pct: number;
  notes?: string;
  created_at: string;
}

export interface Product {
  id: number;
  product_name: string;
  product_code: string;
  is_active: boolean;
  primary_material?: string;
  finishing?: string;
  weight?: number;
  lead_time?: string;
  container_20ft_capacity?: number;
  container_40ft_capacity?: number;
  container_40hc_capacity?: number;
  bom_items?: ProductBOM[];
  created_at: string;
}

export interface WorkStation {
  id: number;
  station_code: string;
  name: string;
  sequence_order: number;
  is_external_allowed: boolean;
}

export interface WorkOrderStation {
  id: number;
  work_order_id: number;
  station_id: number;
  station: WorkStation;
  sequence_order: number;
  assigned_type: 'internal' | 'mitra';
  assigned_user_id?: number;
  assigned_user?: User;
  status: 'pending' | 'in_progress' | 'qc_wait' | 'completed';
  input_qty: number;
  completed_qty: number;
  reject_qty: number;
  rework_qty: number;
  notes?: string;
}

export interface WorkOrder {
  id: number;
  spk_number: string;
  product_id: number;
  product: Product;
  total_target_qty: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  start_date?: string;
  deadline_date?: string;
  stations?: WorkOrderStation[];
  created_at: string;
}

export interface MitraProductStationAssignment {
  id: number;
  mitra_user_id: number;
  mitra_user?: User;
  product_id: number;
  product?: Product;
  station_id: number;
  station?: WorkStation;
  piece_rate_fee: number;
  daily_capacity_estimate: number;
  is_primary: boolean;
  notes?: string;
}

export interface QCLog {
  id: number;
  work_order_station_id: number;
  inspector_user_id: number;
  inspector_user?: User;
  inspection_model: string;
  sample_qty: number;
  pass_qty: number;
  reject_qty: number;
  reject_minor_qty: number;
  reject_major_qty: number;
  reject_scrap_qty: number;
  defect_categories?: string;
  action_taken: string;
  notes?: string;
  created_at: string;
}

export interface MitraShipmentItem {
  id: number;
  shipment_id: number;
  product_id?: number;
  product?: Product;
  raw_item_name: string;
  qty: number;
  status_category: 'revisi_total' | 'revisi_jamur' | 'revisi_cacat_lain';
  notes?: string;
}

export interface MitraShipment {
  id: number;
  sj_number: string;
  vehicle_gate_status: 'keluar' | 'masuk';
  product_action: 'kirim' | 'ambil';
  movement_date: string;
  movement_time: string;
  driver_name: string;
  helper_name?: string;
  qc_inspector_name?: string;
  vehicle_type: string;
  license_plate: string;
  mitra_id?: number;
  mitra?: User;
  notes?: string;
  items?: MitraShipmentItem[];
  created_at: string;
}

// ----------------- EMTKu Core MRP Entities -----------------

export interface CustomerPIC {
  id: number;
  customer_id: number;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  is_primary: boolean;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tag?: string;
  pics?: CustomerPIC[];
  created_at: string;
}

export interface Vendor {
  id: number;
  name: string;
  alias?: string;
  pic_name?: string;
  pic_email?: string;
  pic_phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
}

// RFQ
export interface RFQItem {
  id: number;
  rfq_id: number;
  product_id?: number;
  product?: Product;
  custom_name?: string;
  target_quantity: number;
  target_budget: number;
  specs_notes?: string;
}

export interface RFQ {
  id: number;
  rfq_number: string;
  customer_id: number;
  customer: Customer;
  submission_status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  processing_status: 'ANALYSIS_PENDING' | 'READY_TO_QUOTE' | 'QUOTED';
  is_custom_product: boolean;
  target_date?: string;
  customer_notes?: string;
  internal_notes?: string;
  items?: RFQItem[];
  created_at: string;
}

export interface QuotationItem {
  id: number;
  quotation_id: number;
  product_id?: number;
  product?: Product;
  item_name: string;
  description?: string;
  qty: number;
  unit: string;
  unit_price: number;
  discount_pct: number;
  total_price: number;
}

export interface Quotation {
  id: number;
  quote_number: string;
  public_token?: string;
  customer_id: number;
  customer: Customer;
  created_by_user_id: number;
  created_by_user: User;
  currency: string;
  down_payment_pct: number;
  valid_until?: string;
  payment_terms?: string;
  incoterms?: string;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH';
  clause_notes?: string;
  customer_signed_by?: string;
  customer_signed_at?: string;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'NEED_REVISION';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  shipping_fee: number;
  other_fee?: number;
  total_amount: number;
  customer_notes?: string;
  internal_notes?: string;
  items?: QuotationItem[];
  created_at: string;
}

// ----------------- CPR (Custom Product Request) -----------------
export interface CPRMaterialItem {
  id?: number;
  cpr_id?: number;
  material_id?: number;
  material?: Material;
  item_name: string;
  qty_required: number;
  unit: string;
  unit_cost: number;
  subtotal: number;
}

export interface CPRRoutingStage {
  id?: number;
  cpr_id?: number;
  station_id?: number;
  station?: WorkStation;
  stage_name: string;
  sequence_order: number;
  estimated_hours: number;
  hourly_rate: number;
  subtotal: number;
}

export interface CustomProductRequest {
  id: number;
  cpr_number: string;
  rfq_id?: number;
  rfq?: RFQ;
  customer_id: number;
  customer: Customer;
  assigned_eng_id?: number;
  assigned_eng?: User;
  product_name: string;
  category: string;
  unit: string;
  requested_qty: number;
  target_budget: number;
  base_price_hpp: number;
  suggested_price: number;
  estimated_lead_days: number;
  cad_file_url?: string;
  technical_specs?: string;
  engineering_notes?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'NEED_REVISION' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  materials?: CPRMaterialItem[];
  routings?: CPRRoutingStage[];
  created_at: string;
  updated_at: string;
}

export interface SalesOrderItem {
  id: number;
  sales_order_id: number;
  product_id: number;
  product: Product;
  qty: number;
  unit_price: number;
  total_price: number;
}

export interface SalesOrder {
  id: number;
  order_number: string;
  quotation_id?: number;
  quotation?: Quotation;
  customer_id: number;
  customer: Customer;
  created_by_user_id: number;
  created_by_user: User;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  planned_start?: string;
  planned_end?: string;
  actual_start?: string;
  actual_end?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  total_amount: number;
  remarks?: string;
  items?: SalesOrderItem[];
  created_at: string;
}

export interface MaterialRequestItem {
  id: number;
  material_request_id: number;
  material_id: number;
  material: Material;
  required_qty: number;
  available_qty: number;
  allocated_qty: number;
  unit: string;
  status: 'PENDING' | 'READY' | 'SHORTAGE' | 'TAKEN';
  notes?: string;
}

export interface MaterialRequest {
  id: number;
  request_number: string;
  work_order_id: number;
  work_order: WorkOrder;
  requested_by_id: number;
  requested_by: User;
  checked_by_id?: number;
  checked_by?: User;
  status: 'DRAFT' | 'WAITING_CHECK' | 'AVAILABLE' | 'ALLOCATED' | 'ISSUED' | 'SHORTAGE';
  request_date: string;
  allocation_date?: string;
  notes?: string;
  items?: MaterialRequestItem[];
  created_at: string;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  material_id: number;
  material: Material;
  qty: number;
  unit_cost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  vendor_id: number;
  vendor: Vendor;
  created_by_user_id: number;
  created_by_user: User;
  po_date: string;
  expected_date?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  total_amount: number;
  notes?: string;
  items?: PurchaseOrderItem[];
  created_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  sales_order_id: number;
  sales_order: SalesOrder;
  invoice_type: 'DOWN_PAYMENT' | 'FULL_PAYMENT' | 'FINAL_SETTLEMENT';
  issue_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  payment_status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'VOID';
  notes?: string;
  created_at: string;
}

// ----------------- Extended Simulation & Enterprise Models -----------------

export interface MaterialDemandBreakdown {
  material_id: number;
  material_code: string;
  name: string;
  category: string;
  current_stock_qty: number;
  required_gross_qty: number;
  net_shortage_qty: number;
  unit: string;
  cost_per_unit: number;
  total_demand_cost: number;
  is_shortage: boolean;
}

export interface StationCapacityBreakdown {
  station_code: string;
  station_name: string;
  estimated_load_hours: number;
  max_capacity_hours: number;
  utilization_pct: number;
  is_overloaded: boolean;
}

export interface PORecommendation {
  material_id: number;
  material_name: string;
  recommended_qty: number;
  estimated_unit_cost: number;
  estimated_total_cost: number;
  suggested_lead_days: number;
}

export interface OrderSimulationResult {
  order_required_date: string;
  feasibility_status: 'FEASIBLE' | 'PARTIAL_SHORTAGE' | 'LEAD_TIME_CRITICAL';
  forecasted_revenue: number;
  total_gross_cogs: number;
  estimated_margin: number;
  material_demands: MaterialDemandBreakdown[];
  station_capacities: StationCapacityBreakdown[];
  purchase_recommendations: PORecommendation[];
}

export interface CurrencyFX {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_active: boolean;
}

export interface CompanySetting {
  id: number;
  company_name: string;
  npwp?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
}

export interface MachineDowntime {
  id: number;
  station_id: number;
  station: WorkStation;
  work_order_station_id?: number;
  machine_name: string;
  reason_category: 'BREAKDOWN' | 'TOOLING_CHANGE' | 'POWER_OUTAGE' | 'MAINTENANCE' | 'MATERIAL_WAIT';
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  impacted_qty: number;
  action_taken?: string;
  reported_by_user_id: number;
  reported_by_user?: User;
  created_at: string;
}

export interface ReworkOrder {
  id: number;
  rework_number: string;
  work_order_id: number;
  work_order: WorkOrder;
  source_station_id: number;
  source_station: WorkStation;
  target_station_id: number;
  target_station: WorkStation;
  defect_reason: string;
  defect_qty: number;
  recovered_qty: number;
  scrapped_qty: number;
  status: 'IN_PROGRESS' | 'RECOVERED' | 'SCRAPPED';
  assigned_mitra_id?: number;
  assigned_mitra?: User;
  notes?: string;
  created_at: string;
}

export interface MaterialBatchLot {
  id: number;
  batch_number: string;
  material_id: number;
  material: Material;
  vendor_id: number;
  vendor: Vendor;
  received_date: string;
  initial_qty: number;
  remaining_qty: number;
  unit_cost: number;
  wood_origin?: string;
  moisture_content: number;
  expiry_date?: string;
  qc_status: 'PASSED' | 'QUARANTINE' | 'REJECTED';
  created_at: string;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  industry: string;
  plan_tier: 'TRIAL' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
  monthly_price: number;
  max_users: number;
  max_orders_per_month: number;
  subscription_expires_at?: string;
  npwp?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  owner_user_id: number;
  owner_user?: User;
  created_at: string;
}

export interface SaaSPlanInfo {
  tier: string;
  name: string;
  price_idr_per_month: number;
  max_users: number;
  max_orders_per_month: number;
  features: string[];
}

export interface ECOItem {
  id: number;
  eco_id: number;
  material_id: number;
  material: Material;
  action_type: 'ADD_MATERIAL' | 'REMOVE_MATERIAL' | 'UPDATE_QTY';
  old_quantity: number;
  new_quantity: number;
  notes?: string;
}

export interface EngineeringChangeOrder {
  id: number;
  eco_number: string;
  product_id: number;
  product: Product;
  title: string;
  change_type: 'BOM_CHANGE' | 'ROUTING_CHANGE' | 'SPEC_UPDATE';
  reason: string;
  effective_date: string;
  version_from: string;
  version_to: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'APPLIED' | 'REJECTED';
  approved_by_user_id?: number;
  approved_by_user?: User;
  items?: ECOItem[];
  created_at: string;
}

export interface ShopFloorLog {
  id: number;
  work_order_station_id: number;
  work_order_station: WorkOrderStation;
  operator_user_id: number;
  operator_user: User;
  machine_name?: string;
  clock_in_time: string;
  clock_out_time?: string;
  duration_minutes: number;
  good_qty_produced: number;
  scrap_qty_produced: number;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED';
  created_at: string;
}

export interface MaintenanceTask {
  id: number;
  task_number: string;
  station_id: number;
  station: WorkStation;
  machine_name: string;
  task_type: 'PREVENTIVE' | 'CORRECTIVE' | 'CALIBRATION';
  scheduled_date: string;
  completed_date?: string;
  technician_user_id: number;
  technician_user: User;
  spare_part_notes?: string;
  cost_estimated: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  action_log?: string;
  created_at: string;
}

export interface UnbuildItem {
  id: number;
  unbuild_id: number;
  material_id: number;
  material: Material;
  recovered_qty: number;
  condition: 'REUSABLE' | 'SCRAP' | 'DOWNGRADED';
}

export interface UnbuildOrder {
  id: number;
  unbuild_number: string;
  product_id: number;
  product: Product;
  disassembly_qty: number;
  reason: string;
  status: 'DRAFT' | 'DISASSEMBLED' | 'CANCELLED';
  performed_by_user_id: number;
  performed_by_user: User;
  recovered_items?: UnbuildItem[];
  created_at: string;
}

export interface LandedCostItem {
  id: number;
  landed_cost_id: number;
  material_id: number;
  material: Material;
  base_purchased_cost: number;
  allocated_extra_cost: number;
  final_true_unit_cost: number;
}

export interface LandedCost {
  id: number;
  document_number: string;
  purchase_order_id: number;
  purchase_order: PurchaseOrder;
  freight_cost: number;
  customs_duty: number;
  insurance_fee: number;
  handling_fee: number;
  total_landed_cost: number;
  allocation_method: 'BY_VALUE' | 'BY_QUANTITY';
  status: 'DRAFT' | 'ALLOCATED' | 'POSTED';
  items?: LandedCostItem[];
  created_at: string;
}

export interface SubcontractReconciliation {
  id: number;
  reconcile_number: string;
  mitra_user_id: number;
  mitra_user: User;
  work_order_id: number;
  work_order: WorkOrder;
  sent_quantity: number;
  received_quantity: number;
  reject_quantity: number;
  material_yield_pct: number;
  mitra_fee_payable: number;
  penalty_deduction: number;
  final_payout_amount: number;
  status: 'PENDING' | 'RECONCILED' | 'PAID';
  notes?: string;
  created_at: string;
}

export interface OverheadAbsorption {
  id: number;
  period_month: string;
  electricity_cost: number;
  factory_rent_cost: number;
  depreciation_cost: number;
  consumable_cost: number;
  total_overhead_cost: number;
  total_production_qty: number;
  overhead_rate_per_unit: number;
  status: 'ALLOCATED';
  created_at: string;
}

// ----------------- Multi-Warehouse & Inventory Movement Models -----------------

export interface Warehouse {
  id: number;
  tenant_id: number;
  code: string;
  name: string;
  type: 'raw_materials' | 'finished_goods' | 'wip' | 'quarantine' | 'subcontractor';
  location: string;
  address: string;
  capacity_m3: number;
  manager_name: string;
  is_active: boolean;
  stocks?: WarehouseStock[];
  created_at: string;
}

export interface WarehouseStock {
  id: number;
  warehouse_id: number;
  warehouse?: Warehouse;
  material_id: number;
  material?: Material;
  quantity: number;
  reserved_qty: number;
  min_stock: number;
  max_stock: number;
  last_stock_date: string;
}

export interface StockTransferItem {
  id: number;
  stock_transfer_id: number;
  material_id: number;
  material?: Material;
  requested_qty: number;
  transferred_qty: number;
  unit_cost: number;
}

export interface StockTransfer {
  id: number;
  tenant_id: number;
  transfer_number: string;
  from_warehouse_id: number;
  from_warehouse?: Warehouse;
  to_warehouse_id: number;
  to_warehouse?: Warehouse;
  transfer_date: string;
  driver_name: string;
  vehicle_number: string;
  notes?: string;
  status: 'draft' | 'in_transit' | 'completed' | 'cancelled';
  created_by: number;
  items?: StockTransferItem[];
  created_at: string;
}

export interface StockAdjustment {
  id: number;
  tenant_id: number;
  adjustment_number: string;
  warehouse_id: number;
  warehouse?: Warehouse;
  material_id: number;
  material?: Material;
  recorded_qty: number;
  counted_qty: number;
  discrepancy_qty: number;
  reason: 'damaged' | 'expired' | 'count_difference' | 'audit_adjustment';
  notes?: string;
  status: 'draft' | 'approved' | 'rejected';
  adjusted_by: number;
  created_at: string;
}

// ----------------- Automated MRP Net Requirements -----------------

export interface MRPNetRequirementItem {
  material_id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  demand_qty: number;
  inbound_qty: number;
  safety_stock: number;
  projected_stock: number;
  net_deficit: number;
  recommended_order: number;
  unit_cost: number;
  estimated_cost: number;
  preferred_vendor_id: number;
  preferred_vendor_name: string;
  lead_time_days: number;
  status: 'OK' | 'DEFICIT' | 'CRITICAL';
}

export interface MRPRunSummary {
  calculated_at: string;
  total_materials: number;
  deficit_materials: number;
  total_deficit_cost: number;
  items: MRPNetRequirementItem[];
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

// Multi-Company / Tenant Context Helper
export interface ActiveTenantContext {
  id: number;
  name: string;
  subdomain: string;
  company_code: string;
  plan: string;
}

export const AVAILABLE_ENTERPRISES: ActiveTenantContext[] = [
  { id: 1, name: 'PT Kayu KWAS Industri (HQ Jepara)', subdomain: 'kayukwas', company_code: 'KWAS-HQ', plan: 'Enterprise Pro' },
  { id: 2, name: 'PT Sinar Manufaktur Metal & Kayu', subdomain: 'sinar-mfg', company_code: 'SMM-02', plan: 'Manufacturing Plus' },
  { id: 3, name: 'CV Kreasi Furnitur Ekspor Nusantara', subdomain: 'kreasifurnitur', company_code: 'KFN-03', plan: 'Professional' },
  { id: 4, name: 'PT Multi Karya Komponen Presisi', subdomain: 'multikarya', company_code: 'MKK-04', plan: 'Enterprise Pro' },
];

export const getActiveTenant = (): ActiveTenantContext => {
  if (typeof window === 'undefined') {
    return AVAILABLE_ENTERPRISES[0];
  }
  const str = localStorage.getItem('kwas_active_tenant');
  if (!str) {
    localStorage.setItem('kwas_active_tenant', JSON.stringify(AVAILABLE_ENTERPRISES[0]));
    return AVAILABLE_ENTERPRISES[0];
  }
  try {
    return JSON.parse(str);
  } catch {
    return AVAILABLE_ENTERPRISES[0];
  }
};

export const setActiveTenant = (tenant: ActiveTenantContext) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kwas_active_tenant', JSON.stringify(tenant));
    window.dispatchEvent(new Event('tenant-changed'));
  }
};

// Token helper
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('kwas_token');
};

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kwas_token', token);
  }
};

export const clearToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('kwas_token');
    localStorage.removeItem('kwas_user');
  }
};

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('kwas_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('kwas_user', JSON.stringify(user));
  }
};

// Generic fetcher with Multi-Tenant Header injection
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getToken();
  const activeTenant = getActiveTenant();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(activeTenant ? { 'X-Tenant-ID': String(activeTenant.id) } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: 'Gagal terhubung ke server backend API',
      error: err.message,
    };
  }
}

// ----------------- MRP Endpoints & Lifecycle Helpers -----------------

export async function approveQuotation(id: number): Promise<ApiResponse<Quotation>> {
  return apiFetch<Quotation>(`/quotes/${id}/approve`, { method: 'PATCH' });
}

export async function rejectQuotation(id: number, reason?: string): Promise<ApiResponse<Quotation>> {
  return apiFetch<Quotation>(`/quotes/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export async function convertQuoteToSalesOrder(id: number): Promise<ApiResponse<SalesOrder>> {
  return apiFetch<SalesOrder>(`/quotes/${id}/convert-to-order`, { method: 'POST' });
}

export interface PublishSalesOrderPayload {
  planned_start: string;
  planned_end: string;
  priority?: string;
}

export async function publishSalesOrder(
  id: number,
  data: PublishSalesOrderPayload
): Promise<ApiResponse<{ order: SalesOrder; work_order: WorkOrder }>> {
  return apiFetch<{ order: SalesOrder; work_order: WorkOrder }>(`/orders/${id}/publish`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export interface ProcessWorkOrderPayload {
  start_date: string;
  deadline_date: string;
}

export async function processWorkOrder(
  id: number,
  data: ProcessWorkOrderPayload
): Promise<ApiResponse<{ work_order: WorkOrder; material_request: any }>> {
  return apiFetch<{ work_order: WorkOrder; material_request: any }>(`/work-orders/${id}/process`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function autoAllocateWorkOrderBatches(id: number): Promise<ApiResponse<any>> {
  return apiFetch<any>(`/work-orders/${id}/auto-allocate`, { method: 'POST' });
}

export async function createShortagePO(id: number, vendorId?: number): Promise<ApiResponse<PurchaseOrder>> {
  return apiFetch<PurchaseOrder>(`/work-orders/${id}/create-shortage-po`, {
    method: 'POST',
    body: JSON.stringify(vendorId ? { vendor_id: vendorId } : {}),
  });
}

export async function checkMaterialRequestStock(id: number): Promise<ApiResponse<any>> {
  return apiFetch<any>(`/material-requests/${id}/check-stock`, { method: 'PATCH' });
}

export async function allocateAndIssueMaterials(id: number): Promise<ApiResponse<any>> {
  return apiFetch<any>(`/material-requests/${id}/allocate-issue`, { method: 'PATCH' });
}

export interface MRPNetRequirement {
  material_id: number;
  material_name: string;
  category: string;
  unit: string;
  gross_demand: number;
  stock_on_hand: number;
  stock_allocated: number;
  stock_expected_po: number;
  safety_stock: number;
  net_shortage: number;
  status: 'IN_STOCK' | 'EXPECTED' | 'SHORTAGE';
  recommended_po_qty: number;
  preferred_vendor_id?: number;
  preferred_vendor_name?: string;
  estimated_cost: number;
}

export async function getMRPNetRequirements(
  tenantId?: number
): Promise<ApiResponse<{ requirements: MRPNetRequirement[]; total_shortage_items: number; total_estimated_po_cost: number }>> {
  return apiFetch<any>(`/mrp-engine/net-requirements${tenantId ? `?tenant_id=${tenantId}` : ''}`);
}

export async function batchGeneratePOsFromMRP(
  items: Array<{ material_id: number; vendor_id?: number; order_qty: number }>
): Promise<ApiResponse<any>> {
  return apiFetch<any>('/mrp-engine/batch-pos', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

// ----------------- Inbound Goods Receipt (GRN) -----------------

export interface GoodsReceiptItem {
  id: number;
  goods_receipt_id: number;
  purchase_order_item_id?: number;
  material_id: number;
  material?: Material;
  ordered_qty: number;
  received_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  unit_cost: number;
  batch_lot_number: string;
  batch_lot_id?: number;
  batch_lot?: MaterialBatchLot;
  moisture_content: number;
  qc_status: 'PASSED' | 'QUARANTINE' | 'REJECTED';
  wood_origin?: string;
  notes?: string;
  created_at: string;
}

export interface GoodsReceipt {
  id: number;
  tenant_id: number;
  receipt_number: string;
  purchase_order_id: number;
  purchase_order?: PurchaseOrder;
  warehouse_id: number;
  warehouse?: Warehouse;
  vendor_id: number;
  vendor?: Vendor;
  received_date: string;
  received_by_user_id: number;
  received_by_user?: User;
  vendor_delivery_note?: string;
  status: 'DRAFT' | 'RECEIVED' | 'INSPECTED' | 'CONFIRMED' | 'CANCELLED';
  notes?: string;
  items?: GoodsReceiptItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateGoodsReceiptPayload {
  tenant_id?: number;
  purchase_order_id: number;
  warehouse_id?: number;
  vendor_id?: number;
  received_date?: string;
  vendor_delivery_note?: string;
  notes?: string;
  items: Array<{
    purchase_order_item_id?: number;
    material_id: number;
    ordered_qty: number;
    received_qty: number;
    accepted_qty: number;
    rejected_qty?: number;
    unit_cost?: number;
    batch_lot_number?: string;
    moisture_content?: number;
    qc_status?: string;
    wood_origin?: string;
    notes?: string;
  }>;
}

export async function getGoodsReceipts(search?: string, status?: string): Promise<ApiResponse<{ goods_receipts: GoodsReceipt[]; total: number }>> {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (status) query.set('status', status);
  return apiFetch<{ goods_receipts: GoodsReceipt[]; total: number }>(`/goods-receipts?${query.toString()}`);
}

export async function getGoodsReceiptByID(id: number): Promise<ApiResponse<GoodsReceipt>> {
  return apiFetch<GoodsReceipt>(`/goods-receipts/${id}`);
}

export async function createGoodsReceipt(payload: CreateGoodsReceiptPayload): Promise<ApiResponse<GoodsReceipt>> {
  return apiFetch<GoodsReceipt>('/goods-receipts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function confirmGoodsReceipt(id: number): Promise<ApiResponse<GoodsReceipt>> {
  return apiFetch<GoodsReceipt>(`/goods-receipts/${id}/confirm`, {
    method: 'PATCH',
  });
}

// ----------------- Outbound Delivery Order (Surat Jalan) -----------------

export interface DeliveryOrderItem {
  id: number;
  delivery_order_id: number;
  sales_order_item_id?: number;
  product_id: number;
  product?: Product;
  ordered_qty: number;
  shipped_qty: number;
  notes?: string;
  created_at: string;
}

export interface DeliveryOrder {
  id: number;
  tenant_id: number;
  do_number: string;
  sales_order_id: number;
  sales_order?: SalesOrder;
  customer_id: number;
  customer?: Customer;
  warehouse_id: number;
  warehouse?: Warehouse;
  delivery_date: string;
  driver_name: string;
  vehicle_plate: string;
  expedition: string;
  tracking_number?: string;
  recipient_name: string;
  shipping_address: string;
  status: 'DRAFT' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shipped_at?: string;
  delivered_at?: string;
  notes?: string;
  items?: DeliveryOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateDeliveryOrderPayload {
  tenant_id?: number;
  sales_order_id: number;
  customer_id?: number;
  warehouse_id?: number;
  delivery_date?: string;
  driver_name: string;
  vehicle_plate: string;
  expedition: string;
  tracking_number?: string;
  recipient_name?: string;
  shipping_address?: string;
  notes?: string;
  items: Array<{
    sales_order_item_id?: number;
    product_id: number;
    ordered_qty: number;
    shipped_qty: number;
    notes?: string;
  }>;
}

export async function getDeliveryOrders(search?: string, status?: string): Promise<ApiResponse<{ delivery_orders: DeliveryOrder[]; total: number }>> {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (status) query.set('status', status);
  return apiFetch<{ delivery_orders: DeliveryOrder[]; total: number }>(`/delivery-orders?${query.toString()}`);
}

export async function getDeliveryOrderByID(id: number): Promise<ApiResponse<DeliveryOrder>> {
  return apiFetch<DeliveryOrder>(`/delivery-orders/${id}`);
}

export async function createDeliveryOrder(payload: CreateDeliveryOrderPayload): Promise<ApiResponse<DeliveryOrder>> {
  return apiFetch<DeliveryOrder>('/delivery-orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function shipDeliveryOrder(id: number): Promise<ApiResponse<DeliveryOrder>> {
  return apiFetch<DeliveryOrder>(`/delivery-orders/${id}/ship`, {
    method: 'PATCH',
  });
}

export async function deliverDeliveryOrder(id: number): Promise<ApiResponse<DeliveryOrder>> {
  return apiFetch<DeliveryOrder>(`/delivery-orders/${id}/deliver`, {
    method: 'PATCH',
  });
}

// ----------------- MTS Check & Finished Goods Put-Away -----------------

export interface MTSCheckItem {
  product_id: number;
  product_name: string;
  ordered_qty: number;
  in_stock_qty: number;
  reserved_qty: number;
  available_qty: number;
  is_mts_ready: boolean;
  shortage_qty: number;
}

export interface MTSAvailabilityResult {
  sales_order_id: number;
  order_number: string;
  all_items_ready: boolean;
  items: MTSCheckItem[];
}

export async function checkMTSAvailability(salesOrderId: number): Promise<ApiResponse<MTSAvailabilityResult>> {
  return apiFetch<MTSAvailabilityResult>(`/orders/${salesOrderId}/mts-check`);
}

export async function putAwayFinishedGoods(workOrderId: number, warehouseId?: number, quantity?: number): Promise<ApiResponse<any>> {
  return apiFetch<any>(`/work-orders/${workOrderId}/put-away`, {
    method: 'POST',
    body: JSON.stringify({ warehouse_id: warehouseId, quantity }),
  });
}

// ----------------- Job Costing Variance -----------------

export interface CostElementBreakdown {
  category: string;
  standard_cost: number;
  actual_cost: number;
  variance: number;
  variance_pct: number;
}

export interface JobCostVarianceResult {
  work_order_id: number;
  spk_number: string;
  product_id: number;
  product_name: string;
  target_qty: number;
  total_standard_cost: number;
  total_actual_cost: number;
  total_variance: number;
  total_variance_pct: number;
  is_favorable: boolean;
  breakdown: CostElementBreakdown[];
  analyzed_at: string;
}

export async function getJobCostVariance(workOrderId: number): Promise<ApiResponse<JobCostVarianceResult>> {
  return apiFetch<JobCostVarianceResult>(`/work-orders/${workOrderId}/cost-variance`);
}


