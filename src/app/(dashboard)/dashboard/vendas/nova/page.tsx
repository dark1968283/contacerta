import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewSaleForm } from "./NewSaleForm";

export default async function NovaVendaPage() {
  const supabase = createClient();
  const [{ data: products }, { data: customers }] = await Promise.all([
    supabase.from("products").select("id, name, selling_price, stock_quantity").eq("is_active", true).order("name"),
    supabase.from("customers").select("id, name, phone").order("name"),
  ]);

  return <div className="space-y-5"><div className="flex items-center justify-between"><h1 className="text-xl font-semibold text-ink">Nova venda</h1><Link href="/dashboard/vendas" className="text-sm text-ink/60">Cancelar</Link></div><NewSaleForm products={products ?? []} customers={customers ?? []} /></div>;
}
