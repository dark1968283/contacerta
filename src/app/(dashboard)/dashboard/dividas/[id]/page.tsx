import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMT } from "@/lib/format";
import { PaymentForm } from "./PaymentForm";
import { DebtReminder } from "./DebtReminder";
import { getBusinessContext } from "@/lib/supabase/business";

const statusLabel = { pendente: "Pendente", parcial: "Parcial", paga: "Paga", vencida: "Vencida" };
const methodLabel = { dinheiro: "Dinheiro", mpesa: "M-Pesa", emola: "e-Mola", transferencia: "Transferência", outro: "Outro" };

export default async function DividaDetalhePage({ params }: { params: { id: string } }) {
  const { businessId } = await getBusinessContext();
  const supabase = createClient();
  const { data: debt } = await supabase.from("debts").select("id, customer_id, sale_id, total_amount, amount_paid, status, created_at").eq("id", params.id).eq("business_id", businessId).single();
  if (!debt) notFound();

  const [{ data: customer }, { data: sale }, { data: payments }] = await Promise.all([
    supabase.from("customers").select("id, name, phone").eq("id", debt.customer_id).eq("business_id", businessId).single(),
    supabase.from("sales").select("id, created_at, total_amount").eq("id", debt.sale_id).eq("business_id", businessId).single(),
    supabase.from("debt_payments").select("id, amount, payment_method, created_at").eq("debt_id", debt.id).eq("business_id", businessId).order("created_at", { ascending: false }),
  ]);
  const remaining = debt.total_amount - debt.amount_paid;

  return (
    <div className="space-y-6">
      <div><Link href="/dashboard/dividas" className="text-sm text-ink/60">← Dívidas</Link><h1 className="mt-2 text-xl font-semibold text-ink">Dívida de {customer?.name ?? "cliente"}</h1><p className="mt-1 text-sm text-ink/60">Venda relacionada: {sale ? `${formatMT(sale.total_amount)} · ${new Date(sale.created_at).toLocaleDateString("pt-MZ")}` : debt.sale_id}</p></div>
      <section className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-line bg-white p-4"><p className="text-xs text-ink/50">Valor total</p><p className="mt-1 font-semibold text-ink">{formatMT(debt.total_amount)}</p></div><div className="rounded-xl border border-line bg-white p-4"><p className="text-xs text-ink/50">Valor pago</p><p className="mt-1 font-semibold text-ink">{formatMT(debt.amount_paid)}</p></div><div className="rounded-xl border border-line bg-white p-4"><p className="text-xs text-ink/50">Saldo</p><p className="mt-1 font-semibold text-ink">{formatMT(remaining)}</p></div><div className="rounded-xl border border-line bg-white p-4"><p className="text-xs text-ink/50">Estado</p><p className="mt-1 font-semibold text-ink">{statusLabel[debt.status]}</p></div></section>
      <PaymentForm debtId={debt.id} remaining={remaining} />
      {remaining > 0 && <DebtReminder customerId={debt.customer_id} customerName={customer?.name ?? "cliente"} phone={customer?.phone ?? null} remaining={remaining} />}
      <section className="space-y-3"><h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Histórico de pagamentos</h2>{payments?.length === 0 && <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink/50">Esta dívida ainda não possui pagamentos.</p>}<div className="space-y-2">{payments?.map((payment) => <div key={payment.id} className="flex justify-between rounded-xl border border-line bg-white p-3"><div><p className="font-medium text-ink">{methodLabel[payment.payment_method]}</p><p className="text-sm text-ink/60">{new Date(payment.created_at).toLocaleDateString("pt-MZ", { day: "2-digit", month: "long", year: "numeric" })}</p></div><strong className="text-brand">{formatMT(payment.amount)}</strong></div>)}</div></section>
    </div>
  );
}
