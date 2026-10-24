"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import { setNewPassword, type NewPasswordState } from "@/app/(auth)/actions";
import { buttonClass, inputClass } from "@/components/auth/AuthCard";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass}>
      {pending ? "A guardar…" : "Guardar e entrar"}
    </button>
  );
}

export function NewPasswordForm() {
  const [state, action] = useFormState<NewPasswordState, FormData>(setNewPassword, { error: null });
  const [show, setShow] = useState(false);
  const type = show ? "text" : "password";

  return (
    <form action={action} className="space-y-3">
      <div className="relative">
        <input
          name="password"
          type={type}
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Nova palavra-passe"
          aria-label="Nova palavra-passe"
          className={`${inputClass} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Esconder" : "Mostrar"}
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-dark-muted hover:text-dark-text"
        >
          {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
        </button>
      </div>
      <input
        name="confirm"
        type={type}
        autoComplete="new-password"
        required
        minLength={6}
        placeholder="Escreva outra vez"
        aria-label="Confirmar palavra-passe"
        className={inputClass}
      />
      <p className="text-xs text-dark-faint">Pelo menos 6 letras ou números.</p>
      {state.error && <p className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{state.error}</p>}
      <div className="pt-1">
        <Submit />
      </div>
    </form>
  );
}
