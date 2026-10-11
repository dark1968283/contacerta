"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, PackageX, X } from "lucide-react";

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

export function LowStockAlert({ products }: LowStockAlertProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (products.length === 0) return;

    try {
      if (sessionStorage.getItem(DISMISS_KEY) !== "1") {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, [products.length]);

  if (!visible || products.length === 0) return null;

  const sortedProducts = [...products].sort((a, b) => {
    const aOut = a.stock_quantity === 0;
    const bOut = b.stock_quantity === 0;

    if (aOut !== bOut) return aOut ? -1 : 1;
    return a.stock_quantity - b.stock_quantity;
  });

  const outOfStock = products.filter((p) => p.stock_quantity === 0).length;
  const lowStock = products.length - outOfStock;

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // O aviso continua a poder ser fechado mesmo se o armazenamento falhar.
    }
    setVisible(false);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={dismiss}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-alert-title"
        aria-describedby="stock-alert-description"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-dark-border bg-dark-surface shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-dark-border p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="stock-alert-title"
              className="text-lg font-semibold text-dark-text"
            >
              Atenção ao stock
            </h2>
            <p
              id="stock-alert-description"
              className="mt-1 text-sm leading-5 text-dark-muted"
            >
              {products.length === 1
                ? "Tens 1 produto que precisa de atenção."
                : `Tens ${products.length} produtos que precisam de atenção.`}
            </p>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Fechar aviso de stock"
            className="rounded-lg p-2 text-dark-muted transition-colors hover:bg-white/5 hover:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            {outOfStock > 0 && (
              <span className="rounded-full bg-danger/10 px-3 py-1.5 text-danger">
                {outOfStock} esgotado{outOfStock === 1 ? "" : "s"}
              </span>
            )}
            {lowStock > 0 && (
              <span className="rounded-full bg-warning/10 px-3 py-1.5 text-warning">
                {lowStock} com stock baixo
              </span>
            )}
          </div>

          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {sortedProducts.slice(0, 6).map((product) => {
              const isOut = product.stock_quantity === 0;

              return (
                <li
                  key={product.id}
                  className="flex items-center gap-3 rounded-xl border border-dark-border bg-white/[0.02] p-3"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      isOut
                        ? "bg-danger/10 text-danger"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    <PackageX className="h-4 w-4" aria-hidden />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-dark-text">
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-xs text-dark-muted">
                      {isOut
                        ? "Sem unidades disponíveis"
                        : `${product.stock_quantity} unidade${product.stock_quantity === 1 ? "" : "s"} disponível${product.stock_quantity === 1 ? "" : "e"}${product.stock_quantity <= product.low_stock_threshold ? " · Stock baixo" : ""}`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          {products.length > 6 && (
            <p className="text-xs text-dark-muted">
              E mais {products.length - 6} produto(s) a precisar de atenção.
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-xl border border-dark-border px-4 py-3 text-sm font-medium text-dark-muted transition-colors hover:bg-white/5 hover:text-dark-text sm:flex-1"
            >
              Fechar aviso
            </button>

            <Link
              href="/dashboard/produtos"
              onClick={dismiss}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand/90 sm:flex-1"
            >
              Ver produtos
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
