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

  if (nuit && !/^\d{9}$/.test(nuit)) return { error: "O NUIT tem de ter 9 algarismos." };

  // update_business_details vem da migração 0021 (ainda fora dos tipos gerados).
  const db = createClient() as unknown as SupabaseClient;
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
