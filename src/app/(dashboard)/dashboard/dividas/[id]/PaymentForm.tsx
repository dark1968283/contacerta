"use client";

import { useFormState } from "react-dom";
import {
  Banknote,
  Check,
  CircleHelp,
  Landmark,
  Smartphone,
  WalletCards,
} from "lucide-react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import {
  registerDebtPayment,
  type DebtPaymentActionState,
} from "../actions";

const initialState: DebtPaymentActionState = {
  error: null,
  success: false,
};

const inputClass =
  "w-full rounded-xl border border-dark-border bg-dark-bg/60 px-4 py-3 text-base text-dark-text placeholder:text-dark-faint outline-none transition-all [color-scheme:dark] focus:border-brandGlow/50 focus:ring-2 focus:ring-brandGlow/15";

const labelClass = "mb-1.5 block text-sm font-medium text-dark-muted";

const methods = [
  {
    value: "dinheiro",
    label: "Dinheiro",
    description: "Notas e moedas",
    icon: Banknote,
    badge: "bg-emerald-500/10 text-emerald-400",
  },
  {
    value: "mpesa",
    label: "M-Pesa",
    description: "Carteira móvel",
    icon: Smartphone,
    badge: "bg-green-500/10 text-green-400",
  },
  {
    value: "emola",
    label: "e-Mola",
    description: "Carteira móvel",
    icon: Smartphone,
    badge: "bg-orange-500/10 text-orange-400",
  },
  {
    value: "transferencia",
    label: "Transferência",
    description: "Conta bancária",
    icon: Landmark,
    badge: "bg-sky-500/10 text-sky-400",
  },
  {
    value: "outro",
    label: "Outro",
    description: "Outro método",
    icon: CircleHelp,
    badge: "bg-violet-500/10 text-violet-400",
  },
] as const;

export function PaymentForm({
  debtId,
  remaining,
}: {
  debtId: string;
  remaining: number;
}) {
  const action = registerDebtPayment.bind(null, debtId);
  const [state, formAction] = useFormState(action, initialState);

  if (remaining <= 0) return null;

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-dark-border bg-dark-surface p-4 shadow-xl shadow-black/10 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brandGlow/10 text-brandGlow">
          <WalletCards className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-semibold text-dark-text">
            Registar pagamento
          </h2>
          <p className="mt-1 text-sm text-dark-muted">
            Saldo em aberto:{" "}
            <strong className="font-semibold text-warning">
              {Math.round(remaining).toLocaleString("pt-MZ")} MT
            </strong>
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="amount" className={labelClass}>
          Valor recebido (MT)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min="0.01"
          max={remaining}
          step="0.01"
          inputMode="decimal"
          required
          className={inputClass}
          placeholder="0,00"
        />
        <p className="mt-1.5 text-xs text-dark-faint">
          Não pode ultrapassar o saldo em aberto.
        </p>
      </div>

      <fieldset>
        <legend className={labelClass}>
          Método de pagamento
        </legend>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {methods.map((method) => {
            const Icon = method.icon;

            return (
              <label
                key={method.value}
                className="group relative cursor-pointer"
              >
                <input
                  type="radio"
                  name="payment_method"
                  value={method.value}
                  required
                  defaultChecked={method.value === "dinheiro"}
                  className="peer sr-only"
                />

                <span className="flex min-h-[112px] flex-col gap-3 rounded-xl border border-dark-border bg-dark-bg/40 p-3 transition-all hover:border-dark-muted/60 peer-checked:border-brandGlow peer-checked:bg-brandGlow/[0.07] peer-focus-visible:ring-2 peer-focus-visible:ring-brandGlow/40 sm:p-4">
                  <span className="flex items-center justify-between gap-2">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${method.badge}`}
                    >
                      {method.value === "mpesa" ? (
                        <img src="/images/payments/mpesa.png" alt="M-Pesa" className="h-9 w-9 rounded-lg object-contain" />
                      ) : method.value === "emola" ? (
                        <img src="/images/payments/emola.png" alt="e-Mola" className="h-9 w-9 rounded-lg object-contain" />
                      ) : method.value === "dinheiro" ? (
                        <img src="/images/payments/dinheiro.png" alt="Dinheiro" className="h-9 w-9 rounded-lg object-contain" />
                      ) : method.value === "transferencia" ? (
                        <img src="/images/payments/transferencia.png" alt="Transferência bancária" className="h-9 w-9 rounded-lg object-contain" />
                      ) : (
                        <img src="/images/payments/outro.svg" alt="Outro método" className="h-9 w-9 rounded-lg object-contain" />
                      )}
                    </span>

                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dark-border text-transparent transition-colors group-has-[:checked]:border-brandGlow group-has-[:checked]:bg-brandGlow group-has-[:checked]:text-dark-bg">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                    </span>
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-dark-text">
                      {method.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-dark-muted">
                      {method.description}
                    </span>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      {state.success && (
        <p
          role="status"
          className="rounded-xl border border-brandGlow/20 bg-brandGlow/10 p-3 text-sm text-brandGlow"
        >
          Pagamento registado com sucesso.
        </p>
      )}

      <SubmitButton>Registar pagamento</SubmitButton>
    </form>
  );
}
