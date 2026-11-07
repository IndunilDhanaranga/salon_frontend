import { api } from "@/lib/api";
import type {
  ListResponse,
  Appointment,
  Staff,
  CatalogItem,
  Order,
  PayrollRun,
  Deduction,
  DeductionListResponse,
  DeductionOptionsResponse,
  BusinessReportResponse,
  BranchesResponse,
  AccessResponse,
  SubscriptionResponse,
} from "@/lib/types";

export const businessService = {
  fetchDashboard(tenant: string, branch?: string, signal?: AbortSignal) {
    return api<unknown>("dashboard", { tenant, branch, signal });
  },

  fetchAppointments(tenant: string, branch?: string, signal?: AbortSignal) {
    return api<ListResponse<Appointment>>("appointments", {
      tenant,
      branch,
      signal,
    });
  },

  createAppointment(
    tenant: string,
    branch: string | undefined,
    body: Partial<Appointment>,
  ) {
    return api("appointments", {
      method: "POST",
      tenant,
      branch,
      body,
    });
  },

  updateAppointment(
    tenant: string,
    branch: string | undefined,
    id: string,
    body: Partial<Appointment>,
  ) {
    return api(`appointments/${id}`, {
      method: "PATCH",
      tenant,
      branch,
      body,
    });
  },

  fetchStaff(tenant: string, branch?: string, signal?: AbortSignal) {
    return api<{ data: Staff[]; booking_staff?: Staff[] }>("staff", {
      tenant,
      branch,
      signal,
    });
  },

  createStaff(
    tenant: string,
    branch: string | undefined,
    body: Partial<Staff>,
  ) {
    return api("staff", {
      method: "POST",
      tenant,
      branch,
      body,
    });
  },

  updateStaff(
    tenant: string,
    branch: string | undefined,
    id: string,
    body: Partial<Staff>,
  ) {
    return api(`staff/${id}`, {
      method: "PATCH",
      tenant,
      branch,
      body,
    });
  },

  fetchCatalog(tenant: string, branch?: string, signal?: AbortSignal) {
    return api<ListResponse<CatalogItem>>("catalog", {
      tenant,
      branch,
      signal,
    });
  },

  createCatalogItem(
    tenant: string,
    branch: string | undefined,
    body: Partial<CatalogItem>,
  ) {
    return api("catalog", {
      method: "POST",
      tenant,
      branch,
      body,
    });
  },

  updateCatalogItem(
    tenant: string,
    branch: string | undefined,
    id: string,
    body: Partial<CatalogItem>,
  ) {
    return api(`catalog/${id}`, {
      method: "PATCH",
      tenant,
      branch,
      body,
    });
  },

  fetchOrders(
    tenant: string,
    branch?: string,
    params?: Record<string, string>,
    signal?: AbortSignal,
  ) {
    return api<ListResponse<Order>>("orders", {
      tenant,
      branch,
      params,
      signal,
    });
  },

  createOrder(tenant: string, branch: string | undefined, body: unknown) {
    return api<Order>("orders", {
      method: "POST",
      tenant,
      branch,
      body,
    });
  },

  updateOrder(
    tenant: string,
    branch: string | undefined,
    id: string,
    body: unknown,
  ) {
    return api(`orders/${id}`, {
      method: "PATCH",
      tenant,
      branch,
      body,
    });
  },

  fetchPayroll(tenant: string, signal?: AbortSignal) {
    return api<ListResponse<PayrollRun>>("payroll", { tenant, signal });
  },

  generatePayroll(tenant: string, body: unknown) {
    return api("payroll", {
      method: "POST",
      tenant,
      body,
    });
  },

  fetchDeductions(
    tenant: string,
    branch?: string,
    params?: Record<string, string>,
    signal?: AbortSignal,
  ) {
    return api<DeductionListResponse>("deductions", {
      tenant,
      branch,
      params,
      signal,
    });
  },

  fetchDeductionOptions(tenant: string, branch?: string, signal?: AbortSignal) {
    return api<DeductionOptionsResponse>("deduction-options", {
      tenant,
      branch,
      signal,
    });
  },

  createDeduction(
    tenant: string,
    branch: string | undefined,
    body: Partial<Deduction>,
  ) {
    return api("deductions", {
      method: "POST",
      tenant,
      branch,
      body,
    });
  },

  deleteDeduction(tenant: string, branch: string | undefined, id: string) {
    return api(`deductions/${id}`, {
      method: "DELETE",
      tenant,
      branch,
    });
  },

  fetchReports(
    tenant: string,
    branch?: string,
    params?: Record<string, string>,
    signal?: AbortSignal,
  ) {
    return api<BusinessReportResponse>("reports", {
      tenant,
      branch,
      params,
      signal,
    });
  },

  fetchBranches(tenant: string, signal?: AbortSignal) {
    return api<BranchesResponse>("branches", { tenant, signal });
  },

  createBranch(tenant: string, body: unknown) {
    return api("branches", {
      method: "POST",
      tenant,
      body,
    });
  },

  updateBranch(tenant: string, id: string, body: unknown) {
    return api(`branches/${id}`, {
      method: "PATCH",
      tenant,
      body,
    });
  },

  deleteBranch(tenant: string, id: string) {
    return api(`branches/${id}`, {
      method: "DELETE",
      tenant,
    });
  },

  fetchAccess(tenant: string, signal?: AbortSignal) {
    return api<AccessResponse>("access", { tenant, signal });
  },

  fetchSubscription(tenant: string, signal?: AbortSignal) {
    return api<SubscriptionResponse>("subscription", { tenant, signal });
  },
};
