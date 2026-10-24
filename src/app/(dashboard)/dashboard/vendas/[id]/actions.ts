"use server";

import { redirect } from "next/navigation";
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
