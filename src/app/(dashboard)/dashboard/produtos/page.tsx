import Link from "next/link";
import { ChevronRight, Package, Plus, Search, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { Panel } from "@/components/dashboard/Panel";
import { PRIMARY_LINK, ProductsHeader, ProductsShell, StockStatus, stockState } from "./_components/ProductsUI";

function formatMT(value: number) {
  return `${Math.round(value).toLocaleString("pt-MZ")} MT`;
}

const CHIP: Record<"out" | "low" | "ok", string> = {
  out: "bg-danger/10 text-danger",
  low: "bg-warning/10 text-warning",
  ok: "bg-brandGlow/10 text-brandGlow",
};

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

  const count = products?.length ?? 0;
  const subtitle = query
    ? `${count} resultado${count === 1 ? "" : "s"} para “${query}”`
    : `${count} produto${count === 1 ? "" : "s"} no catálogo`;

  return (
    <ProductsShell>
      <ProductsHeader
        title="Produtos"
        subtitle={subtitle}
        action={
          role === "admin" ? (
            <Link href="/dashboard/produtos/novo" className={PRIMARY_LINK}>
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" aria-hidden />
              Novo produto
            </Link>
          ) : undefined
        }
      />

      <div className="space-y-3">
        <form className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-faint" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Pesquisar produto…"
            aria-label="Pesquisar produto"
            enterKeyHint="search"
            className="w-full rounded-xl border border-dark-border bg-dark-surface py-3 pl-10 pr-4 text-base text-dark-text placeholder:text-dark-faint outline-none transition-all duration-200 [color-scheme:dark] focus:border-brandGlow/50 focus:ring-2 focus:ring-brandGlow/15"
          />
        </form>

        {role === "admin" && (
          <Link
            href="/dashboard/produtos/categorias"
            className="group flex items-center justify-between gap-3 rounded-xl border border-dark-border bg-white/[0.02] px-4 py-3 text-sm font-medium text-dark-muted transition-colors hover:border-dark-borderStrong hover:text-dark-text"
          >
            <span className="flex items-center gap-2.5">
              <Tag className="h-4 w-4 text-brandGlow" aria-hidden />
              Gerir categorias
            </span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        )}
      </div>

      {products?.length === 0 && (
        <Panel className="px-6 py-10 text-center sm:py-14">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
            <Package className="h-5 w-5 text-dark-muted" aria-hidden />
          </span>
          <p className="mt-4 text-dark-muted">{query ? "Nenhum produto encontrado." : "Ainda não há produtos."}</p>
          {role === "admin" && !query && (
            <Link
              href="/dashboard/produtos/novo"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand/90 active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Criar o primeiro produto
            </Link>
          )}
        </Panel>
      )}

      <ul className="grid gap-3 xl:grid-cols-2">
        {products?.map((product) => (
          <li key={product.id} className="min-w-0">
            <Link
              href={`/dashboard/produtos/${product.id}`}
              className={`group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-brandGlow/50 ${
                !product.is_active ? "opacity-60" : ""
              }`}
            >
              <Panel as="div" className="p-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 sm:p-4">
                <div className="flex items-center gap-3.5">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      CHIP[stockState(product.stock_quantity, product.low_stock_threshold)]
                    }`}
                  >
                    <Package className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-dark-text">{product.name}</p>
                    <p className="text-sm text-dark-muted">{product.stock_quantity} em stock</p>
                    {!product.is_active && (
                      <span className="mt-1 inline-block rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-dark-muted">
                        Desativado
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <p className="font-semibold tabular-nums text-dark-text">{formatMT(product.selling_price)}</p>
                    <StockStatus quantity={product.stock_quantity} threshold={product.low_stock_threshold} />
                  </div>
                  <ChevronRight className="hidden h-4 w-4 shrink-0 text-dark-faint transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden />
                </div>
              </Panel>
            </Link>
          </li>
        ))}
      </ul>
    </ProductsShell>
  );
}
