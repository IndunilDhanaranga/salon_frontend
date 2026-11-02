"use client";
import { useEffect, useRef, useState } from "react";
import { Printer, X } from "lucide-react";
import type { Order, Tenant } from "@/lib/types";
import { message, money } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";

export function ReceiptDialog({
  order,
  tenant,
  canManage,
  onClose,
  onPaid,
}: {
  order: Order;
  tenant: Tenant;
  canManage: boolean;
  onClose: () => void;
  onPaid: (method: string) => Promise<void>;
}) {
  const { t, language } = useTranslation();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    document.body.classList.add("receipt-modal-open");
    return () => {
      node?.close();
      document.body.classList.remove("receipt-modal-open");
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="form-dialog receipt-dialog"
      aria-labelledby="receipt-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="dialog-header no-print">
        <span className="eyebrow">{t.billing.customerBill}</span>
        <button
          className="icon-button"
          aria-label={t.common.close}
          disabled={busy}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <article className="receipt">
        <div className="receipt-heading">
          <h2 id="receipt-title">{tenant.name}</h2>
          <p>{order.number}</p>
        </div>
        <div className="receipt-meta">
          <div>
            <span className="small-caps">{t.billing.billTo}</span>
            <strong>{order.customer_name}</strong>
          </div>
          <div>
            <span className="small-caps">{t.billing.date}</span>
            <span>
              {new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en", {
                timeZone: tenant.timezone,
                dateStyle: "medium",
              }).format(new Date(order.created_at))}
            </span>
          </div>
          {order.staff_name && (
            <div>
              <span className="small-caps">{t.billing.servedBy}</span>
              <strong>{order.staff_name}</strong>
            </div>
          )}
        </div>
        <table>
          <thead>
            <tr>
              <th>{t.catalog.item}</th>
              <th>{t.billing.quantity}</th>
              <th>{t.appointments.amount}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                  <span className="cell-sub">
                    {money(item.unit_price_minor, tenant.currency)} {language === "si" ? "බැගින්" : "each"}
                  </span>
                </td>
                <td>{item.quantity}</td>
                <td>{money(item.total_minor, tenant.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bill-total">
          <span>{t.billing.total} ({tenant.currency})</span>
          <strong>{money(order.total_minor, tenant.currency)}</strong>
        </div>
        <div className="receipt-payment">
          <span
            className={`status ${order.status === "paid" ? "completed" : "booked"}`}
          >
            {order.status === "paid" ? t.billing.paid : t.billing.unpaid}
          </span>
          {order.payment_method && (
            <span className="capitalize">{order.payment_method}</span>
          )}
        </div>
        <p className="receipt-thanks">
          {t.billing.thankYou}
        </p>
      </article>
      <div className="no-print">
        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
        {order.status === "unpaid" && canManage && (
          <form
            className="receipt-pay-form"
            onSubmit={(event) => {
              event.preventDefault();
              const method = String(
                new FormData(event.currentTarget).get("method"),
              );
              setBusy(true);
              setError("");
              void onPaid(method)
                .catch((err) => setError(message(err)))
                .finally(() => setBusy(false));
            }}
          >
            <label>
              {t.billing.paymentMethod}
              <select name="method">
                <option value="cash">{t.billing.cash}</option>
                <option value="card">{t.billing.card}</option>
                <option value="other">Other</option>
              </select>
            </label>
            <button className="button primary" disabled={busy}>
              {busy ? t.common.loading : t.billing.markAsPaid}
            </button>
          </form>
        )}
        <div className="dialog-actions">
          <button className="button secondary" onClick={() => window.print()}>
            <Printer size={16} />
            {t.billing.printReceipt}
          </button>
        </div>
      </div>
    </dialog>
  );
}
