"use client";
import { canPermission } from "@/lib/access";

import { useCallback, useEffect, useState } from "react";
import { Plus, Scissors, Package, ArrowUpRight, X } from "lucide-react";
import { useBranchApi } from "@/features/workspace/branch-context";
import type { CatalogItem, ListResponse, Tenant } from "@/lib/types";
import { message, money } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";

export function CatalogView({ tenant }: { tenant: Tenant }) {
  const api = useBranchApi();
  const { t } = useTranslation();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState<CatalogItem | null | undefined>(undefined);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const data = await api<ListResponse<CatalogItem>>("catalog", {
      tenant: tenant.slug,
    });
    setItems(data.data);
  }, [tenant.slug]);
  useEffect(() => {
    void load()
      .catch((err) => setError(message(err)))
      .finally(() => setLoading(false));
  }, [load]);
  async function save(values: FormData) {
    setBusy(true);
    setError("");
    try {
      await api(form ? `catalog/${form.id}` : "catalog", {
        method: form ? "PATCH" : "POST",
        tenant: tenant.slug,
        body: {
          name: values.get("name"),
          type: values.get("type"),
          price_minor: Math.round(Number(values.get("price")) * 100),
          active: values.get("active") === "on",
        },
      });
      await load();
      setForm(undefined);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  const canManage = canPermission(tenant, "catalog.manage");
  const visible = items.filter(
    (item) => filter === "all" || item.type === filter,
  );
  return (
    <section className="panel catalog-panel">
      <div className="section-heading">
        <div>
          <h2>{t.catalog.title}</h2>
          <p>{t.catalog.subtitle}</p>
        </div>
        {canManage && (
          <button
            className="button primary small-button"
            onClick={() => setForm(null)}
            disabled={busy}
          >
            <Plus size={16} />
            {t.catalog.addServiceOrProduct}
          </button>
        )}
      </div>
      {error && (
        <p className="error-box inset" role="alert">
          {error}
        </p>
      )}
      {form !== undefined && (
        <form
          key={form?.id || "new"}
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            void save(new FormData(event.currentTarget));
          }}
        >
          <div className="inline-form-title">
            <h3>{form ? t.catalog.editItem : t.catalog.addServiceOrProduct}</h3>
            <button
              type="button"
              className="icon-button"
              disabled={busy}
              onClick={() => setForm(undefined)}
              aria-label={t.common.close}
            >
              <X size={18} />
            </button>
          </div>
          <div className="form-grid">
            <label>
              {t.catalog.name}
              <input
                name="name"
                required
                maxLength={120}
                autoFocus
                defaultValue={form?.name}
              />
            </label>
            <label>
              {t.catalog.type}
              <select name="type" defaultValue={form?.type || "service"}>
                <option value="service">{t.catalog.service}</option>
                <option value="product">{t.catalog.product}</option>
              </select>
            </label>
            <label>
              {t.catalog.price} ({tenant.currency})
              <input
                name="price"
                type="number"
                min="0"
                max="9999999"
                step="0.01"
                required
                defaultValue={form ? form.price_minor / 100 : ""}
              />
            </label>
            <label className="checkbox-label">
              <input
                name="active"
                type="checkbox"
                defaultChecked={form?.active ?? true}
              />
              {t.catalog.availableForBooking}
            </label>
          </div>
          <button className="button primary" disabled={busy}>
            {busy ? t.common.loading : t.forms.save}
          </button>
        </form>
      )}
      <div className="filter-tabs" aria-label={t.catalog.title}>
        {["all", "service", "product"].map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={filter === value ? "selected" : ""}
          >
            {value === "all"
              ? t.catalog.all
              : value === "service"
                ? t.catalog.services
                : t.catalog.products}
            <span>
              {
                items.filter((item) => value === "all" || item.type === value)
                  .length
              }
            </span>
          </button>
        ))}
      </div>
      {loading ? (
        <p className="loading-line" role="status">
          {t.common.loading}…
        </p>
      ) : !visible.length ? (
        <div className="empty-state">
          <Package size={28} />
          <h3>{t.catalog.emptyTitle}</h3>
          <p>{t.catalog.subtitle}</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t.catalog.item}</th>
                <th>{t.catalog.type}</th>
                <th>{t.catalog.price}</th>
                <th>{t.catalog.status}</th>
                <th>
                  <span className="sr-only">{t.common.edit}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="client-cell">
                      <span className="catalog-icon">
                        {item.type === "service" ? (
                          <Scissors size={18} />
                        ) : (
                          <Package size={18} />
                        )}
                      </span>
                      <strong>{item.name}</strong>
                    </div>
                  </td>
                  <td className="capitalize">
                    {item.type === "service"
                      ? t.catalog.service
                      : t.catalog.product}
                  </td>
                  <td className="money-label">
                    {money(item.price_minor, tenant.currency)}
                  </td>
                  <td>
                    <span
                      className={`status ${item.active ? "completed" : "cancelled"}`}
                    >
                      {item.active ? t.common.active : t.common.inactive}
                    </span>
                  </td>
                  <td>
                    {canManage && (
                      <button
                        className="row-action"
                        aria-label={`${t.catalog.editItem} ${item.name}`}
                        onClick={() => setForm(item)}
                      >
                        <ArrowUpRight size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
