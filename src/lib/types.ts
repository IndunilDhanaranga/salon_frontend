export interface User {
  id: string;
  name: string;
  email: string;
  is_platform_admin: boolean;
  platform_role?: string;
  platform_role_id?: string | null;
  platform_permissions?: string[];
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  storage_mode: "shared" | "dedicated";
  status: "active" | "suspended";
  role: string;
  permissions: string[];
  subscription: Subscription | null;
}

export type SubscriptionFeature =
  "staff" | "appointments" | "catalog" | "orders" | "payroll";
export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_minor: number;
  currency: string;
  billing_interval: "month" | "year";
  active: boolean;
  features: string[];
}
export interface Subscription {
  id: string;
  tenant_id: string;
  status: "trialing" | "active" | "cancelled" | "expired";
  plan_id: string | null;
  plan_name: string;
  price_minor: number;
  currency: string;
  billing_interval: "month" | "year";
  features: string[];
  trial_starts_at: string;
  trial_ends_at: string;
  current_period_start: string;
  current_period_end: string;
  cancelled_at: string | null;
  access_allowed: boolean;
  days_remaining: number;
}
export interface SubscriptionResponse {
  data: Subscription;
  plans: Plan[];
}
export interface AdminPlansResponse {
  data: Plan[];
  features: { key: string; label: string }[];
}

export interface TenantRole {
  id: string;
  name: string;
  permissions: string[];
  is_owner: boolean;
}

export interface TenantMember {
  id: string;
  user: Pick<User, "id" | "name" | "email">;
  role_id: string;
  role: string;
}

export interface Permission {
  key: string;
  label: string;
}

export interface AccessResponse {
  roles: TenantRole[];
  members: TenantMember[];
  permissions: Permission[];
}

export interface PlatformTenant {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  storage_mode: "shared" | "dedicated";
  status: "active" | "suspended";
  owner_email: string | null;
  subscription: Subscription | null;
}

export interface PlatformDashboard {
  metrics: {
    businesses: number;
    active_businesses: number;
    users: number;
    active_paid_subscriptions?: number;
    active_trials?: number;
    mrr_minor?: number;
  };
  tenants: PlatformTenant[];
  users: User[];
}

export interface PlatformRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_super_admin: boolean;
  users_count?: number;
  created_at?: string;
}

export interface PlatformAccessResponse {
  roles: PlatformRole[];
  permissions: { key: string; label: string }[];
  admins: User[];
}

export interface PlatformReportsResponse {
  financials: {
    mrr_minor: number;
    arr_minor: number;
    total_gmv_minor: number;
    currency: string;
  };
  subscriptions: {
    total: number;
    by_status: Record<string, number>;
    by_plan: Record<string, number>;
    expiring_trials: {
      id: string;
      name: string;
      slug: string;
      currency: string;
      subscription: Subscription | null;
    }[];
  };
  growth: {
    total_businesses: number;
    active_businesses: number;
    suspended_businesses: number;
    new_last_30_days: number;
    total_users: number;
  };
  ecosystem: {
    total_orders: number;
    total_appointments: number;
    completed_appointments: number;
    total_staff: number;
  };
}

export interface SubscriptionChangeLog {
  id: string;
  tenant_id: string;
  subscription_id: string;
  actor_id: string | null;
  actor_name?: string | null;
  actor_email?: string | null;
  action: string;
  snapshot: string | Record<string, unknown>;
  created_at: string;
}

export interface AdminTenantSubscriptionResponse {
  data: Subscription;
  plans: Plan[];
  history?: SubscriptionChangeLog[];
}

/** Tokens stay in an HttpOnly cookie and are never part of this browser contract. */
export interface SessionResponse {
  user: User;
  tenants: Tenant[];
  expires_at?: string;
}

export type AuthResponse = SessionResponse;
export type Session = SessionResponse;

export interface Collection<T> {
  data: T[];
}

export type ListResponse<T> = Collection<T>;

export interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  job_title: string;
  base_salary_minor: number;
  commission_bps: number;
  active: boolean;
  user_id?: string | null;
}

export type Staff = StaffMember;

export type BookingStaff = Pick<
  StaffMember,
  "id" | "name" | "job_title" | "active"
>;
export type DeductionType = "business" | "staff_advance";

export interface Deduction {
  id: string;
  tenant_id: string;
  type: DeductionType;
  category: string;
  staff_id: string | null;
  staff_name: string | null;
  amount_minor: number;
  currency: string;
  date: string;
  payment_method: string;
  notes: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeductionSummary {
  total_business_minor: number;
  total_staff_advance_minor: number;
  total_minor: number;
  count: number;
}

export interface DeductionListResponse {
  data: Deduction[];
  summary: DeductionSummary;
}

export interface DeductionOptionsResponse {
  staff: { id: string; name: string; job_title: string }[];
  categories: { key: string; label: string }[];
}

export interface AppointmentOptions {
  staff: BookingStaff[];
}

export interface OrderOptionsResponse {
  staff: Pick<StaffMember, "id" | "name" | "job_title" | "commission_bps">[];
  current_staff_id?: string | null;
  can_assign_staff?: boolean;
}

export type AppointmentStatus = "booked" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  staff_id: string;
  staff_name: string;
  customer_name: string;
  service_name: string;
  starts_at: string;
  ends_at: string;
  price_minor: number;
  status: AppointmentStatus;
}

