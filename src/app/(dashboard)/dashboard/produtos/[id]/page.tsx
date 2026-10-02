import { notFound } from "next/navigation";
import { AlertTriangle, ArrowDownToLine, History, Package, Pencil, PackagePlus, Power, ShoppingCart, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { BUSINESS_TIMEZONE } from "@/lib/timezone";
import { Panel } from "@/components/dashboard/Panel";
import { EditProductForm } from "./EditProductForm";
import { StockAdjustmentForm } from "./StockAdjustmentForm";
import { ToggleActiveButton } from "./ToggleActiveButton";
import { ProductsHeader, ProductsShell, SectionTitle, StockStatus, stockState } from "../_components/ProductsUI";

function formatMT(value: number) {
  return `${Math.round(value).toLocaleString("pt-MZ")} MT`;
}

const movementLabel: Record<string, string> = {
  entrada: "Entrada",
  ajuste: "Ajuste",
  venda: "Venda",
};

const movementIcon: Record<string, LucideIcon> = {
  entrada: ArrowDownToLine,
  ajuste: SlidersHorizontal,
  venda: ShoppingCart,
};

export default async function ProdutoDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const { role } = await getBusinessContext();
  const supabase = createClient();

 const { data: product, error: productError } = await supabase
  .from("products")
  .select(`
    *,
    categories!products_category_id_fkey(name)
  `)
  .eq("id", params.id)
  .single();



  if (!product) {

    notFound();
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  const { data: movements } = await supabase
    .from("stock_movements")
    .select("id, type, quantity, note, created_at")
    .eq("product_id", params.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const isAdmin = role === "admin";

  const categoryName = (product.categories as unknown as { name: string } | null)?.name;
  const state = stockState(product.stock_quantity, product.low_stock_threshold);
  const stockTone = state === "out" ? "text-danger" : state === "low" ? "text-warning" : "text-dark-text";

  return (
    <ProductsShell>
      <ProductsHeader back={{ href: "/dashboard/produtos", label: "Produtos" }} />

      {/* Resumo */}
      <Panel as="div" className="p-4 sm:p-6" glowClassName="bg-brandGlow/15" edgeClassName="via-brandGlow/40">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="min-w-0 break-words text-xl font-semibold tracking-tight text-dark-text sm:text-2xl">
            {product.name}
          </h1>
          <StockStatus quantity={product.stock_quantity} threshold={product.low_stock_threshold} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/[0.03] p-3.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-dark-faint">Preço de venda</dt>
            <dd className="mt-1 break-words text-lg font-bold tabular-nums text-dark-text sm:text-xl">
              {formatMT(product.selling_price)}
            </dd>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-3.5">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-dark-faint">Em stock</dt>
            <dd className={`mt-1 text-lg font-bold tabular-nums sm:text-xl ${stockTone}`}>{product.stock_quantity}</dd>
          </div>
          <div className="col-span-2 rounded-xl bg-white/[0.03] p-3.5 sm:col-span-1">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-dark-faint">Categoria</dt>
            <dd className={`mt-1 break-words text-base font-semibold sm:text-lg ${categoryName ? "text-dark-text" : "text-dark-faint"}`}>
              {categoryName ?? "Sem categoria"}
            </dd>
          </div>
        </dl>

        {!product.is_active && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-warning/10 p-3 text-sm text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            Este produto está desativado.
          </p>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {isAdmin && (
          <div className="space-y-6">
            <section>
              <SectionTitle icon={PackagePlus}>Registar movimento de stock</SectionTitle>
              <StockAdjustmentForm productId={product.id} />
            </section>

            <section>
              <SectionTitle icon={Pencil}>Editar produto</SectionTitle>
              <EditProductForm product={product} categories={categories ?? []} />
            </section>

            <section>
              <SectionTitle icon={Power}>Estado do produto</SectionTitle>
              <Panel as="div" className="p-4 sm:p-5">
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-dark-muted">
                    {product.is_active
                      ? "Um produto desativado deixa de aparecer na lista de uma nova venda."
                      : "Reativar volta a mostrar este produto numa nova venda."}
                  </p>
                  <ToggleActiveButton productId={product.id} isActive={product.is_active} />
                </div>
              </Panel>
            </section>
          </div>
        )}

        <section className={isAdmin ? "" : "lg:col-span-2"}>
          <SectionTitle icon={History}>Histórico de movimentos</SectionTitle>

          {movements?.length === 0 && (
            <Panel as="div" className="px-6 py-10 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
                <Package className="h-5 w-5 text-dark-muted" aria-hidden />
              </span>
              <p className="mt-4 text-dark-muted">Ainda não há movimentos registados.</p>
            </Panel>
          )}

          {!!movements?.length && (
            <Panel as="div" className="px-4 py-1 sm:px-5">
              <ul className="divide-y divide-dark-border">
                {movements.map((m) => {
                  const Icon = movementIcon[m.type] ?? Package;
                  const positive = m.quantity > 0;
                  return (
                    <li key={m.id} className="flex items-center gap-3 py-3.5">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          positive ? "bg-brandGlow/10 text-brandGlow" : "bg-danger/10 text-danger"
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px]" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium text-dark-text">
                          {movementLabel[m.type] ?? m.type}
                          {m.note ? ` — ${m.note}` : ""}
                        </p>
                        <p className="text-xs text-dark-faint">
                          {new Date(m.created_at).toLocaleDateString("pt-MZ", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: BUSINESS_TIMEZONE,
                          })}
                        </p>
                      </div>
                      <span className={`shrink-0 text-base font-semibold tabular-nums ${positive ? "text-brandGlow" : "text-danger"}`}>
                        {positive ? "+" : ""}
                        {m.quantity}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
        </section>
      </div>
    </ProductsShell>
  );
}
