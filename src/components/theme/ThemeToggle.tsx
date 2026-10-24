"use client";

import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "./useTheme";
import type { ThemePref } from "@/lib/theme";

/**
 * Botão da barra superior: alterna entre claro e escuro.
 * O sol e a lua estão sobrepostos; ao clicar, um gira e encolhe enquanto o outro
 * gira e aparece (no tema escuro vê-se a lua, no claro o sol).
 */
export function ThemeToggleButton() {
  const { resolved, setTheme } = useTheme();
  const isDark = resolved === "dark";
  const [spin, setSpin] = useState(0);
  return (
    <button
      type="button"
      onClick={() => {
        setTheme(isDark ? "light" : "dark");
        setSpin((n) => n + 1);
      }}
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      title={isDark ? "Modo claro" : "Modo escuro"}
      className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl text-dark-muted transition hover:bg-white/5 hover:text-dark-text active:scale-90"
    >
      <span key={spin} className={spin ? "cc-theme-pop absolute inset-0 rounded-xl" : "hidden"} aria-hidden />
      <Sun
        className={`absolute h-5 w-5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isDark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
        aria-hidden
      />
      <Moon
        className={`absolute h-5 w-5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
        }`}
        aria-hidden
      />
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
