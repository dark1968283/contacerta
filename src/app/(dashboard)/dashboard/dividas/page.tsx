import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMT } from "@/lib/format";

const statusLabel: Record<string, string> = { pendente: "Pendente", parcial: "Parcial", paga: "Paga", vencida: "Vencida" };

export default async function DividasPage({ searchParams }: { searchParams: { customer?: string } }) {
  const supabase = createClient();
  let debtsQuery = supabase.from("debts").select("id, customer_id, sale_id, total_amount, amount_paid, status, created_at").order("created_at", { ascending: false });
  if (searchParams.customer) debtsQuery = debtsQuery.eq("customer_id", searchParams.customer);
  const [{ data: debts }, { data: customers }] = await Promise.all([
    debtsQuery,
    supabase.from("customers").select("id, name"),
  ]);
  const customerNames = new Map((customers ?? []).map((customer) => [customer.id, customer.name]));

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-semibold text-ink">DÃ­vidas</h1><p className="mt-1 text-sm text-ink/60">Acompanhe os valores a receber.</p></div>
      <div className="space-y-2">
        {debts?.length === 0 && <p className="rounded-xl border border-dashed border-line p-6 text-center text-ink/50">Ainda nÃ£o hÃ¡ dÃ­vidas registadas.</p>}
        {debts?.map((debt) => {
          const remaining = debt.total_amount - debt.amount_paid;
          return <Link key={debt.id} href={`/dashboard/dividas/${debt.id}`} className="block rounded-xl border border-line bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-ink">{customerNames.get(debt.customer_id) ?? "Cliente"}</p><p className="text-sm text-ink/60">Venda de {new Date(debt.created_at).toLocaleDateString("pt-MZ")}</p></div><span className={`rounded-full px-2 py-1 text-xs font-medium ${debt.status === "paga" ? "bg-brand/10 text-brand" : "bg-alert/10 text-alert"}`}>{statusLabel[debt.status]}</span></div><div className="mt-3 flex justify-between text-sm"><span className="text-ink/60">Saldo</span><strong className="text-ink">{formatMT(remaining)}</strong></div></Link>;
        })}
      </div>
    </div>
  );
}
