"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { signIn, type AuthActionState } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: AuthActionState = { error: null };

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, initialState);

  return (
    <main className="mx-auto flex min-h-dvh max-w-app flex-col justify-center px-6 py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-ink">Entrar</h1>
        <p className="mt-1 text-ink/60">O seu negócio. Sob controlo.</p>
      </div>

      <form action={formAction} className="space-y-5">
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
            autoComplete="current-password"
            required
            className="input-field"
            placeholder="••••••••"
          />
        </div>

        {state.error && <p className="error-text">{state.error}</p>}

        <SubmitButton>Entrar</SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-ink/60">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="font-medium text-brand">
          Criar conta
        </Link>
      </p>
    </main>
  );
}
