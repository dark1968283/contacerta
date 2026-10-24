"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className ?? "btn-primary"} disabled={pending}>
      {pending ? "A processar…" : children}
    </button>
  );
}
