import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { requirePlatformAdmin } from "@/lib/supabase/platform";
import { formatMT } from "@/lib/format";
import { decidePayment, savePlan } from "./actions";
import { MethodChip } from "@/components/payments/MethodLogo";

const paymentLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  rejected: "Rejeitado",
  refunded: "Reembolsado",
};

const subscriptionLabels: Record<string, string> = {
  pending: "Pendente",
  active: "Activa",
  past_due: "Em atraso",
  expired: "Expirada",
  cancelled: "Cancelada",
  suspended: "Suspensa",
};

const methodLabels: Record<string, string> = {
  mpesa: "M-Pesa",
  emola: "e-Mola",
  mkesh: "mKesh",
  bank_transfer: "Transferência",
};

function statusClass(status: string) {
  if (status === "active" || status === "confirmed") return "border-brandGlow/25 bg-brandGlow/10 text-brandGlow";
  if (status === "pending") return "border-warning/25 bg-warning/10 text-warning";
  if (["rejected", "past_due", "expired", "suspended", "cancelled"].includes(status))
    return "border-danger/25 bg-danger/10 text-danger";
  return "border-dark-border bg-white/[0.05] text-dark-muted";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-MZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Maputo",
  });
}

const FIELD =
  "w-full rounded-xl border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-dark-text outline-none transition placeholder:text-dark-faint focus:border-brandGlow/50 focus:ring-2 focus:ring-brandGlow/10";

type Tab = "pedidos" | "assinaturas" | "planos" | "resumo";

