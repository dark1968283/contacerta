"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";

export type ExpenseState = { error: string | null };

const MISSING = /does not exist|schema cache|PGRST202|add_expense|delete_expense/i;

/** "Gastei dinheiro": guarda a despesa e volta à lista do mês. */
export async function addExpense(_prev: ExpenseState, formData: FormData): Promise<ExpenseState> {
  const { businessId } = await getBusinessContext();
  const category = String(formData.get("category") ?? "");
  const amount = Number(String(formData.get("amount") ?? "").replace(/\s/g, "").replace(",", "."));
  const note = String(formData.get("note") ?? "").trim();

  if (!category) return { error: "Toque em que gastou o dinheiro." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Escreva quanto gastou." };

  const db = createClient() as unknown as SupabaseClient;
  const { error } = await db.rpc("add_expense", {
    p_business_id: businessId,
    p_category: category,
    p_amount: amount,
    p_note: note || null,
  });
  if (error) {
    if (MISSING.test(error.message) || error.code === "PGRST202") {
      return { error: "As despesas ainda não estão activas. Falta aplicar a actualização 0025 no Supabase." };
    }
    return { error: error.message.replace(/^.*?:\s*/, "") || "Não foi possível guardar." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/despesas");
  revalidatePath("/dashboard/relatorios");
  redirect("/dashboard/despesas?guardado=1");
}

export async function deleteExpense(formData: FormData) {
  const id = String(formData.get("expense_id") ?? "");
  if (!id) return;
  const db = createClient() as unknown as SupabaseClient;
  await db.rpc("delete_expense", { p_expense_id: id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/despesas");
  revalidatePath("/dashboard/relatorios");
}
