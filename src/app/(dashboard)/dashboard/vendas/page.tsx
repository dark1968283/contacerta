import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMT } from "@/lib/format";

export default async function VendasPage() {
  const supabase = createClient();
  const { data: sales } = await supabase.from("sales").select("id, total_amount, payment_method, created_at, customers(name)").order("created_at", { ascending: false }).limit(50);

  return <div className="space-y-5"><div className="flex items-center justify-between"><h1 className="text-xl font-semibold text-ink">Vendas</h1><Link href="/dashboard/vendas/nova" className="text-sm font-medium text-brand">+ Nova</Link></div><div className="space-y-2">{sales?.length === 0 && <div className="rounded-xl border border-dashed border-line p-6 text-center text-ink/50"><p>Ainda não há vendas.</p><Link href="/dashboard/vendas/nova" className="mt-2 inline-block font-medium text-brand">Registar a primeira venda</Link></div>}{sales?.map((sale) => { const customer = sale.customers as unknown as { name: string } | null; return <div key={sale.id} className="flex items-center justify-between rounded-xl border border-line bg-white p-4"><div><p className="font-medium text-ink">{sale.payment_method === "credito" ? "Venda a crédito" : "Venda paga"}</p><p className="text-sm text-ink/60">{customer?.name ?? "Cliente avulso"} · {new Date(sale.created_at).toLocaleDateString("pt-MZ", { day: "2-digit", month: "short", year: "numeric" })}</p></div><span className="font-semibold text-ink">{formatMT(sale.total_amount)}</span></div>; })}</div></div>;
}
