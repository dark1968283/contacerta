"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DebtPaymentActionState = { error: string | null; success: boolean };

export async function registerDebtPayment(
  debtId: string,
  _previousState: DebtPaymentActionState,
  formData: FormData
): Promise<DebtPaymentActionState> {
  const rawAmount = String(formData.get("amount") ?? "").trim().replace(",", ".");
  const amount = Number(rawAmount);
  const paymentMethod = String(formData.get("payment_method") ?? "");

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Indique um valor maior que zero.", success: false };
  }
  if (!["dinheiro", "mpesa", "emola", "transferencia", "outro"].includes(paymentMethod)) {
    return { error: "Selecione o método de pagamento.", success: false };
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("register_debt_payment", {
    p_debt_id: debtId,
    p_amount: amount,
    p_payment_method: paymentMethod as "dinheiro" | "mpesa" | "emola" | "transferencia" | "outro",
  });

  if (error) {
    if (error.message.includes("superior ao saldo")) {
      return { error: "O valor não pode ser superior ao saldo em aberto.", success: false };
    }
    if (error.message.includes("já foi paga")) {
      return { error: "Esta dívida já foi paga.", success: false };
    }
    return { error: "Não foi possível registar o pagamento.", success: false };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/dividas");
  revalidatePath(`/dashboard/dividas/${debtId}`);
  revalidatePath("/dashboard/clientes");
  return { error: null, success: true };
}
