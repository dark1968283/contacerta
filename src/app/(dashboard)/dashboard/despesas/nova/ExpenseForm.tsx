"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { EXPENSE_CATEGORIES } from "@/lib/expenses";
import { addExpense, type ExpenseState } from "../actions";

function Save({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="flex w-full items-center justify-center rounded-2xl bg-brandGlow px-5 py-4 text-lg font-bold text-onglow transition active:scale-[0.98] disabled:bg-white/[0.08] disabled:text-dark-faint"
    >
      {pending ? "A guardar…" : "Guardar"}
    </button>
  );
}

/** Um ecrã: quanto gastou (em grande) e em quê (ícones grandes). */
export function ExpenseForm() {
  const [state, action] = useFormState<ExpenseState, FormData>(addExpense, { error: null });
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [showNote, setShowNote] = useState(false);
  const value = Number(amount.replace(/\s/g, "").replace(",", "."));
  const ready = Number.isFinite(value) && value > 0 && category !== "";

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="category" value={category} />

      <div className="text-center">
        <label htmlFor="amount" className="text-sm font-medium text-dark-muted">
          Quanto gastou?
        </label>
        <div className="mt-2 flex items-baseline justify-center gap-2">
          <input
            id="amount"
            name="amount"
            inputMode="decimal"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,\s]/g, ""))}
            placeholder="0"
            className="w-48 bg-transparent text-center text-5xl font-bold tabular-nums text-dark-text outline-none placeholder:text-dark-faint"
          />
          <span className="text-2xl font-semibold text-dark-muted">MT</span>
        </div>
        <div className="mx-auto mt-1 h-0.5 w-56 rounded-full bg-brandGlow/40" />
      </div>

      <div>
        <p className="mb-3 text-center text-sm font-medium text-dark-muted">Em quê?</p>
        <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Em quê?">
          {EXPENSE_CATEGORIES.map(({ key, label, Icon }) => {
            const active = category === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setCategory(key)}
                className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-sm font-medium transition active:scale-95 ${
                  active
                    ? "border-brandGlow/60 bg-brandGlow/15 text-dark-text"
                    : "border-dark-border bg-white/[0.02] text-dark-muted hover:text-dark-text"
                }`}
              >
                <Icon className={`h-7 w-7 ${active ? "text-brandGlow" : ""}`} aria-hidden />
                <span className="text-center leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showNote ? (
        <input
          name="note"
          maxLength={120}
          autoFocus
          placeholder="Nota (ex.: renda de Outubro)"
          className="w-full rounded-xl border border-dark-border bg-dark-bg px-4 py-3.5 text-base text-dark-text outline-none placeholder:text-dark-faint focus:border-brandGlow/60"
        />
      ) : (
        <button type="button" onClick={() => setShowNote(true)} className="mx-auto block text-sm font-medium text-accent">
          + Escrever uma nota
        </button>
      )}

      {state.error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</p>}

      <Save disabled={!ready} />

      <p className="text-center text-xs leading-relaxed text-dark-faint">
        Comprou mercadoria para vender? Registe em Produtos → o produto → “Chegou mercadoria”, para o lucro ficar certo.
      </p>
    </form>
  );
}
