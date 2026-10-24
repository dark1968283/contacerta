"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CreditCard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Plan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  limits: Record<string, unknown>;
  features: string[];
};

type Cycle = "monthly" | "yearly";

function formatPrice(amount: number, currency: string) {
  if (amount === 0) return "Grátis";

  return `${Math.round(amount).toLocaleString("pt-MZ")} ${currency === "MZN" ? "MT" : currency}`;
}



/** Limites mostrados em cada plano (os mesmos que a app aplica). */
const LIMIT_ROWS: { key: string; label: string }[] = [
  { key: "products", label: "Produtos" },
  { key: "sales_per_month", label: "Vendas por mês" },
  { key: "invoices_per_month", label: "Facturas por mês" },
  { key: "clients", label: "Clientes" },
  { key: "users", label: "Quem pode usar" },
];

function limitText(key: string, raw: unknown) {
  const n = raw === undefined || raw === null ? -1 : Number(raw);
  if (!Number.isFinite(n) || n < 0) return "Sem limite";
  if (key === "users") return n <= 1 ? "Só você" : `Você + ${n - 1} funcionários`;
  return `Até ${n.toLocaleString("pt-MZ")}`;
}

export function PlanPicker({
  plans,
  error,
}: {
  plans: Plan[];
  error?: string;
}) {
  const router = useRouter();
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-2xl border border-dark-border bg-dark-surface p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-brandGlow/5 blur-3xl" />

        <div className="relative flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brandGlow/10 text-brandGlow">
            <Sparkles size={21} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brandGlow">
              ContaCerta
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-dark-text sm:text-2xl">
              Um plano para cada fase do seu negócio
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-dark-muted">
              Compare as opções, escolha as funcionalidades de que precisa
              e mantenha as vendas, o stock e as dívidas sob controlo.
            </p>
          </div>
        </div>

        <div className="relative mt-5 flex items-center gap-2 text-xs text-dark-muted">
          <ShieldCheck size={16} className="shrink-0 text-brandGlow" />
          <span>Preços em meticais. A activação depende da confirmação do pagamento.</span>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-dark-text">Escolha o seu plano</h2>
          <p className="mt-1 text-sm text-dark-muted">
            Compare os preços e as funcionalidades incluídas.
          </p>
        </div>

        <div className="grid grid-cols-2 rounded-xl border border-dark-border bg-dark-surface p-1 sm:w-[250px]">
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            aria-pressed={cycle === "monthly"}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              cycle === "monthly"
                ? "bg-brandGlow text-dark-bg shadow-none"
                : "text-dark-muted hover:bg-dark-elevated"
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setCycle("yearly")}
            aria-pressed={cycle === "yearly"}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              cycle === "yearly"
                ? "bg-brandGlow text-dark-bg shadow-none"
                : "text-dark-muted hover:bg-dark-elevated"
            }`}
          >
            Anual
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-alert/20 bg-alert/5 p-4 text-sm text-alert"
        >
          {error}
        </div>
      )}

      {plans.length > 0 ? (
        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const isSelected = selected === plan.id;
            const isRecommended = /profissional|professional/i.test(plan.name);
            const price =
              cycle === "monthly" ? plan.monthly_price : plan.yearly_price;
            const monthlyEquivalent =
              cycle === "yearly" && plan.yearly_price > 0
                ? plan.yearly_price / 12
                : null;
            const savings =
              plan.monthly_price > 0 &&
              plan.yearly_price > 0 &&
              plan.yearly_price < plan.monthly_price * 12
                ? Math.round(
                    ((plan.monthly_price * 12 - plan.yearly_price) /
                      (plan.monthly_price * 12)) *
                      100,
                  )
                : 0;

            return (
              <article
                key={plan.id}
                className={`relative flex flex-col overflow-hidden rounded-2xl border border-dark-border bg-dark-surface p-5 transition-colors duration-200 hover:border-dark-muted/40 sm:p-6 ${
                  isSelected
                    ? "border-brandGlow ring-1 ring-brandGlow/20 shadow-none"
                    : isRecommended
                      ? "border-brandGlow/60 bg-dark-elevated shadow-none hover:border-brandGlow"
                      : "border-dark-border shadow-sm hover:border-brandGlow/40 hover:shadow-card"
                }`}
              >
                {isRecommended && (
                  <div className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-full border border-brandGlow/15 bg-brandGlow/10 px-3.5 py-2 text-xs font-semibold text-brandGlow">
                    <Sparkles size={13} />
                    Mais completo
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-dark-text">{plan.name}</h3>
                    {plan.description && (
                      <p className="mt-1.5 text-sm leading-5 text-dark-muted">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brandGlow text-dark-bg">
                      <Check size={15} strokeWidth={2.5} />
                    </span>
                  )}
                </div>

                <div className="mt-7 border-b border-dark-border/80 pb-6">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-4xl font-bold tracking-tight text-dark-text sm:text-[2.65rem]">
                      {formatPrice(price, plan.currency)}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-dark-muted">
                        / {cycle === "monthly" ? "mês" : "ano"}
                      </span>
                    )}
                  </div>

                  {monthlyEquivalent !== null && (
                    <p className="mt-1.5 text-xs text-dark-muted">
                      Equivale a {formatPrice(monthlyEquivalent, plan.currency)} por mês
                    </p>
                  )}

                  {cycle === "yearly" && savings > 0 && (
                    <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Poupe {savings}% por ano
                    </span>
                  )}
                </div>

                <div className="pt-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-dark-muted">
                    Vantagens
                  </p>

                  {plan.features.length > 0 ? (
                    <ul className="space-y-3.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-[15px] font-medium text-dark-text">
                          <Check size={18} className="mt-0.5 shrink-0 text-brandGlow" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-dark-muted">
                      Consulte os detalhes deste plano.
                    </p>
                  )}
                </div>

                <div className="flex-1 py-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-dark-muted">
                    Limites
                  </p>
                  <dl className="divide-y divide-dark-border/70 rounded-xl border border-dark-border/80 bg-dark-bg/40">
                    {LIMIT_ROWS.map(({ key, label }) => {
                      const value = limitText(key, plan.limits[key]);
                      const unlimited = value === "Sem limite";
                      return (
                        <div key={key} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                          <dt className="text-dark-muted">{label}</dt>
                          <dd className={`font-semibold tabular-nums ${unlimited ? "text-brandGlow" : "text-dark-text"}`}>{value}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>

                {plan.slug === "gratis" ? (
                  <div className="w-full rounded-2xl border border-dark-border bg-dark-elevated px-4 py-3.5 text-center text-sm font-medium text-dark-muted">
                    Plano gratuito após o teste
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(plan.id);
                      router.push(`/dashboard/efectuar-pagamento?plan=${encodeURIComponent(plan.id)}&ciclo=${cycle}`);
                    }}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                      isSelected
                        ? "bg-brandGlow text-dark-bg"
                        : "border border-dark-border bg-dark-surface text-dark-text hover:border-brandGlow hover:text-brandGlow"
                    }`}
                  >
                    {isSelected ? "Plano seleccionado" : "Escolher este plano"}
                    {isSelected ? <Check size={16} /> : <ArrowRight size={16} />}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-dark-border bg-dark-surface p-8 text-center">
          <CreditCard size={28} className="mx-auto text-dark-text/35" />
          <p className="mt-3 font-medium text-dark-text">Ainda não existem planos disponíveis.</p>
          <p className="mt-1 text-sm text-dark-muted">
            Volte mais tarde ou contacte o suporte.
          </p>
        </div>
      )}

    </div>
  );
}
