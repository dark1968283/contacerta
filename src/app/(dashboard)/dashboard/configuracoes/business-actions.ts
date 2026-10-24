"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type BusinessDetailsState = { error?: string; success?: string };

export async function saveBusinessDetails(_prev: BusinessDetailsState, formData: FormData): Promise<BusinessDetailsState> {
  const businessId = String(formData.get("business_id") ?? "");
  const nuit = String(formData.get("nuit") ?? "").replace(/\s/g, "");
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const name = String(formData.get("name") ?? "").replace(/\s+/g, " ").trim();
  const currentName = String(formData.get("current_name") ?? "").trim();

  if (nuit && !/^\d{9}$/.test(nuit)) return { error: "O NUIT tem de ter 9 algarismos." };
  if (name.length < 2) return { error: "Escreva o nome do negócio." };

  // update_business_details (0021) e update_business_name (0025) ainda fora dos tipos gerados.
  const db = createClient() as unknown as SupabaseClient;

  if (name !== currentName) {
    const { error: nameError } = await db.rpc("update_business_name", { p_business_id: businessId, p_name: name });
    if (nameError) {
      if (/does not exist|schema cache/i.test(nameError.message)) {
        return { error: "Para mudar o nome falta aplicar a actualização 0025 no Supabase." };
      }
      return { error: nameError.message || "Não foi possível mudar o nome." };
    }
    // O nome aparece no topo de todas as páginas.
    revalidatePath("/", "layout");
  }

  const { error } = await db.rpc("update_business_details", {
    p_business_id: businessId,
    p_nuit: nuit || null,
    p_phone: phone || null,
    p_address: address || null,
  });

  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      return { error: "Falta aplicar a actualização 0021 no Supabase." };
    }
    return { error: error.message || "Não foi possível guardar." };
  }

  revalidatePath("/dashboard/configuracoes");
  return { success: "Dados guardados." };
}
