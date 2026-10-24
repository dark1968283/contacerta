"use server";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import {
  SITE_URL,
  createPaysuitePayment,
  getPaysuitePayment,
  paysuiteConfigured,
  settlePaysuitePayment,
} from "@/lib/paysuite";

function back(planId: string, cycle: string, message: string): never {
  redirect(
    `/dashboard/efectuar-pagamento?plan=${encodeURIComponent(planId)}&ciclo=${cycle}&erro=${encodeURIComponent(message)}`,
  );
}

/**
 * "Pagar agora com M-Pesa / e-Mola": cria o pedido no ContaCerta (o valor
 * vem sempre do plano, na base de dados) e abre a página de pagamento da
 * PaySuite. Quando o cliente paga, o webhook activa o plano sozinho.
 */
export async function startPaysuitePayment(formData: FormData) {
  const planId = String(formData.get("plan_id") ?? "");
  const cycle = String(formData.get("billing_cycle") ?? "") === "yearly" ? "yearly" : "monthly";
  const method = String(formData.get("method") ?? "") === "emola" ? "emola" : "mpesa";

  if (!paysuiteConfigured()) back(planId, cycle, "O pagamento automático ainda não está disponível.");

  const { businessId, businessName, role } = await getBusinessContext();
  if (role !== "admin") back(planId, cycle, "Só o administrador do negócio pode pagar o plano.");

  const supabase = createClient();
  const admin = createAdminClient() as unknown as SupabaseClient;

  // Um checkout PaySuite abandonado não deve bloquear um novo pagamento.
  const { data: pending } = await admin
    .from("subscription_payments")
    .select("id, provider, provider_payment_id")
    .eq("business_id", businessId)
    .eq("status", "pending")
    .maybeSingle<{ id: string; provider: string | null; provider_payment_id: string | null }>();

  if (pending) {
    if (pending.provider !== "paysuite") {
      back(planId, cycle, "Já tem um pagamento à espera de confirmação. Aguarde ou contacte o suporte.");
    }
    if (pending.provider_payment_id) {
      let alreadyPaid = false;
      try {
        const remote = await getPaysuitePayment(pending.provider_payment_id);
        alreadyPaid = (await settlePaysuitePayment(remote)).result === "confirmed";
      } catch {
        /* segue: cancela o pedido antigo */
      }
      // redirect() fora do try: o Next usa uma excepção para redireccionar.
      if (alreadyPaid) redirect(`/dashboard/pagamentos?pago=1`);
    }
    await admin
      .from("subscription_payments")
      .update({ status: "rejected", notes: "Pagamento PaySuite não concluído (substituído por um novo)." })
      .eq("id", pending.id)
      .eq("status", "pending");
  }

  const { data: payment, error } = await supabase.rpc("create_subscription_payment", {
    p_plan_id: planId,
    p_billing_cycle: cycle,
    p_payment_method: method,
    p_notes: "Pagamento automático PaySuite",
  });

  if (error || !payment) {
    const msg = error?.message ?? "";
    back(
      planId,
      cycle,
      msg.includes("plan_not_available_for_purchase")
        ? "Este plano não está disponível para compra."
        : msg.includes("payment_already_pending")
          ? "Já tem um pagamento à espera de confirmação."
          : "Não foi possível iniciar o pagamento. Tente novamente.",
    );
  }

  let checkoutUrl: string | undefined;
  try {
    const remote = await createPaysuitePayment({
      amount: Number(payment.amount),
      reference: payment.reference,
      description: `ContaCerta · ${businessName}`.slice(0, 125),
      method,
      returnUrl: `${SITE_URL}/dashboard/pagamentos?paysuite=${payment.id}`,
    });
    checkoutUrl = remote.checkout_url;
    await admin
      .from("subscription_payments")
      .update({ provider: "paysuite", provider_payment_id: remote.id, provider_checkout_url: remote.checkout_url ?? null })
      .eq("id", payment.id);
  } catch (e) {
    await admin
      .from("subscription_payments")
      .update({ status: "rejected", notes: `PaySuite indisponível: ${(e as Error).message}`.slice(0, 300) })
      .eq("id", payment.id)
      .eq("status", "pending");
    back(planId, cycle, "A PaySuite não respondeu. Tente de novo ou use o pagamento manual abaixo.");
  }

  if (!checkoutUrl) back(planId, cycle, "A PaySuite não devolveu o link de pagamento.");
  redirect(checkoutUrl);
}

/** Ao voltar da PaySuite: confirma logo, sem esperar pelo webhook. */
export async function checkPaysuiteReturn(paymentId: string) {
  if (!paysuiteConfigured()) return null;
  const { businessId } = await getBusinessContext();
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: local } = await admin
    .from("subscription_payments")
    .select("id, status, provider_payment_id")
    .eq("id", paymentId)
    .eq("business_id", businessId)
    .maybeSingle<{ id: string; status: string; provider_payment_id: string | null }>();
  if (!local?.provider_payment_id) return null;
  if (local.status !== "pending") return local.status;
  try {
    const remote = await getPaysuitePayment(local.provider_payment_id);
    const settled = await settlePaysuitePayment(remote);
    return settled.result === "confirmed" ? "confirmed" : "pending";
  } catch {
    return "pending";
  }
}
