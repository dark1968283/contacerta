import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { NewCategoryForm } from "./NewCategoryForm";

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
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">Categorias</h1>

      <NewCategoryForm />

      <div className="space-y-2">
        {categories?.length === 0 && (
          <p className="py-6 text-center text-ink/50">Ainda não há categorias.</p>
        )}
        {categories?.map((c) => (
          <div key={c.id} className="rounded-xl border border-line bg-white p-4">
            {c.name}
          </div>
        ))}
      </div>
    </div>
  );
}
