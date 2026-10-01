import Link from "next/link";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NewSaleForm } from "./NewSaleForm";
import { SalesHeader, SalesShell } from "../_components/SalesShell";

export default async function NovaVendaPage() {
  const supabase = createClient();
  const [{ data: products }, { data: customers }] = await Promise.all([
    supabase.from("products").select("id, name, selling_price, stock_quantity").eq("is_active", true).order("name"),
    supabase.from("customers").select("id, name, phone").order("name"),
  ]);

  return (
    <SalesShell>
      <SalesHeader
        title="Nova venda"
        subtitle="Adicione produtos, escolha o pagamento e conclua."
        action={
          <Link
            href="/dashboard/vendas"
            className="flex items-center gap-1.5 rounded-xl border border-dark-border bg-white/[0.03] px-3.5 py-2.5 text-sm font-medium text-dark-muted transition-colors hover:border-dark-borderStrong hover:text-dark-text sm:py-3"
          >
            <X className="h-4 w-4" aria-hidden />
            Cancelar
          </Link>
        }
      />
      <NewSaleForm products={products ?? []} customers={customers ?? []} />
    </SalesShell>
  );
}
