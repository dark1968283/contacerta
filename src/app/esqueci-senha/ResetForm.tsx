"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { MailCheck } from "lucide-react";
import { requestPasswordReset, type ResetState } from "@/app/(auth)/actions";
import { buttonClass, inputClass } from "@/components/auth/AuthCard";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass}>
      {pending ? "A enviar…" : "Enviar link"}
    </button>
  );
}

export function ResetForm({ expired }: { expired: boolean }) {
  const [state, action] = useFormState<ResetState, FormData>(requestPasswordReset, { error: null });

  if (state.sent) {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brandGlow/15 text-brandGlow">
          <MailCheck className="h-7 w-7" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-dark-muted">
          Se existir uma conta com <span className="font-semibold text-dark-text">{state.email}</span>, enviámos um link. Abra o
          email e toque no link para criar a nova palavra-passe.
        </p>
        <p className="text-xs text-dark-faint">Não chegou? Veja na pasta Spam ou espere 1 minuto.</p>
        <Link href="/login" className="block text-sm font-semibold text-brandGlow hover:underline">
          Voltar para entrar
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {expired && (
        <p className="rounded-xl bg-warning/10 px-3.5 py-2.5 text-sm text-dark-text">
          O link já não é válido. Peça um link novo aqui.
        </p>
      )}
      <input
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder="O seu email"
        aria-label="Email"
        className={inputClass}
      />
      {state.error && <p className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{state.error}</p>}
      <Submit />
      <Link href="/login" className="block text-center text-sm font-medium text-dark-muted hover:text-dark-text">
        Lembrei-me, voltar
      </Link>
    </form>
  );
}
