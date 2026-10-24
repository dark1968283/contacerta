"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { FileText, Printer } from "lucide-react";
import { issueInvoice, type InvoiceState } from "./actions";

function IssueButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-onbrand transition hover:bg-brand/90 disabled:opacity-60"
    >
      <FileText className="h-4 w-4" aria-hidden />
      {pending ? "A emitir…" : "Emitir fatura"}
    </button>
  );
}

/**
 * Recibo simples (sempre disponível) e fatura-recibo numerada.
 * Se a fatura já existir, mostra só o botão para a abrir.
 */
export function InvoiceActions({ saleId, invoiceNumber }: { saleId: string; invoiceNumber: string | null }) {
  const [state, action] = useFormState<InvoiceState, FormData>(issueInvoice, { error: null });
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`/imprimir/venda/${saleId}?imprimir=1`}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.04] px-4 py-3.5 text-sm font-semibold text-dark-text transition hover:bg-white/[0.07]"
        >
          <Printer className="h-4 w-4 text-brandGlow" aria-hidden />
          {invoiceNumber ? "Ver fatura" : "Recibo PDF"}
        </a>
        {invoiceNumber ? (
          <span className="flex items-center justify-center rounded-2xl border border-brandGlow/25 bg-brandGlow/[0.07] px-4 py-3.5 text-sm font-semibold text-brandGlow">
            {invoiceNumber}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.04] px-4 py-3.5 text-sm font-semibold text-dark-text transition hover:bg-white/[0.07]"
            aria-expanded={open}
          >
            <FileText className="h-4 w-4 text-brandGlow" aria-hidden />
            Fatura
          </button>
        )}
      </div>

      {open && !invoiceNumber && (
        <form action={action} className="space-y-3 rounded-2xl border border-dark-border bg-dark-surface/60 p-4">
          <input type="hidden" name="sale_id" value={saleId} />
          <p className="text-sm text-dark-muted">
            A fatura recebe um número próprio (ex.: FR 2026/1) e conta para o limite de faturas do seu plano.
          </p>
          <label className="block text-sm font-medium text-dark-text">
            NUIT do cliente <span className="font-normal text-dark-faint">(opcional)</span>
            <input
              name="customer_nuit"
              inputMode="numeric"
              pattern="[0-9 ]{9,11}"
              maxLength={11}
              placeholder="9 algarismos"
              className="mt-1.5 w-full rounded-xl border border-dark-border bg-dark-bg px-3.5 py-3 text-base text-dark-text placeholder:text-dark-faint focus:border-brandGlow/50 focus:outline-none"
            />
          </label>
          {state.error && <p className="text-sm font-medium text-danger">{state.error}</p>}
          <IssueButton />
        </form>
      )}
    </div>
  );
}
