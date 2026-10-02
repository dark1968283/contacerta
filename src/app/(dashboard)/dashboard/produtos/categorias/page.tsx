import { redirect } from "next/navigation";
import { Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { Panel } from "@/components/dashboard/Panel";
import { NewCategoryForm } from "./NewCategoryForm";
import { ProductsHeader, ProductsShell, SectionTitle } from "../_components/ProductsUI";

export default async function CategoriasPage() {
  const { role } = await getBusinessContext();

  if (role !== "admin") {
    redirect("/dashboard/produtos");
  }

  const supabase = createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <ProductsShell narrow>
      <ProductsHeader
        title="Categorias"
        subtitle="Agrupe os produtos para os encontrar mais depressa."
        back={{ href: "/dashboard/produtos", label: "Produtos" }}
      />

      <section>
        <SectionTitle icon={Tag}>Nova categoria</SectionTitle>
        <Panel as="div" className="p-4 sm:p-5">
          <NewCategoryForm />
        </Panel>
      </section>

      <section>
        <SectionTitle>As suas categorias</SectionTitle>

        {categories?.length === 0 && (
          <Panel as="div" className="px-6 py-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
              <Tag className="h-5 w-5 text-dark-muted" aria-hidden />
            </span>
            <p className="mt-4 text-dark-muted">Ainda não há categorias.</p>
          </Panel>
        )}

        <ul className="grid gap-2.5 sm:grid-cols-2">
          {categories?.map((c) => (
            <li key={c.id} className="min-w-0">
              <Panel as="div" className="p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brandGlow/10 text-brandGlow">
                    <Tag className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 break-words font-medium text-dark-text">{c.name}</span>
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      </section>
    </ProductsShell>
  );
}
