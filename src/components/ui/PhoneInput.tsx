"use client";

import { useState } from "react";
import { checkMzPhone, formatMzPhone, onlyLocalDigits } from "@/lib/phone";

/**
 * Campo de telefone que formata enquanto se escreve ("84 123 4567")
 * e diz logo se o número está certo.
 */
export function PhoneInput({
  id,
  name = "phone",
  defaultValue = "",
  value: controlledValue,
  onChange,
  className = "",
  placeholder = "84 123 4567",
  autoFocus,
  "aria-label": ariaLabel,
}: {
  id?: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const value = controlledValue ?? internal;
  const [touched, setTouched] = useState(Boolean(defaultValue));
  const check = checkMzPhone(value);

  function handle(next: string) {
    const digits = onlyLocalDigits(next).slice(0, 12);
    const formatted = next.trim().startsWith("+") && !digits ? next : formatMzPhone(digits);
    if (controlledValue === undefined) setInternal(formatted);
    onChange?.(formatted);
  }

  const showError = touched && !check.ok;
  const showOk = check.ok && !check.empty;

  return (
    <div className="w-full">
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={value}
        onChange={(e) => handle(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        aria-invalid={showError || undefined}
        className={`${className} ${showError ? "!border-danger/60" : ""}`}
      />
      {showError && !check.ok && <p className="mt-1.5 text-xs text-danger">{check.reason}</p>}
      {showOk && <p className="mt-1.5 text-xs text-brandGlow">✓ Número válido</p>}
    </div>
  );
}
