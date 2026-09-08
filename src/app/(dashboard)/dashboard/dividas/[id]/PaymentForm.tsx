"use client";

import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { registerDebtPayment, type DebtPaymentActionState } from "../actions";

const initialState: DebtPaymentActionState = { error: null, success: false };

export function PaymentForm({ debtId, remaining }: { debtId: string; remaining: number }) {
  const action = registerDebtPayment.bind(null, debtId);
  const [state, formAction] = useFormState(action, initialState);

  if (remaining <= 0) return null;

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-line bg-white p-4">
      <div>
        <h2 className="font-semibold text-ink">Registar pagamento</h2>
        <p className="mt-1 text-sm text-ink/60">Saldo em aberto: {Math.round(remaining).toLocaleString("pt-MZ")} MT</p>
      </div>
      <div className="space-y-2">
        <label htmlFor="amount" className="block text-sm font-medium text-ink">Valor</label>
        <input id="amount" name="amount" type="number" min="0.01" max={remaining} step="0.01" inputMode="decimal" required className="input-field" placeholder="0,00" />
      </div>
      <div className="space-y-2">
        <label htmlFor="payment_method" className="block text-sm font-medium text-ink">Método</label>
        <select id="payment_method" name="payment_method" required defaultValue="" className="input-field">
          <option value="">Selecione…</option><option value="dinheiro">Dinheiro</option><option value="mpesa">M-Pesa</option><option value="emola">e-Mola</option><option value="transferencia">Transferência</option><option value="outro">Outro</option>
        </select>
      </div>
      {state.error && <p role="alert" className="rounded-lg bg-alert/10 p-3 text-sm text-alert">{state.error}</p>}
      {state.success && <p className="rounded-lg bg-brand/10 p-3 text-sm text-brand">Pagamento registado.</p>}
      <SubmitButton>Registar pagamento</SubmitButton>
    </form>
  );
}
