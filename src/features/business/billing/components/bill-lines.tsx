"use client";
import { Minus, Plus, X } from "lucide-react";
import type { CatalogItem } from "@/lib/types";
import { money } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";

type Props = {
  lines: { id: string; quantity: number }[];
  catalog: CatalogItem[];
  currency: string;
  busy: boolean;
  onQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
};
export function BillLines({
  lines,
  catalog,
  currency,
  busy,
  onQuantity,
  onRemove,
}: Props) {
  const { t, language } = useTranslation();
  return (
    <div className="bill-lines">
      {lines.map((line) => {
        const item = catalog.find((entry) => entry.id === line.id);
        if (!item) return null;
        return (
          <div className="bill-line" key={line.id}>
            <div>
              <strong>{item.name}</strong>
              <span className="cell-sub">
                {money(item.price_minor, currency)}{" "}
                {language === "si" ? "බැගින්" : "each"}
              </span>
            </div>
            <div className="pos-quantity">
              <button
                type="button"
                className="icon-button"
                aria-label={"Decrease quantity for " + item.name}
                disabled={busy || line.quantity <= 1}
                onClick={() =>
                  onQuantity(line.id, Math.max(1, line.quantity - 1))
                }
              >
                <Minus size={16} />
              </button>
              <label className="quantity-label">
                <span className="sr-only">
                  {t.billing.quantity} {item.name}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="1000"
                  step="1"
                  required
                  value={line.quantity}
                  disabled={busy}
                  onChange={(event) =>
                    onQuantity(line.id, Number(event.target.value))
                  }
                />
              </label>
              <button
                type="button"
                className="icon-button"
                aria-label={"Increase quantity for " + item.name}
                disabled={busy || line.quantity >= 1000}
                onClick={() =>
                  onQuantity(line.id, Math.min(1000, line.quantity + 1))
                }
              >
                <Plus size={16} />
              </button>
            </div>
            <strong>{money(item.price_minor * line.quantity, currency)}</strong>
            <button
              className="icon-button"
              type="button"
              aria-label={`${t.common.remove} ${item.name}`}
              disabled={busy}
              onClick={() => onRemove(line.id)}
            >
              <X size={17} />
            </button>
          </div>
        );
      })}
      {!lines.length && <p className="muted small">{t.billing.emptyDesc}</p>}
    </div>
  );
}
