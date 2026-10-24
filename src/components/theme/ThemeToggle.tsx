"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "./useTheme";
import type { ThemePref } from "@/lib/theme";

/** Botão rápido da barra superior: alterna entre claro e escuro. */
export function ThemeToggleButton() {
  const { resolved, setTheme } = useTheme();
  const next = resolved === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={next === "light" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      title={next === "light" ? "Modo claro" : "Modo escuro"}
      className="flex h-10 w-10 items-center justify-center rounded-xl text-dark-muted transition hover:bg-white/5 hover:text-dark-text"
    >
      {resolved === "dark" ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
    </button>
  );
}

const OPTIONS: { value: ThemePref; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Escuro", Icon: Moon },
  { value: "system", label: "Automático", Icon: Monitor },
];

/** Escolha completa (Configurações e menu "Mais"). */
export function ThemeChooser({ compact = false }: { compact?: boolean }) {
  const { pref, setTheme } = useTheme();
  return (
    <div role="radiogroup" aria-label="Aparência" className="grid grid-cols-3 gap-1.5 rounded-xl border border-dark-border bg-dark-bg p-1">
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = pref === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 ${compact ? "py-2 text-xs" : "py-2.5 text-sm"} font-medium transition ${
              active ? "bg-dark-surface text-dark-text shadow-sm ring-1 ring-dark-border" : "text-dark-muted hover:text-dark-text"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