export interface PayrollItem {
  id: string;
  staff_id: string;
  staff_name: string;
  base_salary_minor: number;
  commission_minor: number;
  allowance_minor: number;
  deduction_minor: number;
  net_minor: number;
}

export interface PayrollRun {
  id: string;
  period_start: string;
  period_end: string;
  status: "draft";
  total_minor: number;
  items: PayrollItem[];
}

export type BusinessHealthStatus = "growth" | "loss" | "break_even" | "neutral";

export interface BusinessPosition {
  status: BusinessHealthStatus;
  month_revenue_minor: number;
  month_deductions_minor: number;
  month_business_expenses_minor: number;
  month_staff_advances_minor: number;
  month_estimated_staff_cost_minor: number;
  month_total_operating_costs_minor: number;
  month_net_margin_minor: number;
  month_net_margin_percentage: number;
  today_revenue_minor: number;
  today_deductions_minor: number;
  today_business_expenses_minor: number;
  today_staff_advances_minor: number;
  today_net_minor: number;
  today_status: "growth" | "loss" | "neutral";
}

export interface DashboardDeductionsSummary {
  today_total_minor: number;
  today_business_minor: number;
  today_staff_advance_minor: number;
  today_count: number;
  month_total_minor: number;
  month_business_minor: number;
  month_staff_advance_minor: number;
  month_count: number;
}

export interface Dashboard {
  tenant: Tenant;
  date: string;
  metrics: {
    appointments_today: number;
    completed_today: number;
    revenue_today_minor: number;
    active_staff: number;
    deductions_today_minor?: number;
    deductions_month_minor?: number;
    net_today_minor?: number;
    business_status?: BusinessHealthStatus;
  };
  business_position?: BusinessPosition | null;
  deductions_summary?: DashboardDeductionsSummary | null;
  appointments: Appointment[];
  staff: StaffMember[];
}

export interface CatalogItem {
  id: string;
  type: "service" | "product";
  name: string;
  price_minor: number;
  active: boolean;
}

export interface OrderItem {
  id: string;
  catalog_item_id: string;
  name: string;
  type: "service" | "product";
  quantity: number;
  unit_price_minor: number;
  total_minor: number;
}

export type PaymentMethod = "cash" | "card" | "other";

export interface Order {
  id: string;
  number: string;
  customer_name: string;
  status: "unpaid" | "paid";
  payment_method: PaymentMethod | null;
  subtotal_minor: number;
  total_minor: number;
  staff_id?: string | null;
  staff_name?: string | null;
  commission_bps?: number;
  commission_minor?: number;
  created_at: string;
  paid_at: string | null;
  items: OrderItem[];
}

export interface BusinessReportResponse {
  meta: {
    range: string;
    start_date: string;
    end_date: string;
    timezone: string;
    currency: string;
  };
  sales: {
    gross_revenue_minor: number;
    unpaid_revenue_minor: number;
    total_orders: number;
    paid_orders: number;
    unpaid_orders: number;
    avg_ticket_minor: number;
    total_commission_minor: number;
    payment_methods: {
      cash: { count: number; total_minor: number; percentage: number };
      card: { count: number; total_minor: number; percentage: number };
      other: { count: number; total_minor: number; percentage: number };
    };
    daily_trend: {
      date: string;
      total_minor: number;
      orders_count: number;
      cash_minor: number;
      card_minor: number;
      other_minor: number;
    }[];
  };
  staff: {
    id: string;
    name: string;
    job_title: string;
    active: boolean;
    commission_rate: number;
    orders_count: number;
    appointments_count: number;
    completed_appointments: number;
    revenue_minor: number;
    commission_minor: number;
    avg_bill_minor: number;
    contribution_percentage: number;
  }[];
  catalog: {
    total_items_sold: number;
    service_revenue_minor: number;
    product_revenue_minor: number;
    service_share: number;
    product_share: number;
    items: {
      name: string;
      type: "service" | "product";
      quantity: number;
      total_minor: number;
      unit_price_minor: number;
      share_percentage: number;
    }[];
  };
  appointments: {
    total_appointments: number;
    completed: number;
    cancelled: number;
    booked: number;
    completion_rate: number;
    cancellation_rate: number;
    unique_clients: number;
    time_distribution: {
      morning: { count: number; percentage: number };
      afternoon: { count: number; percentage: number };
      evening: { count: number; percentage: number };
    };
    day_distribution: Record<string, number>;
  };
  financial: {
    gross_revenue_minor: number;
    commissions_expense_minor: number;
    estimated_base_salary_expense_minor: number;
    total_staff_cost_minor: number;
    daily_deductions_expense_minor?: number;
    staff_advances_total_minor?: number;
    total_operating_costs_minor?: number;
    net_margin_minor: number;
    net_margin_percentage: number;
  };
}
