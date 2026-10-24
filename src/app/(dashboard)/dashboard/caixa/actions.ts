"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";

export type CashCountState = {
  error: string | null;
  result?: { expected: number; counted: number; difference: number };
};

function amount(v: FormDataEntryValue | null) {
  const n = Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Guarda a contagem do dia; o servidor calcula quanto devia haver. */
export async function saveCashCount(_prev: CashCountState, formData: FormData): Promise<CashCountState> {
  const { businessId } = await getBusinessContext();
  const cash = amount(formData.get("cash"));
  const mobile = amount(formData.get("mobile"));
  const note = String(formData.get("note") ?? "").trim();

  const db = createClient() as unknown as SupabaseClient;
  const { data, error } = await db.rpc("save_cash_count", {
    p_business_id: businessId,
    p_counted_cash: cash,
    p_counted_mobile: mobile,
    p_note: note || null,
  });
  if (error) {
    if (/does not exist|schema cache|save_cash_count/i.test(error.message) || error.code === "PGRST202") {
      return { error: "Contar a caixa ainda não está activo. Falta aplicar a actualização 0025 no Supabase." };
    }
    return { error: error.message.replace(/^.*?:\s*/, "") || "Não foi possível guardar." };
  }
  const row = data as { expected: number | string; counted_cash: number | string; counted_mobile: number | string; difference: number | string };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/caixa");
  return {
    error: null,
    result: {
      expected: Number(row.expected),
      counted: Number(row.counted_cash) + Number(row.counted_mobile),
      difference: Number(row.difference),
    },
  };
}
