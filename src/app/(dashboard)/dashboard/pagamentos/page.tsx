import Link from "next/link";
import { checkPaysuiteReturn } from "../planos/paysuite-actions";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { formatMT } from "@/lib/format";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Maputo",
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

type Payment = {
  id: string;
  amount: number;
  billing_cycle: string;
  payment_method: string;
  status: string;
  reference: string;
  notes: string | null;
  created_at: string;
  plans: unknown;
};

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "A aguardar", className: "border-warning/20 bg-warning/10 text-warning" },
  confirmed: { label: "Confirmado", className: "border-brandGlow/20 bg-brandGlow/10 text-brandGlow" },
  rejected: { label: "Rejeitado", className: "border-danger/25 bg-danger/10 text-danger" },
  cancelled: { label: "Cancelado", className: "border-white/10 bg-white/[0.05] text-dark-muted" },
  refunded: { label: "Reembolsado", className: "border-white/10 bg-white/[0.05] text-dark-muted" },
};

function planName(p: Payment) {
  return (p.plans as { name: string } | null)?.name ?? "Plano ContaCerta";
}

export default async function Pagamentos({
  searchParams,
}: {
  searchParams: { criado?: string; paysuite?: string; pago?: string };
}) {
  const { businessId } = await getBusinessContext();
  const supabase = createClient();
  // Ao voltar da PaySuite, confirma logo (sem esperar pelo webhook).
  const paysuiteStatus = searchParams.paysuite ? await checkPaysuiteReturn(searchParams.paysuite) : null;
  const justPaid = paysuiteStatus === "confirmed" || searchParams.pago === "1";

  const { data } = await supabase
    .from("subscription_payments")
    .select("id,amount,billing_cycle,payment_method,status,reference,notes,created_at,plans(name)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(30);

  const payments = (data ?? []) as Payment[];
  const pending = payments.filter((p) => p.status === "pending");
  const latest = payments[0];
  const latestIsRejected = latest?.status === "rejected";
  const history = payments.filter((p) => p.status !== "pending" && !(latestIsRejected && p.id === latest?.id));

  const state = pending.length
    ? { title: "A aguardar confirmação", text: "A assinatura é activada assim que o pagamento for confirmado.", tone: "amber" as const }
    : latestIsRejected
      ? { title: "O último pagamento foi rejeitado", text: "Veja o motivo abaixo e tente de novo.", tone: "danger" as const }
      : { title: "Tudo em dia", text: "Não tem pagamentos por resolver.", tone: "green" as const };

  return (
    <div className="-mx-4 -mt-5 -mb-6 min-h-[calc(100dvh-5rem)] bg-dark-bg px-4 pb-16 pt-6 text-dark-text shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-100vmax_-100vmax)] sm:-mx-6 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pagamentos</h1>
            <p className="mt-1 text-sm text-dark-muted">Os pagamentos da sua assinatura ContaCerta.</p>
          </div>
          <Link
            href="/dashboard/planos"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-dark-border bg-dark-surface px-4 py-2.5 text-sm font-medium transition hover:border-brandGlow/40"
          >
            Ver planos <ArrowRight size={16} />
          </Link>
        </header>

        {justPaid && (
          <p role="status" className="rounded-2xl border border-brandGlow/25 bg-brandGlow/[0.08] px-5 py-4 text-sm font-medium text-brandGlow">
            ✓ Pagamento recebido. O seu plano já está activo. Obrigado!
          </p>
        )}
        {paysuiteStatus === "pending" && (
          <p role="status" className="rounded-2xl border border-warning/25 bg-warning/[0.08] px-5 py-4 text-sm font-medium text-dark-text">
            Ainda não recebemos a confirmação da PaySuite. Se já pagou, o plano activa-se sozinho em poucos minutos.
          </p>
        )}

        {searchParams.criado && pending.some((p) => p.id === searchParams.criado) && (
          <p role="status" className="rounded-2xl border border-brandGlow/25 bg-brandGlow/[0.08] px-5 py-4 text-sm font-medium text-brandGlow">
            ✓ Pedido criado. Vamos confirmar o pagamento e activar o plano — pode acompanhar aqui.
          </p>
        )}

        {/* Estado geral — uma só frase */}
        <div
          className={`flex items-center gap-4 rounded-2xl border p-5 ${
            state.tone === "danger"
              ? "border-danger/25 bg-danger/[0.06]"
              : state.tone === "amber"
                ? "border-warning/20 bg-warning/[0.05]"
                : "border-brandGlow/20 bg-brandGlow/[0.05]"
          }`}
        >
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              state.tone === "danger"
                ? "bg-danger/15 text-danger"
                : state.tone === "amber"
                  ? "bg-warning/15 text-warning"
                  : "bg-brandGlow/15 text-brandGlow"
            }`}
          >
            {state.tone === "danger" ? <XCircle size={24} /> : state.tone === "amber" ? <Clock3 size={24} /> : <CheckCircle2 size={24} />}
          </span>
          <div>
            <p className="text-lg font-semibold">{state.title}</p>
            <p className="text-sm text-dark-muted">{state.text}</p>
          </div>
        </div>

        {/* Último pagamento rejeitado: motivo + tentar de novo */}
        {latestIsRejected && latest && !pending.length && (
          <article className="overflow-hidden rounded-2xl border border-danger/25 bg-dark-surface">
            <div className="flex items-start justify-between gap-3 p-5">
              <div>
                <p className="text-xs text-dark-muted">{formatDate(latest.created_at)}</p>
                <h2 className="mt-1 text-lg font-semibold">{planName(latest)}</h2>
                <p className="text-sm text-dark-muted">
                  {methodLabel(latest.payment_method)} · Ref. <span className="font-mono">{latest.reference || "—"}</span>
                </p>
              </div>
              <p className="shrink-0 text-xl font-semibold tabular-nums">{formatMT(latest.amount)}</p>
            </div>
            <div className="border-t border-danger/15 bg-danger/[0.05] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-danger">Motivo</p>
              <p className="mt-1 text-sm leading-6 text-dark-text">
                {latest.notes?.trim() ||
                  "Não foi possível confirmar este pagamento. Verifique a referência e o valor enviados."}
              </p>
            </div>
            <div className="p-4">
              <Link
                href="/dashboard/planos"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brandGlow px-5 py-3.5 text-sm font-bold text-dark-bg transition hover:brightness-110"
              >
                <RotateCcw size={16} /> Tentar de novo
              </Link>
            </div>
          </article>
        )}

        {/* Pendentes */}
        {pending.map((payment) => (
          <article key={payment.id} className="overflow-hidden rounded-2xl border border-warning/20 bg-dark-surface">
            <div className="flex items-start justify-between gap-3 p-5">
              <div>
                <p className="text-xs text-dark-muted">{formatDate(payment.created_at)}</p>
                <h2 className="mt-1 text-lg font-semibold">{planName(payment)}</h2>
                <p className="text-sm text-dark-muted">
                  {methodLabel(payment.payment_method)} · Ciclo {payment.billing_cycle === "monthly" ? "mensal" : "anual"}
                </p>
              </div>
              <p className="shrink-0 text-xl font-semibold tabular-nums text-brandGlow">{formatMT(payment.amount)}</p>
            </div>
            <div className="border-t border-dark-border px-5 py-4">
              <p className="text-xs text-dark-muted">Referência</p>
              <p className="mt-1 break-all font-mono text-sm">{payment.reference || "—"}</p>
            </div>
          </article>
        ))}

        {/* Histórico */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-faint">Histórico</h2>
          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-dark-border px-5 py-10 text-center">
              <ReceiptText size={24} className="mx-auto text-dark-muted" />
              <p className="mt-3 font-medium">Ainda sem pagamentos.</p>
              <Link
                href="/dashboard/planos"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brandGlow px-5 py-3 text-sm font-semibold text-dark-bg"
              >
                Explorar planos <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-dark-border overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
              {history.map((p) => {
                const st = STATUS[p.status] ?? STATUS.cancelled!;
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{planName(p)}</p>
                      <p className="text-xs text-dark-muted">
                        {formatDate(p.created_at)} · {methodLabel(p.payment_method)}
                      </p>
                      {p.status === "rejected" && p.notes && (
                        <p className="mt-0.5 truncate text-xs text-danger">Motivo: {p.notes}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums">{formatMT(p.amount)}</p>
                      <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${st.className}`}>
                        {st.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="flex items-start gap-2 text-xs leading-5 text-dark-muted">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brandGlow" />
          Um pagamento só conta depois de aparecer como “Confirmado”.
        </p>
      </div>
    </div>
  );
}
