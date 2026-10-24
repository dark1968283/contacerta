"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, X } from "lucide-react";

type Step = {
  done: boolean;
  title: string;
  hint: string;
  href: string;
  cta: string;
};

const DISMISS_KEY = "contacerta-first-steps-hidden";

/**
 * Guia de primeira utilização: três passos simples com barra de progresso.
 * Desaparece sozinho quando tudo está feito, ou quando o utilizador o esconde.
 */
export function FirstSteps({
  hasProducts,
  hasSales,
  hasCustomers,
}: {
  hasProducts: boolean;
  hasSales: boolean;
  hasCustomers: boolean;
}) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  const steps: Step[] = [
    {
      done: hasProducts,
      title: "Adicione o seu primeiro produto",
      hint: "Nome, preço e quantas unidades tem.",
      href: "/dashboard/produtos/novo",
      cta: "Adicionar",
    },
    {
      done: hasSales,
      title: "Faça a sua primeira venda",
      hint: "Toque no produto e conclua. Leva segundos.",
      href: "/dashboard/vendas/nova",
      cta: "Vender",
    },
    {
      done: hasCustomers,
      title: "Registe um cliente",
      hint: "Para vender a crédito e saber quem lhe deve.",
      href: "/dashboard/clientes/novo",
      cta: "Registar",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (hidden || doneCount === steps.length) return null;

  const next = steps.find((s) => !s.done);

  function hide() {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignora */
    }
  }

  return (
    <section
      aria-labelledby="first-steps-title"
      className="rounded-2xl border border-brandGlow/25 bg-gradient-to-br from-brandGlow/[0.10] to-dark-surface p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="first-steps-title" className="text-base font-semibold text-dark-text">
            Primeiros passos
          </h2>
          <p className="mt-0.5 text-sm text-dark-muted">
            {doneCount} de {steps.length} feitos
          </p>
        </div>
        <button
          type="button"
          onClick={hide}
          aria-label="Esconder primeiros passos"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-dark-muted transition hover:bg-white/[0.06] hover:text-dark-text"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-brandGlow transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ol className="mt-4 space-y-2">
        {steps.map((step, index) => {
          const isNext = step === next;
          return (
            <li key={step.title}>
              <Link
                href={step.href}
                aria-disabled={step.done}
                className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition ${
                  step.done
                    ? "pointer-events-none border-transparent opacity-60"
                    : isNext
                      ? "border-brandGlow/40 bg-brandGlow/[0.08] hover:bg-brandGlow/[0.12]"
                      : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.15]"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    step.done
                      ? "bg-brandGlow text-onglow"
                      : isNext
                        ? "border-2 border-brandGlow text-accent"
                        : "border border-white/20 text-dark-faint"
                  }`}
                >
                  {step.done ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold ${step.done ? "text-dark-muted line-through" : "text-dark-text"}`}>
                    {step.title}
                  </span>
                  {!step.done && <span className="block text-xs text-dark-muted">{step.hint}</span>}
                </span>
                {!step.done && (
                  <span
                    className={`flex shrink-0 items-center gap-0.5 text-sm font-semibold ${
                      isNext ? "text-accent" : "text-dark-muted"
                    }`}
                  >
                    {step.cta}
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
