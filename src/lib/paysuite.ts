import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Integração com a PaySuite (https://paysuite.tech/docs).
 * Só corre no servidor. Variáveis (Vercel → Environment Variables):
 *   PAYSUITE_TOKEN           Token da API (PaySuite → Settings → API Access)
 *   PAYSUITE_WEBHOOK_SECRET  Segredo do webhook (PaySuite → definições do webhook)
 */
const BASE = "https://paysuite.tech/api/v1";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://contacertamz.site";

export function paysuiteConfigured() {
  return Boolean(process.env.PAYSUITE_TOKEN);
}

type PaysuitePayment = {
  id: string;
  amount: number | string;
  reference: string;
  status: string;
  checkout_url?: string;
  transaction?: { id?: string; status?: string; transaction_id?: string; paid_at?: string } | null;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PAYSUITE_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { status?: string; data?: T; message?: string };
  if (!res.ok || json.status === "error" || !json.data) {
    throw new Error(json.message || `PaySuite respondeu ${res.status}`);
  }
  return json.data;
}

export function createPaysuitePayment(input: {
  amount: number;
  reference: string;
  description: string;
  method: "mpesa" | "emola";
  returnUrl: string;
}) {
  return call<PaysuitePayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      amount: Number(input.amount.toFixed(2)),
      reference: input.reference.slice(0, 50),
      description: input.description.slice(0, 125),
      method: input.method,
      return_url: input.returnUrl,
      webhook_url: `${SITE_URL}/api/paysuite/webhook`,
    }),
  });
}

export function getPaysuitePayment(id: string) {
  return call<PaysuitePayment>(`/payments/${encodeURIComponent(id)}`);
}

/** Confirma que o webhook veio mesmo da PaySuite (HMAC-SHA256 do corpo, em hex). */
export function verifyPaysuiteSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSUITE_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature.trim().toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

function isPaid(p: { status?: string; transaction?: { status?: string } | null }) {
  const s = (p.status ?? "").toLowerCase();
  const t = (p.transaction?.status ?? "").toLowerCase();
  return ["completed", "paid", "success", "successful"].includes(s) || ["completed", "success", "successful"].includes(t);
}

type LocalPayment = { id: string; amount: number; status: string; reference: string; provider_payment_id: string | null };

/**
 * Activa o plano quando a PaySuite diz que o pagamento foi feito.
 * Verifica sempre o valor pago contra o valor do pedido.
 * Seguro de chamar várias vezes (só confirma pedidos ainda pendentes).
 */
export async function settlePaysuitePayment(remote: PaysuitePayment, opts: { trustPaid?: boolean } = {}) {
  const admin = createAdminClient() as unknown as SupabaseClient;

  const { data: local } = await admin
    .from("subscription_payments")
    .select("id, amount, status, reference, provider_payment_id")
    .eq("provider", "paysuite")
    .or(`provider_payment_id.eq.${remote.id},reference.eq.${remote.reference}`)
    .maybeSingle<LocalPayment>();

  if (!local) return { result: "not_found" as const };
  if (local.status !== "pending") return { result: "already" as const, status: local.status };

  const paid = opts.trustPaid || isPaid(remote);
  if (!paid) return { result: "not_paid" as const };

  if (Number(remote.amount) + 0.009 < Number(local.amount)) {
    await admin.from("subscription_payments").update({
      notes: `PaySuite: valor recebido (${remote.amount}) menor que o do plano (${local.amount}). Verificar à mão.`,
    }).eq("id", local.id);
    return { result: "amount_mismatch" as const };
  }

  if (remote.transaction?.transaction_id) {
    await admin
      .from("subscription_payments")
      .update({ transaction_id: remote.transaction.transaction_id })
      .eq("id", local.id)
      .is("transaction_id", null);
  }

  const { error } = await admin.rpc("confirm_subscription_payment", {
    p_payment_id: local.id,
    p_confirm: true,
    p_notes: "Confirmado automaticamente pela PaySuite",
  });
  if (error) return { result: "error" as const, message: error.message };
  return { result: "confirmed" as const };
}
