"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { signUp, type AuthActionState } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: AuthActionState = { error: null };

export default function SignupPage() {
  const [state, formAction] = useFormState(signUp, initialState);

  return (
    <main className="mx-auto flex min-h-dvh max-w-app flex-col justify-center px-6 py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-ink">Criar conta</h1>
        <p className="mt-1 text-ink/60">Comece a controlar o seu negócio.</p>
      </div>

      <form action={formAction} className="space-y-5">
        <div>
          <label htmlFor="name" className="field-label">
            O seu nome
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="input-field"
            placeholder="Fernando Machava"
          />
        </div>

        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input-field"
            placeholder="voce@exemplo.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            Palavra-passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            className="input-field"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {state.error && <p className="error-text">{state.error}</p>}

        <SubmitButton>Criar conta</SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-ink/60">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-brand">
          Entrar
        </Link>
      </p>
    </main>
  );
}
