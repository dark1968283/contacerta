import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { StockBadge } from "@/components/ui/StockBadge";
import { EditProductForm } from "./EditProductForm";
import { StockAdjustmentForm } from "./StockAdjustmentForm";
import { ToggleActiveButton } from "./ToggleActiveButton";

function formatMT(value: number) {
  return `${Math.round(value).toLocaleString("pt-MZ")} MT`;
}

const movementLabel: Record<string, string> = {
  entrada: "Entrada",
  ajuste: "Ajuste",
  venda: "Venda",
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

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-ink">
            {product.name}
          </h1>

          <StockBadge
            quantity={product.stock_quantity}
            threshold={product.low_stock_threshold}
          />
        </div>

        <p className="mt-1 text-ink/60">
          {formatMT(product.selling_price)} ·{" "}
          {product.stock_quantity} em stock
          {(product.categories as unknown as {
            name: string;
          } | null)?.name
            ? ` · ${
                (
                  product.categories as unknown as {
                    name: string;
                  }
                ).name
              }`
            : ""}
        </p>

        {!product.is_active && (
          <p className="mt-1 text-sm text-alert">
            Este produto está desativado.
          </p>
        )}
      </div>

      {isAdmin && (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
              Registar movimento de stock
            </h2>

            <StockAdjustmentForm productId={product.id} />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
              Editar produto
            </h2>

            <EditProductForm
              product={product}
              categories={categories ?? []}
            />
          </section>

          <ToggleActiveButton
            productId={product.id}
            isActive={product.is_active}
          />
        </>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
          Histórico de movimentos
        </h2>

        {movements?.length === 0 && (
          <p className="text-ink/50">
            Ainda não há movimentos registados.
          </p>
        )}

        <div className="space-y-2">
          {movements?.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-xl border border-line bg-white p-3 text-sm"
            >
              <div>
                <p className="font-medium text-ink">
                  {movementLabel[m.type] ?? m.type}
                  {m.note ? ` — ${m.note}` : ""}
                </p>

                <p className="text-ink/50">
                  {new Date(m.created_at).toLocaleDateString(
                    "pt-MZ",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>

              <span
                className={
                  m.quantity > 0
                    ? "text-brand"
                    : "text-alert"
                }
              >
                {m.quantity > 0 ? "+" : ""}
                {m.quantity}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}