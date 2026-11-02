"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import type { AdminPlansResponse, Plan } from "@/lib/types";
import { AdminDialog } from "./admin-dialog";
import type { PlanValues } from "../types";

export function PlanFormDialog({
  plan,
  catalog,
  busy,
  onClose,
  onSave,
}: {
  plan: Plan | null;
  catalog: AdminPlansResponse;
  busy: boolean;
  onClose: () => void;
  onSave: (values: PlanValues, id?: string) => Promise<unknown>;
}) {
  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  // Price in main currency unit for easier input (e.g., 5000)
  const [priceMajor, setPriceMajor] = useState(
    plan ? (plan.price_minor / 100).toString() : "5000",
  );
  const [currency, setCurrency] = useState(plan?.currency ?? "LKR");
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    plan?.billing_interval ?? "month",
  );
  const [features, setFeatures] = useState<string[]>(
    plan?.features ?? ["staff", "appointments", "catalog", "orders", "payroll"],
  );
  const [error, setError] = useState("");

  function toggleFeature(key: string) {
    setFeatures((prev) => {
      const exists = prev.includes(key);
      let updated: string[];
      if (exists) {
        // If unchecking catalog, also uncheck orders
        if (key === "catalog") {
          updated = prev.filter((f) => f !== "catalog" && f !== "orders");
        } else {
          updated = prev.filter((f) => f !== key);
        }
      } else {
        // If checking orders, also ensure catalog is checked
        if (key === "orders" && !prev.includes("catalog")) {
          updated = [...prev, "catalog", "orders"];
        } else {
          updated = [...prev, key];
        }
      }
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsedPrice = parseFloat(priceMajor);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Please provide a valid price (greater than or equal to 0).");
      return;
    }

    const price_minor = Math.round(parsedPrice * 100);

    try {
      await onSave(
        {
          name: name.trim(),
          description: description.trim() || null,
          price_minor,
          currency,
          billing_interval: billingInterval,
          active: plan ? plan.active : true,
          features,
        },
        plan?.id,
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save plan.");
    }
  }

  return (
    <AdminDialog
      title={plan ? `Edit Plan: ${plan.name}` : "Create Subscription Package"}
      subtitle="Define plan name, pricing, billing interval, and included operational modules."
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="admin-form-stack">
        {error && (
          <div className="error-box" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-field">
          <label htmlFor="plan-name">Package Name *</label>
          <input
            id="plan-name"
            type="text"
            className="input"
            required
            placeholder="e.g. Salon Starter, Professional, Enterprise"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="plan-desc">Description</label>
          <textarea
            id="plan-desc"
            className="input"
            rows={2}
            placeholder="Who is this package best suited for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-row-three">
          <div className="form-field">
            <label htmlFor="plan-price">Price *</label>
            <input
              id="plan-price"
              type="number"
              step="any"
              min="0"
              className="input"
              required
              value={priceMajor}
              onChange={(e) => setPriceMajor(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="plan-currency">Currency</label>
            <select
              id="plan-currency"
              className="select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="LKR">LKR (Rs)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="INR">INR (₹)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="plan-interval">Interval</label>
            <select
              id="plan-interval"
              className="select"
              value={billingInterval}
              onChange={(e) =>
                setBillingInterval(e.target.value as "month" | "year")
              }
            >
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
        </div>

        <fieldset className="permissions-fieldset">
          <legend>Included Feature Modules</legend>
          <p className="field-hint">
            Salons subscribing to this plan will have access to checked modules.
          </p>
          <div className="permissions-checkbox-list">
            {catalog.features.map((feat) => {
              const checked = features.includes(feat.key);
              return (
                <label key={feat.key} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFeature(feat.key)}
                  />
                  <div>
                    <strong>{feat.label}</strong>
                    <code>{feat.key}</code>
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="dialog-actions">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="button primary" disabled={busy}>
            {plan ? "Update Package" : "Publish Package"}
          </button>
        </div>
      </form>
    </AdminDialog>
  );
}
