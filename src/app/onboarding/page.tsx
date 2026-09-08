"use client";

import { useFormState } from "react-dom";
import { createBusiness } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { AuthActionState } from "../(auth)/actions";

const initialState: AuthActionState = { error: null };

export default function OnboardingPage() {
  const [state, formAction] = useFormState(createBusiness, initialState);

  return (
    <main className="mx-auto flex min-h-dvh max-w-app flex-col justify-center px-6 py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-ink">
          Como se chama o seu negócio?
        </h1>
        <p className="mt-1 text-ink/60">
          Vai poder mudar isto mais tarde nas definições.
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        <div>
          <label htmlFor="name" className="field-label">
            Nome do negócio
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoFocus
            required
            className="input-field"
            placeholder="Loja Fernando"
          />
        </div>

        {state.error && <p className="error-text">{state.error}</p>}

        <SubmitButton>Continuar</SubmitButton>
      </form>
    </main>
  );
}
