import Link from "next/link";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { NewSaleForm } from "./NewSaleForm";
import { SalesHeader, SalesShell } from "../_components/SalesShell";

export default async function NovaVendaPage() {
  const supabase = createClient();
  const { businessName, businessId } = await getBusinessContext();
  const [{ data: products }, { data: customers }, { data: recentItems }] = await Promise.all([
    supabase.from("products").select("id, name, selling_price, stock_quantity").eq("is_active", true).order("name"),
    supabase.from("customers").select("id, name, phone").order("name"),
    // Itens vendidos recentemente: servem só para mostrar primeiro os produtos mais vendidos.
    supabase.from("sale_items").select("product_id, quantity").order("created_at", { ascending: false }).limit(1000),
  ]);

  const soldCount: Record<string, number> = {};
  for (const item of recentItems ?? []) {
    soldCount[item.product_id] = (soldCount[item.product_id] ?? 0) + Number(item.quantity);
  }

  return (
    <SalesShell>
      <SalesHeader
        title="Nova venda"
        subtitle="Toque nos produtos para os adicionar."
        action={
          <Link
            href="/dashboard/vendas"
            className="flex items-center gap-1.5 rounded-xl border border-dark-border bg-white/[0.03] px-3.5 py-2.5 text-sm font-medium text-dark-muted transition-colors hover:border-dark-borderStrong hover:text-dark-text sm:py-3"
          >
            <X className="h-4 w-4" aria-hidden />
            Sair
          </Link>
        }
      />
      <NewSaleForm
        products={products ?? []}
        customers={customers ?? []}
        soldCount={soldCount}
        businessName={businessName}
        businessId={businessId}
      />
    </SalesShell>
  );
}
