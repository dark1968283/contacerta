import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Crown,
  History,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { formatMT } from "@/lib/format";

const labels: Record<string, string> = {
  pending: "Pendente",
  active: "Activo",
  past_due: "Em atraso",
  expired: "Expirado",
  cancelled: "Cancelado",
  suspended: "Suspenso",
  confirmed: "Confirmado",
  rejected: "Rejeitado",
  refunded: "Reembolsado",
};

const limitLabels: Record<string, string> = {
  users: "Utilizadores",
  clients: "Clientes",
  products: "Produtos",
  storage_mb: "Armazenamento",
  sales_per_month: "Vendas por mês",
  invoices_per_month: "Facturas por mês",
};

const paymentMethods: Record<string, string> = {
  mpesa: "M-Pesa",
  emola: "e-Mola",
  mkesh: "mKesh",
  bank_transfer: "Transferência bancária",
  cash: "Numerário",
  other: "Outro método",
};

function readableLimit(key: string, value: unknown) {
  const n = Number(value);
  const label = limitLabels[key] ?? key.replaceAll("_", " ");

  if (n === -1) return `${label}: Ilimitado`;
  if (key === "storage_mb") {
    return `${label}: ${n >= 1000 ? `${n / 1000} GB` : `${n} MB`}`;
  }
  if (key === "users") return `${label}: Até ${n} utilizadores`;

  return `${label}: ${n}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function statusStyle(status: string) {
  if (status === "active" || status === "confirmed") {
    return "border-brandGlow/20 bg-brandGlow/10 text-brandGlow";
  }
  if (status === "pending") {
    return "border-warning/20 bg-warning/10 text-warning";
  }
  if (status === "past_due" || status === "rejected") {
    return "border-danger/20 bg-danger/10 text-danger";
  }
  return "border-white/10 bg-white/[0.04] text-dark-muted";
}

export default async function MeuPlano() {
  const { businessId } = await getBusinessContext();
  const supabase = createClient();

  const [{ data: subs }, { data: payments }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(
        "id,status,billing_cycle,current_period_end,plans(slug,name,features,limits)",
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("subscription_payments")
      .select(
        "id,amount,billing_cycle,payment_method,status,reference,transaction_id,created_at,plans(name)",
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
  ]);

  const sub = subs?.[0];
  const plan = sub?.plans as unknown as {
    slug: string;
    name: string;
    features: string[];
    limits: Record<string, unknown>;
  } | null;

  const isTrial = plan?.slug === "trial-18-dias";
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).getTime()
    : 0;
  const daysRemaining = periodEnd > 0
    ? Math.max(0, Math.ceil((periodEnd - Date.now()) / 86400000))
    : 0;
  const isActive = sub?.status === "active" && periodEnd > Date.now();
  const trialExpired = isTrial && sub?.status === "active" && !isActive;
  const features = plan?.features ?? [];
  const limits = Object.entries(plan?.limits ?? {});

  return (
    <div className="-mx-4 -mt-5 -mb-6 min-h-[calc(100dvh-5rem)] bg-dark-bg px-4 pb-16 pt-6 text-dark-text shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-100vmax_-100vmax)] sm:-mx-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-dark-muted">
              <Wallet size={14} />
              Conta e facturação
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Meu plano
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-dark-muted">
              Consulte a sua assinatura, os benefícios disponíveis e o
              histórico dos seus pagamentos.
            </p>
          </div>

          <Link
            href="/dashboard/planos"
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium transition hover:border-brandGlow/30 hover:bg-brandGlow/10 sm:self-auto"
          >
            Explorar planos
            <ArrowUpRight size={16} />
          </Link>
        </header>

        {isActive && sub ? (
          <section className="relative overflow-hidden rounded-2xl border border-brandGlow/20 bg-dark-surface p-5 sm:p-7">
            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brandGlow/[0.08] blur-3xl" />

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-dark-muted">
                  <Crown size={15} className="text-brandGlow" />
                  {isTrial ? "Período experimental" : "Plano actual"}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${statusStyle(sub.status)}`}
                >
                  <CheckCircle2 size={14} />
                  {labels[sub.status] ?? sub.status}
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {plan?.name ?? "Plano activo"}
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-dark-muted">
                    {isTrial
                      ? daysRemaining === 1
                        ? "Tem mais 1 dia de teste gratuito. Escolha um plano pago antes do fim para continuar a utilizar as funcionalidades."
                        : `Tem mais ${daysRemaining} dias de teste gratuito. Escolha um plano pago antes do fim para continuar a utilizar as funcionalidades.`
                      : "A sua assinatura está activa. Pode consultar os benefícios e acompanhar os pagamentos nesta página."}
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/10 p-3 sm:min-w-48">
                  <div className="flex shrink-0 items-center text-brandGlow">
                    <CalendarDays size={19} />
                  </div>
                  <div>
                    <p className="text-xs text-dark-muted">
                      {isTrial ? "Fim do teste gratuito" : "Próxima renovação"}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {formatDate(sub.current_period_end)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 border-t border-white/[0.08] pt-5 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex shrink-0 items-center text-dark-muted">
                    <CreditCard size={17} />
                  </div>
                  <div>
                    <p className="text-xs text-dark-muted">
                      Ciclo de cobrança
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {isTrial ? "Teste gratuito de 18 dias" : sub.billing_cycle === "monthly" ? "Mensal" : "Anual"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex shrink-0 items-center text-dark-muted">
                    <ShieldCheck size={17} />
                  </div>
                  <div>
                    <p className="text-xs text-dark-muted">
                      Estado da assinatura
                    </p>
                    <p className="mt-1 text-sm font-medium text-brandGlow">
                      {isTrial ? "Teste gratuito activo" : "Acesso activo"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-white/[0.08] bg-dark-surface p-5 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex shrink-0 items-center text-warning">
                {sub?.status === "pending" ? (
                  <Clock3 size={23} />
                ) : (
                  <Sparkles size={23} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">
                    {sub?.status === "pending"
                      ? "Assinatura em processamento"
                      : trialExpired
                        ? "O período experimental terminou"
                        : sub
                          ? "A sua assinatura não está activa"
                          : "Escolha o plano ideal para o seu negócio"}
                  </h2>
                  {sub?.status && (
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle(sub.status)}`}
                    >
                      {labels[sub.status] ?? sub.status}
                    </span>
                  )}
                </div>

                <p className="mt-2 max-w-xl text-sm leading-6 text-dark-muted">
                  {sub?.status === "pending"
                    ? "A assinatura ainda não está activa. Consulte os seus pagamentos para verificar o estado do pedido."
                    : trialExpired
                      ? "Os 18 dias de teste gratuito terminaram. Escolha um plano pago para solicitar a activação e voltar a registar operações."
                      : "Escolha um plano para consultar as opções disponíveis e solicitar a activação da sua assinatura."}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  {sub?.status === "pending" && (
                    <Link
                      href="/dashboard/pagamentos"
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brandGlow px-4 text-sm font-semibold text-onglow transition hover:brightness-110"
                    >
                      Consultar pagamentos
                      <ArrowRight size={16} />
                    </Link>
                  )}
                  <Link
                    href="/dashboard/planos"
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium transition hover:border-brandGlow/30 hover:bg-brandGlow/10"
                  >
                    Ver planos disponíveis
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {isActive && (
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">O que está incluído</h2>
                <p className="mt-1 text-sm text-dark-muted">
                  Benefícios e limites associados ao seu plano.
                </p>
              </div>
              <span className="hidden rounded-full border border-white/[0.08] px-3 py-1 text-xs text-dark-muted sm:inline-flex">
                {features.length + limits.length} itens
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border border-white/[0.08] bg-dark-surface p-5">
                <div className="flex items-center gap-2">
                  <div className="flex shrink-0 items-center text-brandGlow">
                    <Sparkles size={17} />
                  </div>
                  <h3 className="text-sm font-semibold">Benefícios</h3>
                </div>

                {features.length ? (
                  <ul className="mt-5 space-y-3">
                    {features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm leading-5 text-dark-muted"
                      >
                        <Check
                          size={16}
                          className="mt-0.5 shrink-0 text-brandGlow"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-5 text-sm text-dark-muted">
                    Os benefícios deste plano não estão especificados.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-white/[0.08] bg-dark-surface p-5">
                <div className="flex items-center gap-2">
                  <div className="flex shrink-0 items-center text-dark-muted">
                    <ShieldCheck size={17} />
                  </div>
                  <h3 className="text-sm font-semibold">Limites do plano</h3>
                </div>

                {limits.length ? (
                  <ul className="mt-5 space-y-3">
                    {limits.map(([key, value]) => (
                      <li
                        key={key}
                        className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-3 text-sm last:border-0 last:pb-0"
                      >
                        <span className="text-dark-muted">
                          {limitLabels[key] ?? key.replaceAll("_", " ")}
                        </span>
                        <span className="text-right font-medium">
                          {readableLimit(key, value).split(": ").slice(1).join(": ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-5 text-sm text-dark-muted">
                    Não existem limites especificados para este plano.
                  </p>
                )}
              </section>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <History size={18} className="text-dark-muted" />
                <h2 className="text-lg font-semibold">
                  Histórico de pagamentos
                </h2>
              </div>
              <p className="mt-1 text-sm text-dark-muted">
                Consulte os pedidos e os pagamentos associados à sua conta.
              </p>
            </div>

            <Link
              href="/dashboard/pagamentos"
              className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-brandGlow transition hover:text-white"
            >
              Ver pendentes
              <ArrowRight size={15} />
            </Link>
          </div>

          {payments?.length ? (
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-dark-surface">
              {payments.map((payment, index) => {
                const paymentPlan = payment.plans as unknown as {
                  name: string;
                } | null;

                return (
                  <article
                    key={payment.id}
                    className={`p-4 sm:p-5 ${
                      index > 0 ? "border-t border-white/[0.07]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex shrink-0 items-center text-dark-muted">
                        <CreditCard size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold">
                              {paymentPlan?.name ?? "Plano ContaCerta"}
                            </p>
                            <p className="mt-1 text-xs text-dark-muted">
                              {payment.billing_cycle === "monthly"
                                ? "Mensal"
                                : "Anual"}
                              {" · "}
                              {paymentMethods[payment.payment_method] ??
                                payment.payment_method}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-1">
                            <p className="text-base font-semibold tabular-nums">
                              {formatMT(payment.amount)}
                            </p>
                            <span
                              className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyle(payment.status)}`}
                            >
                              {labels[payment.status] ?? payment.status}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-col gap-1 text-xs text-dark-muted sm:flex-row sm:flex-wrap sm:gap-x-5">
                          <p>
                            Referência:{" "}
                            <span className="text-dark-text/80">
                              {payment.reference || "—"}
                            </span>
                          </p>
                          <p>
                            Data:{" "}
                            <span className="text-dark-text/80">
                              {formatDate(payment.created_at)}
                            </span>
                          </p>
                        </div>

                        {payment.transaction_id && (
                          <p className="mt-2 break-all text-xs text-dark-muted">
                            Transacção:{" "}
                            <span className="text-dark-text/80">
                              {payment.transaction_id}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/[0.12] bg-dark-surface/50 px-5 py-9 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-dark-muted">
                <History size={21} />
              </div>
              <h3 className="mt-4 text-sm font-semibold">
                Ainda não existem pagamentos
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-dark-muted">
                Quando solicitar um plano, os pedidos e os respectivos estados
                aparecerão aqui.
              </p>
              <Link
                href="/dashboard/planos"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brandGlow hover:text-white"
              >
                Consultar planos
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
