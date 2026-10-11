import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CreditCard, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requestPlan } from "../planos/actions";

type Cycle = "monthly" | "yearly";

function formatPrice(amount: number, currency: string) {
  if (amount === 0) return "Grátis";
  return `${Math.round(amount).toLocaleString("pt-MZ")} ${currency === "MZN" ? "MT" : currency}`;
}

export default async function EfectuarPagamentoPage({
  searchParams,
}: {
  searchParams: { plan?: string; ciclo?: string };
}) {
  if (!searchParams.plan) redirect("/dashboard/planos");

  const cycle: Cycle = searchParams.ciclo === "yearly" ? "yearly" : "monthly";
  const supabase = createClient();

  const { data: plan, error } = await supabase
    .from("plans")
    .select("id,name,description,monthly_price,yearly_price,currency,features")
    .eq("id", searchParams.plan)
    .eq("active", true)
    .maybeSingle();

  if (error || !plan) redirect("/dashboard/planos");

  const price = cycle === "monthly" ? plan.monthly_price : plan.yearly_price;
  const features = Array.isArray(plan.features)
    ? plan.features.filter((feature): feature is string => typeof feature === "string")
    : [];

  return (
    <div className="-mx-4 -mt-5 -mb-6 min-h-[calc(100dvh-5rem)] bg-dark-bg px-4 pb-16 pt-5 shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-100vmax_-100vmax)] sm:-mx-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-7">
        <Link
          href="/dashboard/planos"
          className="inline-flex items-center gap-2 text-sm text-dark-muted transition-colors hover:text-dark-text"
        >
          <ArrowLeft size={16} />
          Voltar aos planos
        </Link>

        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brandGlow">
            ContaCerta · Subscrição
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-dark-text sm:text-3xl">
            Efectuar pagamento
          </h1>
          <p className="mt-2 text-sm leading-6 text-dark-muted">
            Reveja o plano escolhido e preencha os dados para criar o seu pedido de pagamento.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <section className="rounded-2xl border border-dark-border bg-dark-surface p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brandGlow/10 text-brandGlow">
                <CreditCard size={21} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-dark-muted">Plano seleccionado</p>
                <h2 className="mt-1 text-xl font-semibold text-dark-text">{plan.name}</h2>
                {plan.description && (
                  <p className="mt-1 text-sm leading-5 text-dark-muted">{plan.description}</p>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-dark-border pt-5">
              <p className="text-sm text-dark-muted">
                {cycle === "monthly" ? "Facturação mensal" : "Facturação anual"}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-dark-text">
                  {formatPrice(price, plan.currency)}
                </span>
                {price > 0 && (
                  <span className="text-sm text-dark-muted">
                    / {cycle === "monthly" ? "mês" : "ano"}
                  </span>
                )}
              </div>
            </div>

            {features.length > 0 && (
              <div className="mt-6 border-t border-dark-border pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-dark-muted">
                  Incluído neste plano
                </p>
                <ul className="space-y-3">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-dark-text/80">
                      <Check size={16} className="mt-0.5 shrink-0 text-brandGlow" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link
              href="/dashboard/planos"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brandGlow hover:underline"
            >
              Alterar plano ou periodicidade
            </Link>
          </section>

          <section className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
            <div className="border-b border-dark-border p-5 sm:p-6">
              <h2 className="font-semibold text-dark-text">Dados do pagamento</h2>
              <p className="mt-1 text-sm text-dark-muted">
                Se já efectuou o pagamento, indique a referência da transacção.
              </p>
            </div>

            <form action={requestPlan} className="space-y-5 p-5 sm:p-6">
              <input type="hidden" name="plan_id" value={plan.id} />
              <input type="hidden" name="billing_cycle" value={cycle} />

              <div>
                <label htmlFor="payment_method" className="mb-2 block text-sm font-medium text-dark-text">
                  Método de pagamento
                </label>
                <select
                  id="payment_method"
                  name="payment_method"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-dark-border bg-dark-bg/60 px-4 py-3 text-sm text-dark-text outline-none transition focus:border-brandGlow/50 focus:ring-2 focus:ring-brandGlow/15 [color-scheme:dark]"
                >
                  <option value="" disabled>Seleccione um método</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="emola">e-Mola</option>
                  <option value="mkesh">mKesh</option>
                  <option value="bank_transfer">Transferência bancária</option>
                  <option value="cash">Dinheiro</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div>
                <label htmlFor="transaction_id" className="mb-2 block text-sm font-medium text-dark-text">
                  ID da transacção <span className="font-normal text-dark-muted">(opcional)</span>
                </label>
                <input
                  id="transaction_id"
                  name="transaction_id"
                  placeholder="Introduza o ID da transacção"
                  className="w-full rounded-xl border border-dark-border bg-dark-bg/60 px-4 py-3 text-sm text-dark-text outline-none transition placeholder:text-dark-faint focus:border-brandGlow/50 focus:ring-2 focus:ring-brandGlow/15"
                />
              </div>

              <div>
                <label htmlFor="notes" className="mb-2 block text-sm font-medium text-dark-text">
                  Observações <span className="font-normal text-dark-muted">(opcional)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Informações adicionais sobre o pagamento"
                  className="min-h-24 w-full rounded-xl border border-dark-border bg-dark-bg/60 px-4 py-3 text-sm text-dark-text outline-none transition placeholder:text-dark-faint focus:border-brandGlow/50 focus:ring-2 focus:ring-brandGlow/15"
                />
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-dark-elevated p-3.5 text-xs leading-5 text-dark-muted">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-brandGlow" />
                <p>
                  O pedido fica pendente até à confirmação pela plataforma. Este formulário não activa automaticamente a assinatura.
                </p>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brandGlow px-4 py-3.5 text-sm font-semibold text-dark-bg transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-brandGlow/30 focus:ring-offset-2 focus:ring-offset-dark-surface"
              >
                Criar pedido de pagamento
                <ArrowRight size={17} />
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
