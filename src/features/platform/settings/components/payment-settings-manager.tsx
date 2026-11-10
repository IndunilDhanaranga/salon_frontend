"use client";

import { useEffect, useState } from "react";
import { Landmark, Save } from "lucide-react";
import type { PlatformPaymentSettings } from "@/lib/types";

const defaultSettings: PlatformPaymentSettings = {
  bank_name: "Commercial Bank of Ceylon / BOC",
  account_name: "Salon Platform (Pvt) Ltd",
  account_number: "1000-8472-9102-001",
  branch_name: "Colombo City Centre / Digital Banking",
  updated_at: new Date().toISOString(),
};

export function PaymentSettingsManager({
  settings,
  busy,
  onSave,
}: {
  settings: PlatformPaymentSettings | null;
  busy: boolean;
  onSave: (values: PlatformPaymentSettings) => Promise<unknown>;
}) {
  const [form, setForm] = useState<PlatformPaymentSettings>(
    settings ?? defaultSettings,
  );

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const updateField = (field: keyof PlatformPaymentSettings, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await onSave({
      ...form,
      updated_at: new Date().toISOString(),
    });
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Payment settings</h2>
          <p>
            Update the official bank details shown to salons when they submit a
            renewal payment slip.
          </p>
        </div>
      </div>

      <form className="admin-form-stack" onSubmit={handleSubmit}>
        <div className="bank-account-card">
          <div className="bank-account-header">
            <Landmark size={18} />
            <strong>Live bank configuration</strong>
          </div>
          <div className="bank-account-grid">
            <label>
              Bank
              <input
                value={form.bank_name ?? ""}
                onChange={(event) =>
                  updateField("bank_name", event.target.value)
                }
                placeholder="Commercial Bank of Ceylon / BOC"
              />
            </label>
            <label>
              Account name
              <input
                value={form.account_name ?? ""}
                onChange={(event) =>
                  updateField("account_name", event.target.value)
                }
                placeholder="Salon Platform (Pvt) Ltd"
              />
            </label>
            <label>
              Account number
              <input
                value={form.account_number ?? ""}
                onChange={(event) =>
                  updateField("account_number", event.target.value)
                }
                placeholder="1000-8472-9102-001"
              />
            </label>
            <label>
              Branch
              <input
                value={form.branch_name ?? ""}
                onChange={(event) =>
                  updateField("branch_name", event.target.value)
                }
                placeholder="Colombo City Centre / Digital Banking"
              />
            </label>
          </div>
        </div>

        <div className="dialog-actions">
          <span className="pos-checkout-total">
            <Landmark size={14} /> Platform payment details
          </span>
          <button type="submit" className="button primary" disabled={busy}>
            <Save size={14} />
            {busy ? "Saving…" : "Save payment settings"}
          </button>
        </div>
      </form>
    </section>
  );
}
