"use client";

import { useFormState } from "react-dom";
import { MailPlus } from "lucide-react";
import { inviteEmployee, type EmployeeActionState } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: EmployeeActionState = {
  error: null,
  success: null,
};

export function InviteEmployeeForm() {
  const [state, formAction] = useFormState(inviteEmployee, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="employee-email"
          className="mb-2 block text-sm font-medium text-dark-text"
        >
          Email do funcionário
        </label>

        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="relative w-full min-w-0 flex-1 sm:max-w-none">
            <MailPlus
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-muted"
            />
            <input
              id="employee-email"
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="funcionario@exemplo.com"
              className="block h-12 w-full min-w-0 rounded-xl border border-dark-border bg-dark-bg py-3 pl-11 pr-3 text-sm text-dark-text outline-none transition placeholder:text-dark-faint focus:border-brandGlow"
            />
          </div>

          <div className="w-full shrink-0 sm:w-auto sm:min-w-[150px]"><SubmitButton>Enviar convite</SubmitButton></div>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">
          {state.success}
        </p>
      )}

      <p className="text-xs leading-5 text-dark-muted">
        O convite é enviado por email e expira após sete dias. O funcionário
        terá de concluir a autenticação para entrar no negócio.
      </p>
    </form>
  );
}
