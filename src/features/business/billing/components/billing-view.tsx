"use client";
import { canPermission } from "@/lib/access";

import { useCallback, useEffect, useState } from "react";
import { Plus, Receipt } from "lucide-react";
import { useBranchApi } from "@/features/business/branches/branch-context";
import type {
  CatalogItem,
  ListResponse,
  Order,
  OrderOptionsResponse,
  Tenant,
} from "@/lib/types";
import { message, money } from "@/lib/format";
import { BillComposer } from "./bill-composer";
import { ReceiptDialog } from "./receipt-dialog";
import { BillingCards } from "./billing-cards";
import { useTranslation } from "@/lib/i18n";
import type { View } from "../../config/navigation";

export function BillingView({
  tenant,
  onView,
}: {
  tenant: Tenant;
  onView?: (view: View) => void;
}) {
  const api = useBranchApi();
  const { t, language } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [staffOptions, setStaffOptions] = useState<OrderOptionsResponse>({
    staff: [],
    current_staff_id: null,
  });
  const [compose, setCompose] = useState(false);
  const [receipt, setReceipt] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const [bills, items, options] = await Promise.all([
      api<ListResponse<Order>>("orders", { tenant: tenant.slug }),
      canPermission(tenant, "catalog.view")
        ? api<ListResponse<CatalogItem>>("catalog", { tenant: tenant.slug })
        : Promise.resolve({ data: [] }),
      canPermission(tenant, "orders.manage")
        ? api<OrderOptionsResponse>("order-options", {
            tenant: tenant.slug,
          }).catch(() => ({ staff: [], current_staff_id: null }))
        : Promise.resolve({ staff: [], current_staff_id: null }),
    ]);
    setOrders(bills.data);
    setCatalog(items.data);
    setStaffOptions(options);
  }, [tenant.slug, tenant.permissions]);
  useEffect(() => {
    void load()
      .catch((err) => setError(message(err)))
      .finally(() => setLoading(false));
  }, [load]);
  const canManage = canPermission(tenant, "orders.manage");
  const canAssignStaff =
    canPermission(tenant, "orders.assign_staff") ||
    staffOptions.can_assign_staff === true;
  return (
    <div className="billing-content">
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      {compose && (
        <BillComposer
          tenant={tenant}
          catalog={catalog}
          staff={staffOptions.staff}
          defaultStaffId={staffOptions.current_staff_id}
          canAssignStaff={canAssignStaff}
          onClose={() => setCompose(false)}
          onSaved={async (order) => {
            setReceipt(order);
            await load().catch((error) =>
              setError("Bill created. " + message(error)),
            );
          }}
        />
      )}
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>{t.billing.title}</h2>
            <p>{t.billing.subtitle}</p>
          </div>
          {canManage && canPermission(tenant, "catalog.view") && (
            <button
              className="button primary small-button"
              disabled={busy}
              onClick={() => {
                if (onView) {
                  onView("pos");
                } else {
                  setCompose(true);
                }
              }}
            >
              <Plus size={16} />
              {t.billing.newBill}
            </button>
          )}
        </div>
        {loading ? (
          <p className="loading-line">{t.billing.loadingBills}</p>
        ) : !orders.length ? (
          <div className="empty-state">
            <Receipt size={29} />
            <h3>{t.billing.emptyTitle}</h3>
            <p>{t.billing.emptyDesc}</p>
          </div>
        ) : (
          <>
            <BillingCards
              orders={orders}
              tenant={tenant}
              onReceipt={setReceipt}
            />
            <div className="table-scroll desktop-record-table">
              <table>
                <thead>
                  <tr>
                    <th>{t.billing.bill}</th>
                    <th>{t.billing.customer}</th>
                    <th>{t.billing.date}</th>
                    <th>{t.billing.total}</th>
                    <th>{t.billing.status}</th>
                    <th>{t.billing.receipt}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.number}</strong>
                        <span className="cell-sub">
                          {order.items.length}{" "}
                          {language === "si" ? "අයිතම" : "items"}
                        </span>
                      </td>
                      <td>
                        <strong>{order.customer_name}</strong>
                        {order.staff_name && (
                          <span className="cell-sub">
                            {language === "si" ? "සේවය කළේ: " : "By "}
                            {order.staff_name}
                          </span>
                        )}
                      </td>
                      <td>
                        {new Intl.DateTimeFormat(
                          language === "si" ? "si-LK" : "en",
                          {
                            timeZone: tenant.timezone,
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        ).format(new Date(order.created_at))}
                      </td>
                      <td className="money-label">
                        {money(order.total_minor, tenant.currency)}
                      </td>
                      <td>
                        <span
                          className={`status ${order.status === "paid" ? "completed" : "booked"}`}
                        >
                          {order.status === "paid"
                            ? t.billing.paid
                            : t.billing.unpaid}
                        </span>
                      </td>
                      <td>
                        <button
                          className="text-button"
                          onClick={() => setReceipt(order)}
                        >
                          <Receipt size={15} />
                          {t.billing.viewReceipt}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
      {receipt && (
        <ReceiptDialog
          order={receipt}
          tenant={tenant}
          canManage={canManage}
          onClose={() => setReceipt(null)}
          onPaid={async (method) => {
            setBusy(true);
            setError("");
            try {
              const result = await api<{ data: Order }>(
                `orders/${receipt.id}`,
                {
                  method: "PATCH",
                  tenant: tenant.slug,
                  body: { status: "paid", payment_method: method },
                },
              );
              setReceipt(result.data);
              await load();
            } catch (err) {
              setError(message(err));
              throw err;
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}
