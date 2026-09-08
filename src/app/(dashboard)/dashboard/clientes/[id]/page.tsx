import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { formatMT } from "@/lib/format";
import { EditCustomerForm } from "./EditCustomerForm";
import Link from "next/link";

export default async function ClienteDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const { role, businessId } = await getBusinessContext();
  const supabase = createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", params.id)
    .eq("business_id", businessId)
    .single();

  if (!customer) {
    notFound();
  }

  const [{ data: sales }, { data: debts }] = await Promise.all([
    supabase
      .from("sales")
      .select("id, total_amount, created_at")
      .eq("customer_id", params.id)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
    supabase
      .from("debts")
      .select("id, total_amount, amount_paid")
      .eq("customer_id", params.id)
      .eq("business_id", businessId)
      .in("status", ["pendente", "parcial", "vencida"]),
  ]);
  const saleIds = sales?.map((sale) => sale.id) ?? [];
  const { data: saleItems } = saleIds.length
    ? await supabase.from("sale_items").select("product_id, quantity").in("sale_id", saleIds)
    : { data: [] };
  const productIds = [...new Set(saleItems?.map((item) => item.product_id) ?? [])];
  const { data: products } = productIds.length
    ? await supabase.from("products").select("id, name").eq("business_id", businessId).in("id", productIds)
    : { data: [] };
  const productNames = new Map((products ?? []).map((product) => [product.id, product.name]));
  const purchasedProducts = new Map<string, { name: string; quantity: number }>();
  saleItems?.forEach((item) => {
    const name = productNames.get(item.product_id);
    if (!name) return;
    const product = purchasedProducts.get(item.product_id) ?? { name, quantity: 0 };
    product.quantity += item.quantity;
    purchasedProducts.set(item.product_id, product);
  });
  const totalPurchased = sales?.reduce((total: number, sale: { total_amount: number }) => total + sale.total_amount, 0) ?? 0;
  const currentDebt = debts?.reduce((total: number, debt: { total_amount: number; amount_paid: number }) => total + debt.total_amount - debt.amount_paid, 0) ?? 0;
  const openDebtCount = debts?.length ?? 0;
  const lastSale = sales?.[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-ink">{customer.name}</h1>
        {customer.phone && <p className="mt-1 text-ink/60">{customer.phone}</p>}
      </div>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-xs text-ink/50">Total comprado</p>
          <p className="mt-1 text-lg font-semibold text-ink">{formatMT(totalPurchased)}</p>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-xs text-ink/50">Dívida atual</p>
          <p className="mt-1 text-lg font-semibold text-ink">{formatMT(currentDebt)}</p>
          {openDebtCount > 0 && <p className="mt-1 text-xs text-ink/50">{openDebtCount} dívida{openDebtCount === 1 ? "" : "s"} aberta{openDebtCount === 1 ? "" : "s"}</p>}
        </div>
      </section>

      {openDebtCount > 0 && <Link href={`/dashboard/dividas?customer=${params.id}`} className="block text-sm font-medium text-brand">Ver dívidas deste cliente →</Link>}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
          Última compra
        </h2>
        <p className="text-ink/50">{lastSale ? `${formatMT(lastSale.total_amount)} em ${new Date(lastSale.created_at).toLocaleDateString("pt-MZ")}` : "Ainda não existem compras."}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
          Produtos comprados
        </h2>
        {purchasedProducts.size === 0 ? (
          <p className="text-ink/50">Ainda não existem produtos comprados.</p>
        ) : (
          <div className="space-y-2">
            {[...purchasedProducts.values()].sort((a, b) => a.name.localeCompare(b.name, "pt")).map((product) => (
              <div key={product.name} className="flex justify-between rounded-xl border border-line bg-white p-3 text-sm">
                <span className="font-medium text-ink">{product.name}</span>
                <span className="text-ink/60">{product.quantity} unidade{product.quantity === 1 ? "" : "s"}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {role === "admin" && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
            Editar dados
          </h2>
          <EditCustomerForm customer={customer} />
        </section>
      )}
    </div>
  );
}
