"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestPlan(formData: FormData) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "create_subscription_payment",
    {
      p_plan_id: String(formData.get("plan_id")),
      p_billing_cycle: String(formData.get("billing_cycle")) as
        | "monthly"
        | "yearly",
      p_payment_method: String(formData.get("payment_method")) as
        | "mpesa"
        | "emola"
        | "mkesh"
        | "bank_transfer"
        | "cash"
        | "other",
      p_transaction_id:
        String(formData.get("transaction_id") ?? "").trim() || undefined,
      p_notes: String(formData.get("notes") ?? "").trim() || undefined,
    },
  );

  if (error) {
    console.error("create_subscription_payment", error);

    let message =
      "Não foi possível criar o pedido de pagamento. Tente novamente.";

    if (error.message.includes("admin_required")) {
      message = "Só o administrador do negócio pode iniciar um pedido de pagamento.";
    } else if (error.message.includes("plan_not_available_for_purchase")) {
      message =
        "Este plano não está disponível para compra. Escolha Profissional ou Empresarial.";
    } else if (error.message.includes("payment_already_pending")) {
      message = "Já existe um pagamento pendente para este negócio. Aguarde a decisão da equipa ou contacte o suporte antes de criar outro pedido.";
    } else if (
      error.message.includes("transação já foi utilizada") ||
      error.message.includes("transaction_id")
    ) {
      message = "Esta transação já foi utilizada.";
    } else if (error.message.includes("subscription_required")) {
      message =
        "A subscrição não está disponível. Actualize o plano para continuar.";
    }

    redirect(`/dashboard/planos?erro=${encodeURIComponent(message)}`);
  }

  if (!data) {
    redirect(
      `/dashboard/planos?erro=${encodeURIComponent(
        "Não foi possível confirmar o pedido de pagamento.",
      )}`,
    );
  }

  redirect(`/dashboard/pagamentos?criado=${data.id}`);
}
