"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Undo2, X } from "lucide-react";
import { cancelSale, type CancelState } from "./actions";

const REASONS = ["Enganei-me", "Cliente devolveu", "Venda repetida", "Outro"];

function ConfirmButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-danger px-5 py-3.5 text-base font-bold text-onbrand transition active:scale-[0.98] disabled:opacity-60"
    >
      <Undo2 className="h-5 w-5" aria-hidden />
      {pending ? "A anular…" : label}
    </button>
  );
}

/**
 * "Esta venda está errada?" — discreto por baixo do recibo.
 * Só o dono anula; o funcionário vê a indicação para pedir ao dono.
 */
export function CancelSale({
  saleId,
  totalLabel,
  isOwner,
  blockedReason,
}: {
  saleId: string;
  totalLabel: string;
  isOwner: boolean;
  /** Quando a venda não pode ser anulada (ex.: o cliente já pagou parte). */
  blockedReason?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]!);
  const [state, action] = useFormState<CancelState, FormData>(cancelSale, { error: null });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto block py-2 text-sm font-medium text-dark-muted underline-offset-4 transition hover:text-dark-text hover:underline"
      >
        Esta venda está errada?
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-danger/25 bg-danger/[0.06] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-dark-text">Anular esta venda?</p>
        <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="-m-1 rounded-lg p-1 text-dark-muted hover:text-dark-text">
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {!isOwner ? (
        <p className="mt-2 text-sm text-dark-muted">Só o dono do negócio pode anular vendas. Peça-lhe para abrir esta venda e anular.</p>
      ) : blockedReason ? (
        <p className="mt-2 text-sm text-dark-muted">{blockedReason}</p>
      ) : (
        <form action={action} className="mt-3 space-y-3">
          <input type="hidden" name="sale_id" value={saleId} />
          <input type="hidden" name="reason" value={reason} />
          <p className="text-sm text-dark-muted">Os produtos voltam para o stock e a venda deixa de contar nas contas.</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Porquê?">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={reason === r}
                onClick={() => setReason(r)}
                className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                  reason === r ? "border-danger/50 bg-danger/15 text-dark-text" : "border-dark-border text-dark-muted hover:text-dark-text"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {state.error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>}
          <ConfirmButton label={`Anular venda de ${totalLabel}`} />
        </form>
      )}
    </div>
  );
}
