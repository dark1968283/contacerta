import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CreditCard,
  Layers3,
  ShieldCheck,
  Store,
  Users,
  Wallet,
  Clock3,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from "lucide-react";
import { requirePlatformAdmin } from "@/lib/supabase/platform";
import { formatMT } from "@/lib/format";
import { decidePayment, savePlan } from "./actions";

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

function statusClass(status: string) {
  if (status === "confirmed" || status === "active") {
    return "border-brandGlow/20 bg-brandGlow/10 text-brandGlow";
  }

  if (status === "pending" || status === "past_due") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  if (
    status === "rejected" ||
    status === "expired" ||
    status === "cancelled" ||
    status === "suspended"
  ) {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  return "border-dark-border bg-dark-elevated text-dark-muted";
}

function formatDate(value: string | null) {
  if (!value) return "Sem data definida";

  return new Date(value).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function PlatformAdmin({
  searchParams,
}: {
  searchParams?: { erro?: string; resultado?: string };
}) {
  const supabase = await requirePlatformAdmin();

  const [{ data: plans }, { data: subs }, { data: payments }, { data: businesses }] =
    await Promise.all([
      supabase.from("plans").select("*").order("display_order"),
      supabase.from("subscriptions").select("*").order("created_at", {
        ascending: false,
      }),
      supabase
        .from("subscription_payments")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("businesses").select("id,name"),
    ]);

  const allPlans = plans ?? [];
  const allSubs = subs ?? [];
  const allPayments = payments ?? [];
  const allBusinesses = businesses ?? [];

  const businessNames = new Map(
    allBusinesses.map((business) => [business.id, business.name]),
  );

  const countSubs = (status: string) =>
    allSubs.filter((subscription) => subscription.status === status).length;

  const countPayments = (status: string) =>
    allPayments.filter((payment) => payment.status === status).length;

  const revenue = allPayments
    .filter((payment) => payment.status === "confirmed")
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);

  const pendingPayments = allPayments.filter(
    (payment) => payment.status === "pending",
  );

  const stats = [
    {
      label: "Negócios registados",
      value: allBusinesses.length,
      detail: "Contas na plataforma",
      Icon: Store,
      accent: "text-sky-300 bg-sky-400/10 border-sky-400/15",
    },
    {
      label: "Planos disponíveis",
      value: allPlans.filter((plan) => plan.active).length,
      detail: `${allPlans.length} planos configurados`,
      Icon: Layers3,
      accent: "text-violet-300 bg-violet-400/10 border-violet-400/15",
    },
    {
      label: "Assinaturas activas",
      value: countSubs("active"),
      detail: `${countSubs("pending")} pendentes`,
      Icon: Users,
      accent: "text-brandGlow bg-brandGlow/10 border-brandGlow/15",
    },
    {
      label: "Pagamentos pendentes",
      value: countPayments("pending"),
      detail: "Aguardam decisão administrativa",
      Icon: Clock3,
      accent: "text-amber-300 bg-amber-400/10 border-amber-400/15",
    },
    {
      label: "Pagamentos confirmados",
      value: countPayments("confirmed"),
      detail: "Registos confirmados",
      Icon: BadgeCheck,
      accent: "text-emerald-300 bg-emerald-400/10 border-emerald-400/15",
    },
    {
      label: "Receita confirmada",
      value: formatMT(revenue),
      detail: "Total dos pagamentos confirmados",
      Icon: Banknote,
      accent: "text-brandGlow bg-brandGlow/10 border-brandGlow/15",
    },
  ];

  return (
    <div className="-mx-4 -mt-5 -mb-6 min-h-[calc(100dvh-5rem)] bg-dark-bg px-4 pb-16 pt-6 text-dark-text shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-100vmax_-100vmax)] sm:-mx-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brandGlow/20 bg-brandGlow/10 text-brandGlow">
                <ShieldCheck size={21} />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brandGlow">
                Área reservada
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Administração da plataforma
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-dark-muted">
              Gere planos, acompanha assinaturas e toma decisões sobre os
              pagamentos do ContaCerta.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-xl border border-dark-border bg-dark-surface px-3 py-2.5 text-xs text-dark-muted">
            <span className="h-2 w-2 rounded-full bg-brandGlow" />
            Painel administrativo
          </div>
        </header>

        {searchParams?.erro && (
          <div role="alert" className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-200">
            {searchParams.erro === "pagamento_ultrapassado"
              ? "Este pedido foi ultrapassado por um pedido mais recente. Não foi confirmado; verifique os pedidos pendentes."
              : searchParams.erro === "pagamento_resolvido"
                ? "Este pagamento já não está pendente. Actualize a página para consultar o estado actual."
                : searchParams.erro === "pagamento_invalido"
                  ? "O pagamento não corresponde a uma subscrição válida. Verifique os registos antes de continuar."
                  : "Não foi possível actualizar o pagamento. Verifique o estado do pedido e tente novamente."}
          </div>
        )}

        {searchParams?.resultado === "pagamento_atualizado" && (
          <div role="status" className="rounded-xl border border-brandGlow/20 bg-brandGlow/10 px-4 py-3 text-sm text-brandGlow">
            O estado do pagamento foi actualizado.
          </div>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Visão geral</h2>
              <p className="mt-1 text-sm text-dark-muted">
                Resumo actual da plataforma.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map(({ label, value, detail, Icon, accent }) => (
              <article
                key={label}
                className="rounded-2xl border border-dark-border bg-dark-surface p-4 transition hover:border-dark-border/80 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-dark-muted">{label}</p>
                    <p className="mt-3 break-words text-2xl font-semibold tracking-tight tabular-nums">
                      {value}
                    </p>
                  </div>
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${accent}`}
                  >
                    <Icon size={20} />
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-dark-faint">
                  {detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Gestão de planos</h2>
            <p className="mt-1 text-sm text-dark-muted">
              Edita preços, funcionalidades, limites e disponibilidade.
            </p>
          </div>

          {allPlans.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {allPlans.map((plan) => (
                <form
                  action={savePlan}
                  key={plan.id}
                  className="space-y-5 rounded-2xl border border-dark-border bg-dark-surface p-4 sm:p-5"
                >
                  <input type="hidden" name="id" value={plan.id} />

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brandGlow/15 bg-brandGlow/10 text-brandGlow">
                        <Layers3 size={20} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold">
                          {plan.name || "Plano sem nome"}
                        </h3>
                        <p className="mt-1 text-xs text-dark-muted">
                          Identificador: {plan.slug}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${
                        plan.active
                          ? "border-brandGlow/20 bg-brandGlow/10 text-brandGlow"
                          : "border-dark-border bg-dark-elevated text-dark-muted"
                      }`}
                    >
                      {plan.active ? "Disponível" : "Desactivado"}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-xs text-dark-muted">
                      Nome do plano
                      <input
                        className="w-full rounded-xl border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-dark-text outline-none transition placeholder:text-dark-faint focus:border-brandGlow/50 focus:ring-2 focus:ring-brandGlow/10"
                        name="name"
                        defaultValue={plan.name}
                        required
                      />
                    </label>

                    <label className="space-y-1.5 text-xs text-dark-muted">
                      Slug
                      <input
                        className="w-full rounded-xl border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-dark-text outline-none transition focus:border-brandGlow/50 focus:ring-2 focus:ring-brandGlow/10"
                        name="slug"
                        defaultValue={plan.slug}
                        required
                      />
                    </label>
                  </div>

                  <label className="block space-y-1.5 text-xs text-dark-muted">
                    Descrição
                    <textarea
                      className="min-h-20 w-full rounded-xl border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-dark-text outline-none transition placeholder:text-dark-faint focus:border-brandGlow/50 focus:ring-2 focus:ring-brandGlow/10"
                      name="description"
                      defaultValue={plan.description ?? ""}
                      rows={2}
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="space-y-1.5 text-xs text-dark-muted">
                      Preço mensal (MT)
                      <input
                        className="w-full rounded-xl border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-dark-text outline-none focus:border-brandGlow/50"
                        name="monthly_price"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={plan.monthly_price}
                        required
                      />
                    </label>

                    <label className="space-y-1.5 text-xs text-dark-muted">
                      Preço anual (MT)
                      <input
                        className="w-full rounded-xl border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-dark-text outline-none focus:border-brandGlow/50"
                        name="yearly_price"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={plan.yearly_price}
                        required
                      />
                    </label>

                    <label className="space-y-1.5 text-xs text-dark-muted">
                      Ordem de exibição
                      <input
                        className="w-full rounded-xl border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-dark-text outline-none focus:border-brandGlow/50"
                        name="display_order"
                        type="number"
                        defaultValue={plan.display_order}
                        required
                      />
                    </label>
                  </div>

                  <label className="block space-y-1.5 text-xs text-dark-muted">
                    Funcionalidades
                    <textarea
                      className="min-h-20 w-full rounded-xl border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-dark-text outline-none transition focus:border-brandGlow/50"
                      name="features"
                      defaultValue={
                        Array.isArray(plan.features)
                          ? plan.features
                              .filter((feature): feature is string => typeof feature === "string")
                              .join(", ")
                          : ""
                      }
                      placeholder="Separe as funcionalidades por vírgulas"
                      rows={2}
                    />
                    <span className="block text-dark-faint">
                      Separe cada funcionalidade com uma vírgula.
                    </span>
                  </label>

                  <label className="block space-y-1.5 text-xs text-dark-muted">
                    Limites (JSON)
                    <textarea
                      className="min-h-24 w-full rounded-xl border border-dark-border bg-dark-bg px-3 py-2.5 font-mono text-xs text-dark-text outline-none transition focus:border-brandGlow/50"
                      name="limits"
                      defaultValue={JSON.stringify(plan.limits, null, 2)}
                      rows={4}
                      required
                    />
                  </label>

                  <div className="flex flex-col justify-between gap-4 border-t border-dark-border pt-4 sm:flex-row sm:items-center">
                    <label className="flex cursor-pointer items-center gap-3 text-sm text-dark-muted">
                      <input
                        className="h-4 w-4 accent-[#22C766]"
                        name="active"
                        type="checkbox"
                        defaultChecked={plan.active}
                      />
                      Plano disponível para clientes
                    </label>

                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brandGlow px-4 py-2.5 text-sm font-semibold text-dark-bg transition hover:brightness-110"
                    >
                      Guardar alterações
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </form>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-dark-border p-8 text-center text-sm text-dark-muted">
              Não foram encontrados planos.
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Pedidos de pagamento</h2>
            <p className="mt-1 text-sm text-dark-muted">
              Revê cada pedido antes de confirmar ou rejeitar.
            </p>
          </div>

          {allPayments.length ? (
            <div className="space-y-3">
              {allPayments.map((payment) => (
                <article
                  key={payment.id}
                  className="rounded-2xl border border-dark-border bg-dark-surface p-4 sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dark-border bg-dark-elevated text-dark-muted">
                        <CreditCard size={20} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold">
                          {businessNames.get(payment.business_id) ?? "Negócio"}
                        </h3>
                        <p className="mt-1 break-all text-xs text-dark-muted">
                          Referência: {payment.reference || "Não disponível"}
                        </p>
                        <p className="mt-1 text-xs text-dark-faint">
                          {payment.payment_method} · {formatDate(payment.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-xl font-semibold text-brandGlow">
                        {formatMT(payment.amount)}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs ${statusClass(payment.status)}`}
                      >
                        {paymentLabels[payment.status] ?? payment.status}
                      </span>
                    </div>
                  </div>

                  {payment.status === "pending" && (
                    <form
                      action={decidePayment}
                      className="mt-5 space-y-3 border-t border-dark-border pt-4"
                    >
                      <input
                        type="hidden"
                        name="payment_id"
                        value={payment.id}
                      />

                      <label className="block space-y-1.5 text-xs text-dark-muted">
                        Nota administrativa (opcional)
                        <input
                          className="w-full rounded-xl border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-dark-text outline-none placeholder:text-dark-faint focus:border-brandGlow/50 sm:max-w-md"
                          name="notes"
                          placeholder="Observação sobre a decisão"
                        />
                      </label>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="submit"
                          name="decision"
                          value="confirm"
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brandGlow px-4 py-2.5 text-sm font-semibold text-dark-bg transition hover:brightness-110"
                        >
                          <CheckCircle2 size={16} />
                          Confirmar pagamento
                        </button>

                        <button
                          type="submit"
                          name="decision"
                          value="reject"
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-400/15"
                        >
                          <XCircle size={16} />
                          Rejeitar pagamento
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-dark-border p-8 text-center text-sm text-dark-muted">
              Ainda não existem pedidos de pagamento.
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Assinaturas</h2>
            <p className="mt-1 text-sm text-dark-muted">
              Estado actual das assinaturas registadas.
            </p>
          </div>

          {allSubs.length ? (
            <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
              <div className="divide-y divide-dark-border">
                {allSubs.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dark-border bg-dark-elevated text-dark-muted">
                        <Wallet size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="break-words font-medium">
                          {businessNames.get(subscription.business_id) ?? "Negócio"}
                        </p>
                        <p className="mt-1 text-xs text-dark-muted">
                          Ciclo{" "}
                          {subscription.billing_cycle === "monthly"
                            ? "mensal"
                            : "anual"}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-dark-faint">
                          <CalendarDays size={13} />
                          {subscription.current_period_end
                            ? `Termina em ${formatDate(subscription.current_period_end)}`
                            : "Sem data de término definida"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`w-fit shrink-0 rounded-full border px-2.5 py-1 text-xs ${statusClass(subscription.status)}`}
                    >
                      {subscriptionLabels[subscription.status] ?? subscription.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-dark-border p-8 text-center text-sm text-dark-muted">
              Ainda não existem assinaturas registadas.
            </div>
          )}
        </section>

        <footer className="flex items-start gap-3 rounded-2xl border border-dark-border bg-dark-surface/60 p-4">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brandGlow" />
          <p className="text-xs leading-5 text-dark-muted">
            As operações administrativas continuam protegidas pela verificação
            de acesso da plataforma. Confirme os dados do pedido antes de
            aprovar um pagamento.
          </p>
        </footer>
      </div>
    </div>
  );
}