export default async function PlatformAdmin({
  searchParams,
}: {
  searchParams?: { erro?: string; resultado?: string; tab?: string; ver?: string };
}) {
  const supabase = await requirePlatformAdmin();

  const [{ data: plans }, { data: subs }, { data: payments }, { data: businesses }] = await Promise.all([
    supabase.from("plans").select("*").order("display_order"),
    supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
    supabase.from("subscription_payments").select("*").order("created_at", { ascending: false }),
    supabase.from("businesses").select("id,name"),
  ]);

  const allPlans = plans ?? [];
  const allSubs = subs ?? [];
  const allPayments = payments ?? [];
  const allBusinesses = businesses ?? [];
  const businessName = (id: string) => allBusinesses.find((b) => b.id === id)?.name ?? "Negócio";
  const planName = (id: string) => allPlans.find((p) => p.id === id)?.name ?? "Plano";

  const pending = allPayments.filter((p) => p.status === "pending");
  const revenue = allPayments
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const activeSubs = allSubs.filter((s) => s.status === "active").length;

  const tab: Tab = (["pedidos", "assinaturas", "planos", "resumo"] as const).includes(searchParams?.tab as Tab)
    ? (searchParams!.tab as Tab)
    : "pedidos";
  const showAllPayments = searchParams?.ver === "todos";
  const paymentList = showAllPayments ? allPayments : pending;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "pedidos", label: "Pedidos", count: pending.length },
    { key: "assinaturas", label: "Assinaturas", count: allSubs.length },
    { key: "planos", label: "Planos", count: allPlans.length },
    { key: "resumo", label: "Resumo" },
  ];

  return (
    <div className="min-h-dvh bg-dark-bg text-dark-text shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(0_-100vmax_-100vmax_-100vmax)]">
      {/* Barra de topo */}
      <div className="sticky top-0 z-20 px-4 pt-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-2xl border border-dark-border bg-dark-surface px-3 py-2.5 sm:px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-medium text-dark-muted transition hover:bg-white/[0.06] hover:text-dark-text"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Voltar à app</span>
            <span className="sm:hidden">Voltar</span>
          </Link>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-brandGlow" aria-hidden />
            Plataforma
          </span>
          <span className="w-16 sm:w-24" aria-hidden />
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-5 px-4 pb-16 pt-6 sm:px-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Administração</h1>
          <p className="mt-1 text-sm text-dark-muted">
            {pending.length
              ? `${pending.length} pagamento${pending.length === 1 ? "" : "s"} à espera de decisão.`
              : "Nenhum pagamento à espera de decisão."}
          </p>
        </header>

        {searchParams?.erro && (
          <div role="alert" className="rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm leading-6 text-warning">
            {searchParams.erro === "pagamento_ultrapassado"
              ? "Este pedido foi ultrapassado por um pedido mais recente. Não foi confirmado."
              : searchParams.erro === "pagamento_resolvido"
                ? "Este pagamento já não está pendente."
                : searchParams.erro === "pagamento_invalido"
                  ? "O pagamento não corresponde a uma assinatura válida."
                  : "Não foi possível actualizar o pagamento. Tente novamente."}
          </div>
        )}
        {searchParams?.resultado === "pagamento_atualizado" && (
          <div role="status" className="rounded-xl border border-brandGlow/20 bg-brandGlow/10 px-4 py-3 text-sm font-medium text-brandGlow">
            ✓ Pagamento actualizado.
          </div>
        )}

        {/* Separadores */}
        <nav aria-label="Secções" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex gap-1 rounded-full border border-dark-border bg-white/[0.03] p-1">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={t.key === "pedidos" ? "/platform-admin" : `/platform-admin?tab=${t.key}`}
                aria-current={tab === t.key ? "page" : undefined}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === t.key ? "bg-brand text-onbrand" : "text-dark-muted hover:text-dark-text"
                }`}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 text-xs tabular-nums ${
                      t.key === "pedidos" && tab !== t.key ? "bg-warning/20 text-warning" : "opacity-80"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* ── PEDIDOS ───────────────────────────────────────── */}
        {tab === "pedidos" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-faint">
                {showAllPayments ? "Todos os pedidos" : "À espera de decisão"}
              </h2>
              <Link
                href={showAllPayments ? "/platform-admin" : "/platform-admin?ver=todos"}
                className="text-sm font-medium text-accent"
              >
                {showAllPayments ? "Só pendentes" : `Ver todos (${allPayments.length})`}
              </Link>
            </div>

            {paymentList.length === 0 ? (
              <div className="rounded-2xl border border-dark-border bg-dark-surface px-6 py-12 text-center">
                <CheckCircle2 className="mx-auto h-9 w-9 text-brandGlow" aria-hidden />
                <p className="mt-3 font-semibold">Está tudo decidido.</p>
                <p className="mt-1 text-sm text-dark-muted">Os novos pedidos de pagamento aparecem aqui.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {paymentList.map((payment) => {
                  const isPending = payment.status === "pending";
                  return (
                    <li key={payment.id}>
                      <article className="rounded-2xl border border-dark-border bg-dark-surface p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold">{businessName(payment.business_id)}</p>
                            <p className="text-sm text-dark-muted">
                              {planName(payment.plan_id)} · {payment.billing_cycle === "monthly" ? "mensal" : "anual"}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xl font-bold tabular-nums">{formatMT(payment.amount)}</p>
                            <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs ${statusClass(payment.status)}`}>
                              {paymentLabels[payment.status] ?? payment.status}
                            </span>
                          </div>
                        </div>

                        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-white/[0.03] p-3 text-sm sm:grid-cols-4">
                          <div>
                            <dt className="text-xs text-dark-faint">Método</dt>
                            <dd className="font-medium"><MethodChip method={payment.payment_method} label={methodLabels[payment.payment_method] ?? payment.payment_method} /></dd>
                          </div>
                          <div>
                            <dt className="text-xs text-dark-faint">Data</dt>
                            <dd className="font-medium">{formatDateTime(payment.created_at)}</dd>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <dt className="text-xs text-dark-faint">Referência</dt>
                            <dd className="break-all font-mono text-xs font-medium">{payment.reference || "—"}</dd>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <dt className="text-xs text-dark-faint">ID da transacção</dt>
                            <dd className="break-all font-mono text-xs font-medium">{payment.transaction_id || "—"}</dd>
                          </div>
                          {payment.notes && (
                            <div className="col-span-2 sm:col-span-4">
                              <dt className="text-xs text-dark-faint">Nota</dt>
                              <dd className="text-sm">{payment.notes}</dd>
                            </div>
                          )}
                        </dl>

                        {isPending && (
                          <form action={decidePayment} className="mt-4 space-y-3">
                            <input type="hidden" name="payment_id" value={payment.id} />
                            <label className="block text-xs text-dark-muted">
                              Nota para o cliente (opcional — aparece se rejeitar)
                              <input name="notes" className={`${FIELD} mt-1.5`} placeholder="Ex.: referência não encontrada no extrato" />
                            </label>
                            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                              <button
                                type="submit"
                                name="decision"
                                value="reject"
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/15"
                              >
                                <XCircle className="h-4 w-4" aria-hidden /> Rejeitar
                              </button>
                              <button
                                type="submit"
                                name="decision"
                                value="confirm"
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brandGlow px-5 py-2.5 text-sm font-bold text-onglow transition hover:brightness-110"
                              >
                                <CheckCircle2 className="h-4 w-4" aria-hidden /> Confirmar
                              </button>
                            </div>
                          </form>
                        )}
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* ── ASSINATURAS ───────────────────────────────────── */}
        {tab === "assinaturas" && (
          <section>
            {allSubs.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-dark-border p-8 text-center text-sm text-dark-muted">
                Ainda não existem assinaturas.
              </p>
            ) : (
              <ul className="divide-y divide-dark-border overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
                {allSubs.map((s) => {
                  const end = s.current_period_end ? new Date(s.current_period_end) : null;
                  const daysLeft = end ? Math.ceil((end.getTime() - Date.now()) / 86_400_000) : null;
                  return (
                    <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{businessName(s.business_id)}</p>
                        <p className="text-xs text-dark-muted">
                          {planName(s.plan_id)} · {s.billing_cycle === "monthly" ? "mensal" : "anual"}
                          {end && ` · até ${formatDate(s.current_period_end)}`}
                          {daysLeft !== null && s.status === "active" && daysLeft <= 7 && daysLeft >= 0 && (
                            <span className="text-warning"> · faltam {daysLeft} dia{daysLeft === 1 ? "" : "s"}</span>
                          )}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${statusClass(s.status)}`}>
                        {subscriptionLabels[s.status] ?? s.status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* ── PLANOS ───────────────────────────────────────── */}
        {tab === "planos" && (
          <section className="space-y-3">
            {allPlans.map((plan) => (
              <details key={plan.id} className="group rounded-2xl border border-dark-border bg-dark-surface">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0">
                    <p className="font-semibold">{plan.name || "Plano sem nome"}</p>
                    <p className="text-sm text-dark-muted">
                      {formatMT(plan.monthly_price)}/mês · {formatMT(plan.yearly_price)}/ano
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs ${
                        plan.active ? "border-brandGlow/25 bg-brandGlow/10 text-brandGlow" : "border-dark-border text-dark-muted"
                      }`}
                    >
                      {plan.active ? "Disponível" : "Desactivado"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-dark-muted transition-transform group-open:rotate-180" aria-hidden />
                  </span>
                </summary>

                <form action={savePlan} className="space-y-4 border-t border-dark-border p-4 sm:p-5">
                  <input type="hidden" name="id" value={plan.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-dark-muted">
                      Nome
                      <input name="name" defaultValue={plan.name} required className={`${FIELD} mt-1.5`} />
                    </label>
                    <label className="text-xs text-dark-muted">
                      Identificador (slug)
                      <input name="slug" defaultValue={plan.slug} required className={`${FIELD} mt-1.5`} />
                    </label>
                  </div>
                  <label className="block text-xs text-dark-muted">
                    Descrição
                    <textarea name="description" defaultValue={plan.description ?? ""} rows={2} className={`${FIELD} mt-1.5`} />
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <label className="text-xs text-dark-muted">
                      Preço mensal (MT)
                      <input name="monthly_price" type="number" min="0" step="0.01" defaultValue={plan.monthly_price} required className={`${FIELD} mt-1.5`} />
                    </label>
                    <label className="text-xs text-dark-muted">
                      Preço anual (MT)
                      <input name="yearly_price" type="number" min="0" step="0.01" defaultValue={plan.yearly_price} required className={`${FIELD} mt-1.5`} />
                    </label>
                    <label className="col-span-2 text-xs text-dark-muted sm:col-span-1">
                      Ordem
                      <input name="display_order" type="number" defaultValue={plan.display_order} required className={`${FIELD} mt-1.5`} />
                    </label>
                  </div>
                  <label className="block text-xs text-dark-muted">
                    Funcionalidades (separadas por vírgula)
                    <textarea
                      name="features"
                      rows={2}
                      className={`${FIELD} mt-1.5`}
                      defaultValue={
                        Array.isArray(plan.features)
                          ? plan.features.filter((f): f is string => typeof f === "string").join(", ")
                          : ""
                      }
                    />
                  </label>
                  <label className="block text-xs text-dark-muted">
                    Limites (JSON)
                    <textarea name="limits" rows={4} required defaultValue={JSON.stringify(plan.limits, null, 2)} className={`${FIELD} mt-1.5 font-mono text-xs`} />
                  </label>
                  <div className="flex flex-col gap-3 border-t border-dark-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex items-center gap-3 text-sm text-dark-muted">
                      <input name="active" type="checkbox" defaultChecked={plan.active} className="h-4 w-4 accent-brandGlow" />
                      Disponível para clientes
                    </label>
                    <button type="submit" className="min-h-11 rounded-xl bg-brandGlow px-5 py-2.5 text-sm font-bold text-onglow transition hover:brightness-110">
                      Guardar plano
                    </button>
                  </div>
                </form>
              </details>
            ))}
          </section>
        )}

        {/* ── RESUMO ───────────────────────────────────────── */}
        {tab === "resumo" && (
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {[
              { label: "Receita confirmada", value: formatMT(revenue) },
              { label: "Assinaturas activas", value: activeSubs },
              { label: "Pagamentos pendentes", value: pending.length },
              { label: "Negócios registados", value: allBusinesses.length },
              { label: "Planos disponíveis", value: allPlans.filter((p) => p.active).length },
              { label: "Pagamentos confirmados", value: allPayments.filter((p) => p.status === "confirmed").length },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-dark-border bg-dark-surface p-4 sm:p-5">
                <p className="text-xs text-dark-muted sm:text-sm">{s.label}</p>
                <p className="mt-2 break-words text-xl font-bold tabular-nums sm:text-2xl">{s.value}</p>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
