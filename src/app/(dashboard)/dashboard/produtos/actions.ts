"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";

export type ProductActionState = { error: string | null };

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const n = Number(str.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function createProduct(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const { businessId } = await getBusinessContext();
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const costPrice = parseOptionalNumber(formData.get("cost_price"));
  const sellingPrice = parseOptionalNumber(formData.get("selling_price"));
  const initialStock = Number(formData.get("initial_stock") ?? 0) || 0;
  const lowStockThreshold = Number(formData.get("low_stock_threshold") ?? 5) || 5;

  if (!name) {
    return { error: "O nome do produto é obrigatório." };
  }
  if (sellingPrice === null || sellingPrice < 0) {
    return { error: "Indique um preço de venda válido." };
  }

  const { data, error } = await supabase.rpc("create_product", {
    p_business_id: businessId,
    p_name: name,
    p_category_id: categoryId as string,
    p_cost_price: costPrice as number,
    p_selling_price: sellingPrice,
    p_initial_stock: initialStock,
    p_low_stock_threshold: lowStockThreshold,
  });

  if (error) {
    return { error: "Não foi possível criar o produto. Tente novamente." };
  }

  revalidatePath("/dashboard/produtos");
  redirect(`/dashboard/produtos/${data.id}`);
}

export async function updateProduct(
  productId: string,
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const costPrice = parseOptionalNumber(formData.get("cost_price"));
  const sellingPrice = parseOptionalNumber(formData.get("selling_price"));
  const lowStockThreshold = Number(formData.get("low_stock_threshold") ?? 5) || 5;

  if (!name) {
    return { error: "O nome do produto é obrigatório." };
  }
  if (sellingPrice === null || sellingPrice < 0) {
    return { error: "Indique um preço de venda válido." };
  }

  // Nunca inclui stock_quantity aqui — stock só muda via RPC adjust_stock,
  // para manter stock_movements como registo de auditoria fiel (RF-30/RF-31).
  const { error } = await supabase
    .from("products")
    .update({
      name,
      category_id: categoryId,
      cost_price: costPrice,
      selling_price: sellingPrice,
      low_stock_threshold: lowStockThreshold,
    })
    .eq("id", productId);

  if (error) {
    return { error: "Não foi possível guardar. Confirme que tem permissão de administrador." };
  }

  revalidatePath("/dashboard/produtos");
  revalidatePath(`/dashboard/produtos/${productId}`);
  return { error: null };
}

export async function toggleProductActive(productId: string, nextValue: boolean) {
  const supabase = createClient();
  await supabase.from("products").update({ is_active: nextValue }).eq("id", productId);
  revalidatePath("/dashboard/produtos");
  revalidatePath(`/dashboard/produtos/${productId}`);
}

export async function adjustStock(
  productId: string,
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const supabase = createClient();

  const type = String(formData.get("type") ?? "");
  const quantityRaw = Number(formData.get("quantity") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || null;

  if (type !== "entrada" && type !== "ajuste") {
    return { error: "Tipo de movimento inválido." };
  }
  if (!quantityRaw || quantityRaw === 0) {
    return { error: "Indique uma quantidade." };
  }

  // Para "ajuste" o utilizador escolhe direção (+/-) no formulário;
  // para "entrada" a quantidade é sempre positiva.
  const quantity = type === "entrada" ? Math.abs(quantityRaw) : quantityRaw;

  const { error } = await supabase.rpc("adjust_stock", {
    p_product_id: productId,
    p_type: type,
    p_quantity: quantity,
    p_note: note ?? undefined,
  });

  if (error) {
    return {
      error:
        error.message.includes("insuficiente")
          ? "Stock insuficiente para este ajuste."
          : "Não foi possível registar o movimento.",
    };
  }

  revalidatePath(`/dashboard/produtos/${productId}`);
  revalidatePath("/dashboard/produtos");
  return { error: null };
}

export async function createCategory(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const { businessId } = await getBusinessContext();
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "O nome da categoria é obrigatório." };
  }

  const { error } = await supabase.from("categories").insert({ business_id: businessId, name });

  if (error) {
    return {
      error: error.message.includes("duplicate")
        ? "Já existe uma categoria com este nome."
        : "Não foi possível criar a categoria.",
    };
  }

  revalidatePath("/dashboard/produtos/categorias");
  revalidatePath("/dashboard/produtos/novo");
  return { error: null };
}
