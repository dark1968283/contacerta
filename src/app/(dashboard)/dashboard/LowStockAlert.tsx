"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, X } from "lucide-react";

type StockAlertProduct = {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
};

type LowStockAlertProps = {
  products: StockAlertProduct[];
};

const DISMISS_KEY = "contacerta-stock-alert-dismissed";

/**
 * Faixa discreta no topo do Início (não bloqueia o ecrã).
 * Quando é fechada, só volta a aparecer se a situação do stock mudar.
 */
export function LowStockAlert({ products }: LowStockAlertProps) {
  const signature = products
    .map((p) => `${p.id}:${p.stock_quantity}`)
    .sort()
    .join("|");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!products.length) {
      setVisible(false);
      return;
    }
    try {
      setVisible(localStorage.getItem(DISMISS_KEY) !== signature);
    } catch {
      setVisible(true);
    }
  }, [signature, products.length]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, signature);
    } catch {
      /* sem armazenamento: volta a aparecer na próxima visita */
    }
  }

  if (!visible) return null;

  const outOfStock = products.filter((p) => p.stock_quantity < 1);
  const low = products.filter((p) => p.stock_quantity >= 1);
  const names = products.slice(0, 3).map((p) => p.name).join(", ");
  const more = products.length > 3 ? ` e mais ${products.length - 3}` : "";

  const title =
    outOfStock.length && low.length
      ? `${outOfStock.length} esgotado${outOfStock.length > 1 ? "s" : ""} · ${low.length} a acabar`
      : outOfStock.length
        ? `${outOfStock.length} produto${outOfStock.length > 1 ? "s" : ""} esgotado${outOfStock.length > 1 ? "s" : ""}`
        : `${low.length} produto${low.length > 1 ? "s" : ""} a acabar`;

  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-2xl border border-warning/25 bg-warning/[0.07] p-3 pr-2 sm:p-3.5"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </span>

      <Link href="/dashboard/produtos" className="group min-w-0 flex-1">
        <span className="block text-sm font-semibold text-dark-text">{title}</span>
        <span className="block truncate text-xs text-dark-muted">
          {names}
          {more}
        </span>
      </Link>

      <Link
        href="/dashboard/produtos"
        className="hidden shrink-0 items-center gap-1 rounded-xl bg-warning/15 px-3 py-2 text-sm font-semibold text-warning transition hover:bg-warning/25 sm:flex"
      >
        Repor <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Esconder aviso de stock"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-dark-muted transition hover:bg-white/[0.06] hover:text-dark-text"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
