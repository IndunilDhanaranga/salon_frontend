"use client";

import { useState } from "react";
import { Package, Plus, Scissors, Search } from "lucide-react";
import type { CatalogItem } from "@/lib/types";
import { money } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";

type Props = {
  items: CatalogItem[];
  currency: string;
  disabled: boolean;
  onAdd: (id: string) => void;
};

export function PosCatalogPicker({ items, currency, disabled, onAdd }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "service" | "product">("all");
  const visible = items.filter(
    (item) =>
      item.active &&
      (filter === "all" || filter === item.type) &&
      item.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <section className="pos-picker" aria-label={t.catalog.title}>
      <div className="pos-search">
        <Search size={18} aria-hidden="true" />
        <input
          aria-label={t.common.search}
          placeholder={`${t.common.search}…`}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <div className="pos-filters" aria-label={t.catalog.type}>
        {(["all", "service", "product"] as const).map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={filter === value}
            className={filter === value ? "selected" : ""}
            onClick={() => setFilter(value)}
          >
            {value === "all"
              ? t.catalog.all
              : value === "service"
                ? t.catalog.services
                : t.catalog.products}
          </button>
        ))}
      </div>
      <div className="pos-item-grid">
        {visible.map((item) => (
          <button
            type="button"
            disabled={disabled}
            className={`pos-item ${item.type}`}
            key={item.id}
            onClick={() => onAdd(item.id)}
            aria-label={`${t.common.add} ${item.name}, ${money(item.price_minor, currency)}`}
          >
            <span className="pos-item-top">
              <span className="pos-item-icon">
                {item.type === "service" ? (
                  <Scissors size={20} strokeWidth={1.5} />
                ) : (
                  <Package size={20} strokeWidth={1.5} />
                )}
              </span>
              <Plus size={17} aria-hidden="true" />
            </span>
            <strong>{item.name}</strong>
            <span className="pos-item-price">
              {money(item.price_minor, currency)}
            </span>
          </button>
        ))}
      </div>
      {!visible.length && (
        <div className="pos-no-results">
          <Package size={24} />
          <p>
            {items.some((item) => item.active)
              ? t.catalog.emptyTitle
              : t.catalog.subtitle}
          </p>
        </div>
      )}
    </section>
  );
}
