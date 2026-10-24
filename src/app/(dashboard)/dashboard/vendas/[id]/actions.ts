"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type InvoiceState = { error: string | null };

/** Emite a factura-recibo da venda (ou reaproveita a já emitida) e abre-a. */
export async function issueInvoice(_prev: InvoiceState, formData: FormData): Promise<InvoiceState> {
  const saleId = String(formData.get("sale_id") ?? "");
  const nuit = String(formData.get("customer_nuit") ?? "").replace(/\s/g, "");

  if (!saleId) return { error: "Venda inválida." };
  if (nuit && !/^\d{9}$/.test(nuit)) return { error: "O NUIT tem de ter 9 algarismos." };

  // issue_invoice vem da migração 0021 e ainda não está nos tipos gerados.
  const db = createClient() as unknown as SupabaseClient;
  const { error } = await db.rpc("issue_invoice", { p_sale_id: saleId, p_customer_nuit: nuit || null });

  if (error) {
    if (/function .*issue_invoice|does not exist|schema cache/i.test(error.message)) {
      return { error: "As facturas ainda não estão activas. Falta aplicar a actualização 0021 no Supabase." };
    }
    return { error: error.message.replace(/^.*?:\s*/, "") || "Não foi possível emitir a factura." };
  }

  redirect(`/imprimir/venda/${saleId}?imprimir=1`);
}

export type CancelState = { error: string | null; done?: boolean };

/** Anula a venda (só o dono): o stock volta e a dívida desta venda sai. */
export async function cancelSale(_prev: CancelState, formData: FormData): Promise<CancelState> {
  const saleId = String(formData.get("sale_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!saleId) return { error: "Venda inválida." };

  // cancel_sale vem da migração 0025 e ainda não está nos tipos gerados.
  const db = createClient() as unknown as SupabaseClient;
  const { error } = await db.rpc("cancel_sale", { p_sale_id: saleId, p_reason: reason || null });

  if (error) {
    if (/function .*cancel_sale|does not exist|schema cache/i.test(error.message)) {
      return { error: "Anular vendas ainda não está activo. Falta aplicar a actualização 0025 no Supabase." };
    }
    return { error: error.message.replace(/^.*?:\s*/, "") || "Não foi possível anular a venda." };
  }

  for (const path of ["/dashboard", "/dashboard/vendas", `/dashboard/vendas/${saleId}`, "/dashboard/produtos", "/dashboard/dividas", "/dashboard/clientes", "/dashboard/relatorios"]) {
    revalidatePath(path);
  }
  return { error: null, done: true };
}
