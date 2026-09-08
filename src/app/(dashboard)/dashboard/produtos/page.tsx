import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { StockBadge } from "@/components/ui/StockBadge";

function formatMT(value: number) {
  return `${Math.round(value).toLocaleString("pt-MZ")} MT`;
}

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const { role } = await getBusinessContext();
  const supabase = createClient();
  const query = searchParams.q?.trim() ?? "";

  let productsQuery = supabase
    .from("products")
    .select("id, name, selling_price, stock_quantity, low_stock_threshold, is_active")
    .order("name");

  if (query) {
    productsQuery = productsQuery.ilike("name", `%${query}%`);
  }

  const { data: products } = await productsQuery;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Produtos</h1>
        {role === "admin" && (
          <Link href="/dashboard/produtos/novo" className="text-sm font-medium text-brand">
            + Novo
          </Link>
        )}
      </div>

      <form className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Pesquisar produto…"
          className="input-field"
        />
      </form>

      {role === "admin" && (
        <Link href="/dashboard/produtos/categorias" className="block text-sm text-ink/60">
          Gerir categorias →
        </Link>
      )}

      <div className="space-y-2">
        {products?.length === 0 && (
          <p className="py-8 text-center text-ink/50">
            {query ? "Nenhum produto encontrado." : "Ainda não há produtos."}
          </p>
        )}

        {products?.map((product) => (
          <Link
            key={product.id}
            href={`/dashboard/produtos/${product.id}`}
            className={`flex items-center justify-between rounded-xl border border-line bg-white p-4 ${
              !product.is_active ? "opacity-50" : ""
            }`}
          >
            <div>
              <p className="font-medium text-ink">{product.name}</p>
              <p className="text-sm text-ink/60">
                {formatMT(product.selling_price)} · {product.stock_quantity} em stock
              </p>
            </div>
            <StockBadge
              quantity={product.stock_quantity}
              threshold={product.low_stock_threshold}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
