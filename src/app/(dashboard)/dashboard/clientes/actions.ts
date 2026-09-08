"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";

export type CustomerActionState = { error: string | null };

export async function createCustomer(
  _prevState: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const { businessId, userId } = await getBusinessContext();
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;

  if (!name) {
    return { error: "O nome do cliente é obrigatório." };
  }

  // Qualquer membro (admin ou funcionário) pode adicionar — a RLS
  // já reforça isto, esta validação é só para uma mensagem melhor.
  const { data, error } = await supabase
    .from("customers")
    .insert({ business_id: businessId, name, phone, email, address, created_by: userId })
    .select("id")
    .single();

  if (error) {
    return { error: "Não foi possível criar o cliente. Tente novamente." };
  }

  revalidatePath("/dashboard/clientes");
  redirect(`/dashboard/clientes/${data.id}`);
}

export async function updateCustomer(
  customerId: string,
  _prevState: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;

  if (!name) {
    return { error: "O nome do cliente é obrigatório." };
  }

  const { error } = await supabase
    .from("customers")
    .update({ name, phone, email, address })
    .eq("id", customerId);

  if (error) {
    return { error: "Não foi possível guardar. Confirme que tem permissão de administrador." };
  }

  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${customerId}`);
  return { error: null };
}
