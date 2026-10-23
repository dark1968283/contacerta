import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Clock3, MessageCircle, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { formatMT } from "@/lib/format";
import { BUSINESS_TIMEZONE } from "@/lib/timezone";
import { buildReceiptText, whatsappLink } from "@/lib/receipt";
import { Panel } from "@/components/dashboard/Panel";
import { SalesShell } from "../_components/SalesShell";

export default async function VendaDetalhePage({ params }: { params: { id: string } }) {
  const { businessName } = await getBusinessContext();
  const supabase = createClient();

  const { data: sale } = await supabase
    .from("sales")
    .select("id, total_amount, payment_method, created_at, created_by, customer_id, customers(name, phone)")
    .eq("id", params.id)
    .maybeSingle();

  if (!sale) notFound();

  const [{ data: items }, { data: debt }, { data: seller }] = await Promise.all([
    supabase.from("sale_items").select("product_id, quantity, unit_price, products(name)").eq("sale_id", sale.id),
    supabase.from("debts").select("id, status, total_amount, amount_paid").eq("sale_id", sale.id).maybeSingle(),
    supabase.from("users").select("name").eq("id", sale.created_by).maybeSingle(),
  ]);

  const customer = sale.customers as unknown as { name: string; phone: string | null } | null;
  const credit = sale.payment_method === "credito";
  const total = Number(sale.total_amount);
  const date = new Date(sale.created_at);

  const lines = (items ?? []).map((item) => ({
    name: (item.products as unknown as { name: string } | null)?.name ?? "Produto",
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
  }));

  const receipt = buildReceiptText({
    businessName,
    createdAt: sale.created_at,
    lines,
    total,
    paymentMethod: sale.payment_method,
    customerName: customer?.name,
  });

  const debtRemaining = debt ? Math.max(0, Number(debt.total_amount) - Number(debt.amount_paid)) : 0;

  return (
    <SalesShell>
      <Link
        href="/dashboard/vendas"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-dark-muted transition-colors hover:text-dark-text"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Vendas
      </Link>

      <div className="mx-auto max-w-lg space-y-4">
        {/* Recibo */}
        <Panel className="overflow-hidden p-0">
          <div className="border-b border-dashed border-dark-border px-5 py-6 text-center">
            <span
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                credit ? "bg-warning/15 text-warning" : "bg-brandGlow/15 text-brandGlow"
              }`}
            >
              {credit ? <Clock3 className="h-6 w-6" aria-hidden /> : <CheckCircle2 className="h-6 w-6" aria-hidden />}
            </span>
            <p className="mt-3 text-4xl font-bold tabular-nums text-dark-text">{formatMT(total)}</p>
            <p className={`mt-1 text-sm font-semibold ${credit ? "text-warning" : "text-brandGlow"}`}>
              {credit ? "Vendido a crédito" : "Pago"}
            </p>
            <p className="mt-2 text-sm text-dark-muted">
              {date.toLocaleDateString("pt-MZ", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: BUSINESS_TIMEZONE,
              })}{" "}
              às{" "}
              {date.toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit", timeZone: BUSINESS_TIMEZONE })}
            </p>
          </div>

          <ul className="divide-y divide-dark-border px-5">
            {lines.map((line, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-dark-text">{line.name}</span>
                  <span className="block text-sm tabular-nums text-dark-muted">
                    {line.quantity} × {formatMT(line.unitPrice)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-dark-text">
                  {formatMT(line.quantity * line.unitPrice)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-dashed border-dark-border px-5 py-4">
            <span className="text-dark-muted">Total</span>
            <span className="text-xl font-bold tabular-nums text-dark-text">{formatMT(total)}</span>
          </div>

          <dl className="space-y-2 border-t border-dark-border bg-white/[0.02] px-5 py-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-dark-muted">Cliente</dt>
              <dd className="text-right font-medium text-dark-text">
                {sale.customer_id ? (
                  <Link href={`/dashboard/clientes/${sale.customer_id}`} className="hover:underline">
                    {customer?.name ?? "Cliente"}
                  </Link>
                ) : (
                  "Cliente avulso"
                )}
              </dd>
            </div>
            {seller?.name && (
              <div className="flex justify-between gap-3">
                <dt className="text-dark-muted">Vendido por</dt>
                <dd className="text-right font-medium text-dark-text">{seller.name}</dd>
              </div>
            )}
          </dl>
        </Panel>

        {/* Dívida ligada a esta venda */}
        {debt && (
          <Link
            href={`/dashboard/dividas/${debt.id}`}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition ${
              debtRemaining > 0
                ? "border-warning/25 bg-warning/[0.07] hover:bg-warning/[0.11]"
                : "border-brandGlow/20 bg-brandGlow/[0.06] hover:bg-brandGlow/[0.1]"
            }`}
          >
            <UserRound className={`h-5 w-5 shrink-0 ${debtRemaining > 0 ? "text-warning" : "text-brandGlow"}`} aria-hidden />
            <span className="min-w-0 flex-1 text-sm">
              <span className="block font-semibold text-dark-text">
                {debtRemaining > 0 ? `Ainda deve ${formatMT(debtRemaining)}` : "Dívida já paga"}
              </span>
              <span className="block text-dark-muted">Ver a dívida desta venda</span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-dark-muted" aria-hidden />
          </Link>
        )}

        <a
          href={whatsappLink(receipt, customer?.phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.04] px-5 py-4 text-base font-semibold text-dark-text transition hover:bg-white/[0.07] active:scale-[0.98]"
        >
          <MessageCircle className="h-5 w-5 text-[#25D366]" aria-hidden />
          Enviar recibo por WhatsApp
        </a>
      </div>
    </SalesShell>
  );
}
