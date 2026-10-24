import type { ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";

/** Moldura simples para os ecrãs de recuperar a palavra-passe. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-dark-bg px-4 py-10 text-dark-text">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo href="/" />
        </div>
        <div className="rounded-3xl border border-dark-border bg-dark-surface p-6 shadow-2xl sm:p-7">
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-dark-muted">{subtitle}</p>}
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </main>
  );
}

export const inputClass =
  "min-h-[52px] w-full rounded-xl border border-dark-border bg-dark-bg px-4 text-base text-dark-text outline-none transition placeholder:text-dark-faint focus:border-brandGlow/70 focus:ring-4 focus:ring-brandGlow/10";

export const buttonClass =
  "flex min-h-[52px] w-full items-center justify-center rounded-xl bg-brand px-5 text-base font-bold text-onbrand transition hover:bg-brand/90 active:scale-[0.98] disabled:opacity-60";
