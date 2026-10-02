import Link from "next/link";
import { redirect } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { NewProductForm } from "./NewProductForm";
import { GHOST_LINK, ProductsHeader, ProductsShell } from "../_components/ProductsUI";

export default async function NovoProdutoPage() {
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
        title="Novo produto"
        subtitle="Preencha os dados para adicionar o produto ao catálogo."
        action={
          <Link href="/dashboard/produtos" className={GHOST_LINK}>
            <X className="h-4 w-4" aria-hidden />
            Cancelar
          </Link>
        }
      />
      <NewProductForm categories={categories ?? []} />
    </ProductsShell>
  );
}
