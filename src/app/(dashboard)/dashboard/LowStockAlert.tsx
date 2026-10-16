"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type StockAlertProduct = {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
};

type LowStockAlertProps = {
  products: StockAlertProduct[];
};

export function LowStockAlert({ products }: LowStockAlertProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(products.length > 0);
  }, [products.length]);

  function dismiss() {
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && products.length > 0 && (
        <motion.div
          key="stock-alert-overlay"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={dismiss}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-alert-title"
            aria-describedby="stock-alert-description"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-[24px] border border-white/[0.12] bg-dark-surface/85 shadow-2xl shadow-black/25 backdrop-blur-2xl"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-brand/[0.08]"
            />

            <div className="relative p-5 sm:p-6">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-brand/15 text-brand shadow-inner shadow-white/[0.04]">
                  <Image src="/icons/triangle-warning.svg" alt="" aria-hidden width={20} height={20} className="object-contain" />
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <h2
                    id="stock-alert-title"
                    className="text-base font-semibold tracking-tight text-dark-text"
                  >
                    Stock baixo
                  </h2>

                  <p
                    id="stock-alert-description"
                    className="mt-1.5 text-sm leading-5 text-dark-muted"
                  >
                    {products.length === 1
                      ? "Tens um produto que precisa de reposição."
                      : "Tens produtos que precisam de reposição."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="Fechar aviso de stock"
                  className="rounded-full p-1.5 text-dark-muted transition-colors hover:bg-white/[0.08] hover:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={dismiss}
                  className="min-h-10 flex-1 rounded-xl border border-white/[0.10] bg-white/[0.035] px-3 py-2.5 text-sm font-medium text-dark-muted transition-colors hover:bg-white/[0.08] hover:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  Agora não
                </button>

                <Link
                  href="/dashboard/produtos"
                  onClick={dismiss}
                  className="group flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-dark-surface"
                >
                  Ver stock
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
