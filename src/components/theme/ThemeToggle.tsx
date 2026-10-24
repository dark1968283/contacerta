"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "./useTheme";
import type { ThemePref } from "@/lib/theme";

/** Botão da barra superior: abre um menu com Claro, Escuro e Automático. */
export function ThemeToggleButton() {
  const { pref, resolved, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    // foca a opção escolhida, para dar para usar só com o teclado
    const i = OPTIONS.findIndex((o) => o.value === pref);
    items.current[i < 0 ? 0 : i]?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, pref]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const list = items.current.filter(Boolean) as HTMLButtonElement[];
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === "ArrowDown" ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
    list[next]?.focus();
  };

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Mudar o tema"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Tema"
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white/5 hover:text-dark-text ${
          open ? "bg-white/5 text-dark-text" : "text-dark-muted"
        }`}
      >
        {resolved === "dark" ? <Moon className="h-5 w-5" aria-hidden /> : <Sun className="h-5 w-5" aria-hidden />}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Tema"
          onKeyDown={onMenuKey}
          className="cc-sheet cc-theme-menu absolute right-0 top-full z-[70] mt-2 w-48 origin-top-right rounded-2xl border border-dark-border bg-dark-surface p-1.5 shadow-2xl backdrop-blur-2xl"
        >
          <p className="px-2.5 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-dark-muted">Tema</p>
          <div className="-mx-1.5 mb-1 h-px bg-dark-border" />
          {OPTIONS.map(({ value, label, Icon }, i) => {
            const active = pref === value;
            return (
              <button
                key={value}
                ref={(el) => {
                  items.current[i] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm outline-none transition focus-visible:bg-white/[0.06] ${
                  active ? "font-semibold text-dark-text" : "text-dark-muted hover:bg-white/[0.06] hover:text-dark-text"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="flex-1 text-left">{label}</span>
                {active && <Check className="h-4 w-4 text-brandGlow" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
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
