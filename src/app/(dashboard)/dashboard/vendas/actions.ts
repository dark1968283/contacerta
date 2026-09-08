"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getBusinessContext } from "@/lib/supabase/business";
import { createClient } from "@/lib/supabase/server";

export type SaleActionState = { error: string | null };

type SaleInputItem = { product_id: string; quantity: number };

export async function createSale(
  _previousState: SaleActionState,
  formData: FormData
): Promise<SaleActionState> {
  const { businessId } = await getBusinessContext();
  const paymentMethod = String(formData.get("payment_method") ?? "");
  const customerId = String(formData.get("customer_id") ?? "").trim() || null;
  const rawItems = String(formData.get("items") ?? "");

  if (paymentMethod !== "pago" && paymentMethod !== "credito") {
    return { error: "Selecione o método de pagamento." };
  }
  if (paymentMethod === "credito" && !customerId) {
    return { error: "Selecione o cliente para a venda a crédito." };
  }

  let items: SaleInputItem[];
  try {
    const parsed: unknown = JSON.parse(rawItems);
    if (!Array.isArray(parsed)) throw new Error("not an array");
    items = parsed.map((item) => {
      const value = typeof item === "object" && item !== null
        ? item as { product_id?: unknown; quantity?: unknown }
        : {};
      return {
        product_id: typeof value.product_id === "string" ? value.product_id : "",
        quantity: Number(value.quantity),
      };
    });
  } catch {
    return { error: "O carrinho é inválido. Adicione os produtos novamente." };
  }

  if (!items.length || items.some((item) => !item.product_id || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
    return { error: "Adicione pelo menos um produto com uma quantidade válida." };
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("create_sale", {
    p_business_id: businessId,
    p_payment_method: paymentMethod,
    p_customer_id: customerId as string,
    p_items: items,
  });

  if (error) {
    if (error.message.includes("Stock insuficiente") || error.message.includes("produto indisponível")) {
      return { error: "Stock insuficiente ou produto indisponível. Atualize o carrinho." };
    }
    return { error: "Não foi possível concluir a venda. Tente novamente." };
  }

  revalidatePath("/dashboard/vendas");
  revalidatePath("/dashboard/produtos");
  revalidatePath("/dashboard/clientes");
  redirect("/dashboard/vendas");
}
