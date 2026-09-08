import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { NewProductForm } from "./NewProductForm";

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
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">Novo produto</h1>
      <NewProductForm categories={categories ?? []} />
    </div>
  );
}
