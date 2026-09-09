"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const COOLDOWN_SECONDS = 30;

type Status = "idle" | "sending" | "sent" | "error";

export function ResendConfirmationButton({
  email,
  variant = "primary",
}: {
  email: string;
  variant?: "primary" | "secondary";
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleResend() {
    if (cooldown > 0 || status === "sending") return;

    setStatus("sending");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });

    if (error) {
      setStatus("error");
      setErrorMessage("Não foi possível reenviar o email. Tente novamente dentro de alguns minutos.");
      return;
    }

    setStatus("sent");
    setCooldown(COOLDOWN_SECONDS);
  }

  const disabled = status === "sending" || cooldown > 0;
  const className =
    variant === "primary"
      ? "btn-primary"
      : "w-full rounded-xl border border-line py-3.5 text-base font-medium text-ink/70";

  return (
    <div className="space-y-2">
      <button type="button" onClick={handleResend} disabled={disabled} className={className}>
        {status === "sending"
          ? "A enviar…"
          : cooldown > 0
          ? `Aguarde ${cooldown}s para reenviar`
          : "Reenviar email de confirmação"}
      </button>

      {status === "sent" && (
        <p className="text-sm text-brand">✓ Enviámos um novo email de confirmação.</p>
      )}
      {status === "error" && errorMessage && <p className="error-text">{errorMessage}</p>}
    </div>
  );
}
