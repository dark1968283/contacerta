import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Receipt,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMT } from "@/lib/format";
import { PaymentForm } from "./PaymentForm";
import { DebtReminder } from "./DebtReminder";
import { getBusinessContext } from "@/lib/supabase/business";
import { Panel } from "@/components/dashboard/Panel";
import { MethodLogo } from "@/components/payments/MethodLogo";

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  parcial: "Parcial",
  paga: "Paga",
  vencida: "Vencida",
};

const methodLabel: Record<string, string> = {
  dinheiro: "Dinheiro",
  mpesa: "M-Pesa",
  emola: "e-Mola",
  transferencia: "Transferência",
  outro: "Outro",
};

const statusStyle: Record<string, string> = {
  pendente: "bg-warning/10 text-warning ring-warning/20",
  parcial: "bg-warning/10 text-warning ring-warning/20",
  paga: "bg-brandGlow/10 text-brandGlow ring-brandGlow/20",
  vencida: "bg-danger/10 text-danger ring-danger/20",
};

export default async function DebtDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { businessId } = await getBusinessContext();
  const supabase = createClient();

  const { data: debt } = await supabase
    .from("debts")
    .select(
      "id, customer_id, sale_id, total_amount, amount_paid, status, created_at"
    )
    .eq("id", params.id)
    .eq("business_id", businessId)
    .single();

  if (!debt) notFound();

  const [{ data: customer }, { data: sale }, { data: payments }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, name, phone")
        .eq("id", debt.customer_id)
        .eq("business_id", businessId)
        .single(),

      supabase
        .from("sales")
        .select("id, created_at, total_amount")
        .eq("id", debt.sale_id)
        .eq("business_id", businessId)
        .single(),

      supabase
        .from("debt_payments")
        .select("id, amount, payment_method, created_at")
        .eq("debt_id", debt.id)
        .eq("business_id", businessId)
        .order("created_at", { ascending: false }),
    ]);

  const remaining = Math.max(
    0,
    Number(debt.total_amount) - Number(debt.amount_paid)
  );

  const debtStatus = statusLabel[debt.status] ?? debt.status;
  const debtStatusStyle =
    statusStyle[debt.status] ??
    "bg-white/[0.05] text-dark-muted ring-white/10";

  return (
    <div className="-mx-4 -mt-5 -mb-6 min-h-[calc(100dvh-5rem)] bg-dark-bg px-4 pb-16 pt-5 shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-100vmax_-100vmax)] [background-image:radial-gradient(ellipse_520px_420px_at_50%_-120px,rgba(34,199,102,0.10),transparent)] sm:-mx-6 sm:px-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-4">
          <Link
            href="/dashboard/dividas"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-dark-muted transition-colors hover:text-dark-text"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar às dívidas
          </Link>

          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/10 ring-1 ring-warning/15">
              <Wallet className="h-5 w-5 text-warning" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-dark-text sm:text-[28px]">
                  Dívida de {customer?.name ?? "cliente"}
                </h1>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${debtStatusStyle}`}
                >
                  {debtStatus}
                </span>
              </div>
              <p className="mt-1 text-sm text-dark-muted">
                Venda relacionada:{" "}
                {sale
                  ? `${formatMT(Number(sale.total_amount))} · ${new Date(
                      sale.created_at
                    ).toLocaleDateString("pt-MZ", {
                      timeZone: "Africa/Maputo",
                    })}`
                  : debt.sale_id}
              </p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Panel className="p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-dark-muted">
              <Receipt className="h-4 w-4" aria-hidden />
            </span>
            <p className="mt-3 text-xs text-dark-muted">Valor total</p>
            <p className="mt-1 break-words text-base font-bold text-dark-text tabular-nums sm:text-lg">
              {formatMT(Number(debt.total_amount))}
            </p>
          </Panel>

          <Panel className="p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brandGlow/10 text-brandGlow">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            </span>
            <p className="mt-3 text-xs text-dark-muted">Valor pago</p>
            <p className="mt-1 break-words text-base font-bold text-brandGlow tabular-nums sm:text-lg">
              {formatMT(Number(debt.amount_paid))}
            </p>
          </Panel>

          <Panel className="p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Wallet className="h-4 w-4" aria-hidden />
            </span>
            <p className="mt-3 text-xs text-dark-muted">Saldo em aberto</p>
            <p className="mt-1 break-words text-base font-bold text-warning tabular-nums sm:text-lg">
              {formatMT(remaining)}
            </p>
          </Panel>

          <Panel className="p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-dark-muted">
              <CalendarDays className="h-4 w-4" aria-hidden />
            </span>
            <p className="mt-3 text-xs text-dark-muted">Data do registo</p>
            <p className="mt-1 text-sm font-semibold text-dark-text">
              {new Date(debt.created_at).toLocaleDateString("pt-MZ", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                timeZone: "Africa/Maputo",
              })}
            </p>
          </Panel>
        </section>

        {remaining > 0 && (
          <div id="receber" className="scroll-mt-24">
            <PaymentForm debtId={debt.id} remaining={remaining} />
          </div>
        )}

        {remaining > 0 && (
          <DebtReminder
            customerId={debt.customer_id}
            customerName={customer?.name ?? "cliente"}
            phone={customer?.phone ?? null}
            remaining={remaining}
          />
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-dark-text">
                Histórico de pagamentos
              </h2>
              <p className="mt-0.5 text-sm text-dark-muted">
                Consulte os pagamentos registados nesta dívida.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-dark-border bg-white/[0.03] px-2.5 py-1 text-xs text-dark-muted">
              {payments?.length ?? 0}
            </span>
          </div>

          {!payments?.length && (
            <Panel className="px-5 py-8 text-center">
              <Clock3
                className="mx-auto h-6 w-6 text-dark-faint"
                aria-hidden
              />
              <p className="mt-3 text-sm font-medium text-dark-text">
                Ainda não existem pagamentos.
              </p>
              <p className="mt-1 text-sm text-dark-muted">
                Os pagamentos registados aparecerão aqui.
              </p>
            </Panel>
          )}

          <div className="space-y-2">
            {payments?.map((payment) => (
              <Panel
                key={payment.id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <MethodLogo method={payment.payment_method} size={40} className="rounded-xl" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-dark-text">
                      {methodLabel[payment.payment_method] ??
                        payment.payment_method}
                    </p>
                    <p className="mt-1 text-xs text-dark-muted">
                      {new Date(payment.created_at).toLocaleDateString(
                        "pt-MZ",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          timeZone: "Africa/Maputo",
                        }
                      )}
                    </p>
                  </div>
                </div>
                <strong className="shrink-0 text-sm font-semibold text-brandGlow tabular-nums sm:text-base">
                  {formatMT(Number(payment.amount))}
                </strong>
              </Panel>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
