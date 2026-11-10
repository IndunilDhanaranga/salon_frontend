"use client";

import { useCallback, useEffect, useState } from "react";
import { Receipt, ShoppingBag } from "lucide-react";
import { useBranchApi } from "@/features/business/branches/branch-context";
import type {
  CatalogItem,
  ListResponse,
  Order,
  OrderOptionsResponse,
  Tenant,
} from "@/lib/types";
import { canPermission } from "@/lib/access";
import { message } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { BillComposer } from "./bill-composer";
import { ReceiptDialog } from "./receipt-dialog";
import type { View } from "../../config/navigation";

export function PosView({
  tenant,
  onView,
}: {
  tenant: Tenant;
  onView?: (view: View) => void;
}) {
  const api = useBranchApi();
  const { t } = useTranslation();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [staffOptions, setStaffOptions] = useState<OrderOptionsResponse>({
    staff: [],
    current_staff_id: null,
  });
  const [receipt, setReceipt] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [composerKey, setComposerKey] = useState(0);

  const canManage = canPermission(tenant, "orders.manage");
  const canAssignStaff =
    canPermission(tenant, "orders.assign_staff") ||
    staffOptions.can_assign_staff === true;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [items, options] = await Promise.all([
        canPermission(tenant, "catalog.view")
          ? api<ListResponse<CatalogItem>>("catalog", { tenant: tenant.slug })
          : Promise.resolve({ data: [] }),
        canPermission(tenant, "orders.manage")
          ? api<OrderOptionsResponse>("order-options", {
              tenant: tenant.slug,
            }).catch(() => ({ staff: [], current_staff_id: null }))
          : Promise.resolve({ staff: [], current_staff_id: null }),
      ]);
      setCatalog(items.data);
      setStaffOptions(options);
    } catch (err) {
      setError(message(err));
    } finally {
      setLoading(false);
    }
  }, [tenant.slug, tenant.permissions]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="pos-content">
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="loading-line">{t.common.loading}</p>
      ) : !catalog.length ? (
        <div className="empty-state panel">
          <ShoppingBag size={32} />
          <h3>{t.catalog.emptyTitle || "No services or products available"}</h3>
          <p>
            {t.catalog.subtitle ||
              "Please add services or products in the catalog before creating a customer bill."}
          </p>
          {onView && canPermission(tenant, "catalog.view") && (
            <button
              type="button"
              className="button primary small-button"
              onClick={() => onView("catalog")}
              style={{ marginTop: 12 }}
            >
              {t.nav.catalog || "Go to Catalog"}
            </button>
          )}
        </div>
      ) : (
        <BillComposer
          key={composerKey}
          tenant={tenant}
          catalog={catalog}
          staff={staffOptions.staff}
          defaultStaffId={staffOptions.current_staff_id}
          canAssignStaff={canAssignStaff}
          onClose={onView ? () => onView("billing") : undefined}
          onViewBills={onView ? () => onView("billing") : undefined}
          onSaved={async (order) => {
            setReceipt(order);
            setComposerKey((k) => k + 1);
          }}
        />
      )}

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
