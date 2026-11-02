"use client";
import { Receipt } from "lucide-react";
import type { Order, Tenant } from "@/lib/types";
import { money } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";

export function BillingCards({
  orders,
  tenant,
  onReceipt,
}: {
  orders: Order[];
  tenant: Tenant;
  onReceipt: (order: Order) => void;
}) {
  const { t, language } = useTranslation();
  return (
    <div className="mobile-records" aria-label={t.billing.title}>
      {orders.map((order) => (
        <article key={order.id} className="mobile-record">
          <div className="mobile-record-heading">
            <strong>{order.number}</strong>
            <span
              className={
                "status " + (order.status === "paid" ? "completed" : "booked")
              }
            >
              {order.status === "paid" ? t.billing.paid : t.billing.unpaid}
            </span>
          </div>
          <h3>{order.customer_name}</h3>
          <p>
            {order.staff_name ? `${order.staff_name} · ` : ""}
            {new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en", {
              timeZone: tenant.timezone,
              dateStyle: "medium",
            }).format(new Date(order.created_at))}{" "}
            · {order.items.length} {language === "si" ? "අයිතම" : "items"}
          </p>
          <div className="mobile-record-meta">
            <strong>{money(order.total_minor, tenant.currency)}</strong>
            <button
              className="button secondary small-button"
              onClick={() => onReceipt(order)}
            >
              <Receipt size={16} />
              {t.billing.viewReceipt}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
