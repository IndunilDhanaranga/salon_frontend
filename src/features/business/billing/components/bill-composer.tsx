"use client";

import { useState } from "react";
import { X, Receipt } from "lucide-react";
import { useBranchApi } from "@/features/workspace/branch-context";
import type { CatalogItem, Order, Tenant } from "@/lib/types";
import { message, money } from "@/lib/format";
import { PosCatalogPicker } from "../pos-catalog-picker";
import { BillLines } from "./bill-lines";
import { useTranslation } from "@/lib/i18n";

export function BillComposer({
  tenant,
  catalog,
  staff = [],
  defaultStaffId = "",
  canAssignStaff = true,
  onSaved,
  onClose,
}: {
  tenant: Tenant;
  catalog: CatalogItem[];
  staff?: { id: string; name: string; job_title: string }[];
  defaultStaffId?: string | null;
  canAssignStaff?: boolean;
  onSaved: (order: Order) => Promise<void>;
  onClose: () => void;
}) {
  const api = useBranchApi();
  const { t, language } = useTranslation();
  const [lines, setLines] = useState<{ id: string; quantity: number }[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState(defaultStaffId || "");
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const total = lines.reduce(
    (sum, line) =>
      sum +
      (catalog.find((item) => item.id === line.id)?.price_minor || 0) *
        line.quantity,
    0,
  );
  async function save(form: FormData) {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ data: Order }>("orders", {
        method: "POST",
        tenant: tenant.slug,
        body: {
          customer_name: form.get("customer_name"),
          staff_id: canAssignStaff ? selectedStaffId || undefined : undefined,
          items: lines.map((line) => ({
            catalog_item_id: line.id,
            quantity: line.quantity,
          })),
          status: paid ? "paid" : "unpaid",
          payment_method: paid ? form.get("payment_method") : null,
        },
      });
      await onSaved(result.data);
      onClose();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel bill-composer">
      <div className="section-heading">
        <div>
          <h2>{t.billing.newCustomerBill}</h2>
          <p>{t.billing.subtitle}</p>
        </div>
        <button
          className="icon-button"
          disabled={busy}
          aria-label={t.common.close}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save(new FormData(event.currentTarget));
        }}
      >
        <div className="form-grid">
          <label>
            {t.billing.customerName}
            <input
              name="customer_name"
              required
              maxLength={120}
              autoFocus
              placeholder={t.billing.customerName}
            />
          </label>
          {canAssignStaff && staff.length > 0 && (
            <label>
              {t.billing.assignedStaff}
              <select
                name="staff_id"
                value={selectedStaffId}
                onChange={(event) => setSelectedStaffId(event.target.value)}
              >
                <option value="">{t.forms.selectTeamMember}</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.job_title})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <PosCatalogPicker
          items={catalog}
          currency={tenant.currency}
          disabled={busy}
          onAdd={(id) => {
            if (!lines.some((line) => line.id === id) && lines.length >= 100) {
              setError("A bill can contain at most 100 different items.");
              return;
            }
            setLines((current) =>
              current.some((line) => line.id === id)
                ? current.map((line) =>
                    line.id === id
                      ? { ...line, quantity: Math.min(1000, line.quantity + 1) }
                      : line,
                  )
                : [...current, { id, quantity: 1 }],
            );
          }}
        />
        <BillLines
          lines={lines}
          catalog={catalog}
          currency={tenant.currency}
          busy={busy}
          onQuantity={(id, quantity) =>
            setLines((current) =>
              current.map((line) =>
                line.id === id ? { ...line, quantity } : line,
              ),
            )
          }
          onRemove={(id) =>
            setLines((current) => current.filter((line) => line.id !== id))
          }
        />
        <div className="bill-total">
          <span>
            {t.billing.total} ({tenant.currency})
          </span>
          <strong>{money(total, tenant.currency)}</strong>
        </div>
        <div className="form-grid">
          <label>
            {t.billing.status}
            <select
              value={paid ? "paid" : "unpaid"}
              onChange={(event) => setPaid(event.target.value === "paid")}
            >
              <option value="unpaid">{t.billing.unpaid}</option>
              <option value="paid">{t.billing.paid}</option>
            </select>
          </label>
          {paid && (
            <label>
              {t.billing.paymentMethod}
              <select name="payment_method" required>
                <option value="cash">{t.billing.cash}</option>
                <option value="card">{t.billing.card}</option>
                <option value="other">Other</option>
              </select>
            </label>
          )}
        </div>
        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions pos-checkout">
          <span className="pos-checkout-total">
            {lines.reduce((count, line) => count + line.quantity, 0)}{" "}
            {language === "si" ? "අයිතම" : "items"} ·{" "}
            {money(total, tenant.currency)}
          </span>
          <button className="button primary" disabled={busy || !lines.length}>
            <Receipt size={17} />
            {busy ? t.common.loading : t.billing.recordBill}
          </button>
        </div>
      </form>
    </section>
  );
}
