import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  CreditCard,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { formatMT } from "@/lib/format";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function methodLabel(method: string) {
  const methods: Record<string, string> = {
    mpesa: "M-Pesa",
    emola: "e-Mola",
    mkesh: "mKesh",
    bank_transfer: "Transferência bancária",
  };

  return methods[method.toLowerCase()] ?? method;
}

export default async function Pagamentos() {
  const { businessId } = await getBusinessContext();
  const supabase = createClient();

  const { data } = await supabase
    .from("subscription_payments")
    .select(
      "id,amount,currency,billing_cycle,payment_method,status,reference,created_at,plans(name)",
    )
    .eq("business_id", businessId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const payments = data ?? [];

  return (
    <div className="-mx-4 -mt-5 -mb-6 min-h-[calc(100dvh-5rem)] bg-dark-bg px-4 pb-16 pt-6 text-dark-text shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-100vmax_-100vmax)] sm:-mx-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-brandGlow">
              <Wallet size={15} />
              ContaCerta
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Pagamentos
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-dark-muted">
              Acompanhe os pedidos de pagamento da sua assinatura e consulte
              os respectivos detalhes.
            </p>
          </div>

          <Link
            href="/dashboard/planos"
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-dark-border bg-dark-surface px-4 py-2.5 text-sm font-medium transition hover:border-brandGlow/40 hover:bg-dark-elevated sm:self-auto"
          >
            Ver planos
            <ArrowRight size={16} />
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-dark-muted">
                  Pedidos por confirmar
                </p>
                <p className="mt-3 text-3xl font-semibold tabular-nums">
                  {payments.length.toString().padStart(2, "0")}
                </p>
                <p className="mt-2 text-xs text-dark-faint">
                  Pedidos pendentes da sua conta
                </p>
              </div>
              <div className="rounded-xl border border-amber-400/15 bg-amber-400/10 p-3 text-amber-300">
                <Clock3 size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-dark-muted">Estado dos pedidos</p>
                <p className="mt-3 text-lg font-semibold">
                  {payments.length > 0
                    ? "A aguardar confirmação"
                    : "Tudo em dia"}
                </p>
                <p className="mt-2 text-xs text-dark-faint">
                  {payments.length > 0
                    ? "A ativação depende da confirmação do pagamento."
                    : "Não tem pedidos de pagamento pendentes."}
                </p>
              </div>
              <div className="rounded-xl border border-brandGlow/15 bg-brandGlow/10 p-3 text-brandGlow">
                <ShieldCheck size={21} />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Os seus pedidos</h2>
              <p className="mt-1 text-sm text-dark-muted">
                Detalhes dos pagamentos que aguardam confirmação.
              </p>
            </div>
            <span className="rounded-lg border border-dark-border bg-dark-surface px-3 py-1.5 text-xs text-dark-muted">
              {payments.length} {payments.length === 1 ? "pedido" : "pedidos"}
            </span>
          </div>

          {payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment) => {
                const plan = payment.plans as unknown as {
                  name: string;
                } | null;

                return (
                  <article
                    key={payment.id}
                    className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface"
                  >
                    <div className="flex flex-col gap-4 border-b border-dark-border p-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl border border-brandGlow/15 bg-brandGlow/10 p-3 text-brandGlow">
                          <ReceiptText size={21} />
                        </div>
                        <div>
                          <p className="text-xs text-dark-muted">
                            Assinatura
                          </p>
                          <h3 className="mt-1 text-lg font-semibold">
                            {plan?.name ?? "Plano ContaCerta"}
                          </h3>
                          <p className="mt-1 text-sm text-dark-muted">
                            Ciclo{" "}
                            {payment.billing_cycle === "monthly"
                              ? "mensal"
                              : "anual"}
                          </p>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-xs text-dark-muted">
                          Valor do pedido
                        </p>
                        <p className="mt-1 text-2xl font-semibold tracking-tight text-brandGlow">
                          {formatMT(payment.amount)}
                        </p>
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                          <Clock3 size={12} />
                          Pendente
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-4 p-5 sm:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-dark-elevated p-2 text-dark-muted">
                          <CreditCard size={17} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-dark-muted">
                            Método de pagamento
                          </p>
                          <p className="mt-1 break-words text-sm font-medium">
                            {methodLabel(payment.payment_method)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-dark-elevated p-2 text-dark-muted">
                          <CalendarDays size={17} />
                        </div>
                        <div>
                          <p className="text-xs text-dark-muted">
                            Data do pedido
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {formatDate(payment.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <p className="text-xs text-dark-muted">
                          Referência do pedido
                        </p>
                        <div className="mt-2 flex min-h-11 items-center rounded-xl border border-dark-border bg-dark-bg px-3 py-2">
                          <span className="break-all font-mono text-sm text-dark-text">
                            {payment.reference || "Referência não disponível"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-amber-400/10 bg-amber-400/[0.04] p-5">
                      <div className="flex items-start gap-3">
                        <Clock3
                          size={19}
                          className="mt-0.5 shrink-0 text-amber-300"
                        />
                        <div>
                          <p className="text-sm font-medium text-amber-200">
                            Aguardando confirmação
                          </p>
                          <p className="mt-1 text-sm leading-6 text-dark-muted">
                            O seu pedido foi registado. A assinatura permanece
                            pendente até à confirmação do pagamento pela
                            plataforma.
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-dark-border bg-dark-surface/60 px-5 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-dark-border bg-dark-elevated text-dark-muted">
                <ReceiptText size={25} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                Sem pagamentos pendentes
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-dark-muted">
                Quando criar um pedido de pagamento para a sua assinatura,
                poderá acompanhar aqui o valor, o método e o estado.
              </p>
              <Link
                href="/dashboard/planos"
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brandGlow px-5 py-3 text-sm font-semibold text-dark-bg transition hover:brightness-110"
              >
                Explorar planos
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-dark-border bg-dark-surface/60 p-4">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brandGlow" />
          <p className="text-xs leading-5 text-dark-muted">
            Por segurança, o estado apresentado corresponde ao registo do
            pagamento na plataforma. Não considere um pedido pendente como
            pagamento confirmado.
          </p>
        </div>
      </div>
    </div>
  );
}
