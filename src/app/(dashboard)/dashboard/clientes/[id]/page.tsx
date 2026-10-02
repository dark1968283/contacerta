import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Mail, MapPin, Package, Pencil, Phone, Receipt, ShoppingCart, Users, Wallet, WalletCards } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { formatMT } from "@/lib/format";
import { Panel } from "@/components/dashboard/Panel";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { EditCustomerForm } from "./EditCustomerForm";
import { CustomerAvatar, CustomersHeader, CustomersShell, SectionTitle } from "../_components/CustomersUI";

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
    <CustomersShell>
      <CustomersHeader back={{ href: "/dashboard/clientes", label: "Clientes" }} />

      {/* Perfil */}
      <Panel as="div" className="p-4 sm:p-6" glowClassName="bg-brandGlow/15" edgeClassName="via-brandGlow/40">
        <div className="flex items-center gap-4">
          <CustomerAvatar name={customer.name} size="lg" />
          <div className="min-w-0">
            <h1 className="break-words text-xl font-semibold tracking-tight text-dark-text sm:text-2xl">{customer.name}</h1>
            {customer.phone && (
              <p className="mt-1 flex items-center gap-2 text-sm text-dark-muted">
                <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="break-words">{customer.phone}</span>
              </p>
            )}
          </div>
        </div>
        {(customer.email || customer.address) && (
          <div className="mt-4 flex flex-col gap-2 border-t border-dark-border pt-4 text-sm text-dark-muted">
            {customer.email && (
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-dark-faint" aria-hidden />
                <span className="min-w-0 break-all">{customer.email}</span>
              </p>
            )}
            {customer.address && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-dark-faint" aria-hidden />
                <span className="min-w-0 break-words">{customer.address}</span>
              </p>
            )}
          </div>
        )}
      </Panel>

      {/* Métricas */}
      <section aria-label="Resumo do cliente" className="grid grid-cols-2 gap-3 sm:gap-4">
        <MetricCard
          label="Total comprado"
          value={formatMT(totalPurchased)}
          icon={ShoppingCart}
          accent="brand"
          featured
        />
        <MetricCard
          label="Dívida atual"
          value={formatMT(currentDebt)}
          icon={Wallet}
          accent={openDebtCount > 0 ? "warn" : "neutral"}
          valueTone={openDebtCount > 0 ? "warn" : "muted"}
          hint={
            openDebtCount > 0
              ? `${openDebtCount} dívida${openDebtCount === 1 ? "" : "s"} aberta${openDebtCount === 1 ? "" : "s"}`
              : undefined
          }
        />
      </section>

      {openDebtCount > 0 && (
        <Link
          href={`/dashboard/dividas?customer=${params.id}`}
          className="group flex items-center justify-between gap-3 rounded-2xl border border-warning/25 bg-warning/[0.06] p-4 outline-none transition-colors hover:bg-warning/10 focus-visible:ring-2 focus-visible:ring-warning/50"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <WalletCards className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-sm font-medium text-dark-text">Ver dívidas deste cliente</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-warning transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className={`space-y-6 ${role === "admin" ? "" : "lg:col-span-2"}`}>
          <section>
            <SectionTitle icon={Receipt}>Última compra</SectionTitle>
            <Panel as="div" className="p-4 sm:p-5">
              {lastSale ? (
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brandGlow/10 text-brandGlow">
                    <ShoppingCart className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-xl font-bold tabular-nums text-dark-text">{formatMT(lastSale.total_amount)}</p>
                    <p className="text-sm text-dark-muted">{new Date(lastSale.created_at).toLocaleDateString("pt-MZ")}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-dark-muted">Ainda não existem compras.</p>
              )}
            </Panel>
          </section>

          <section>
            <SectionTitle icon={Package}>Produtos comprados</SectionTitle>
            {purchasedProducts.size === 0 ? (
              <Panel as="div" className="px-6 py-10 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
                  <Package className="h-5 w-5 text-dark-muted" aria-hidden />
                </span>
                <p className="mt-4 text-dark-muted">Ainda não existem produtos comprados.</p>
              </Panel>
            ) : (
              <Panel as="div" className="px-4 py-1 sm:px-5">
                <ul className="divide-y divide-dark-border">
                  {[...purchasedProducts.values()].sort((a, b) => a.name.localeCompare(b.name, "pt")).map((product) => (
                    <li key={product.name} className="flex items-center gap-3 py-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-dark-muted">
                        <Package className="h-[18px] w-[18px]" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 break-words text-sm font-medium text-dark-text">{product.name}</span>
                      <span className="shrink-0 text-sm text-dark-muted">
                        <span className="text-base font-semibold tabular-nums text-dark-text">{product.quantity}</span>{" "}
                        unidade{product.quantity === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </section>
        </div>

        {role === "admin" && (
          <section>
            <SectionTitle icon={Pencil}>Editar dados</SectionTitle>
            <EditCustomerForm customer={customer} />
          </section>
        )}
      </div>
    </CustomersShell>
  );
}
