"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2, AlertTriangle, Coins, X } from "lucide-react";
import { saveCashCount, type CashCountState } from "@/app/(dashboard)/dashboard/caixa/actions";

const fmt = (v: number) => `${Math.round(v).toLocaleString("pt-MZ")} MT`;
const FIELD =
  "w-full rounded-xl border border-dark-border bg-dark-bg px-4 py-3 text-lg font-semibold tabular-nums text-dark-text outline-none placeholder:text-dark-faint focus:border-brandGlow/60";

function Confirm() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center rounded-xl bg-brand px-5 py-3.5 text-base font-bold text-onbrand transition hover:bg-brand/90 active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? "A conferir…" : "Conferir"}
    </button>
  );
}

function Verdict({ difference }: { difference: number }) {
  const ok = Math.abs(difference) < 1;
  if (ok)
    return (
      <p className="flex items-center gap-2 text-lg font-bold text-brandGlow">
        <CheckCircle2 className="h-6 w-6" aria-hidden /> Está certo
      </p>
    );
  return (
    <p className={`flex items-center gap-2 text-lg font-bold ${difference < 0 ? "text-danger" : "text-warning"}`}>
      <AlertTriangle className="h-6 w-6" aria-hidden />
      {difference < 0 ? `Faltam ${fmt(-difference)}` : `Sobram ${fmt(difference)}`}
    </p>
  );
}

/**
 * "Fechar o dia?" — aparece no painel ao fim do dia (ou na página da caixa).
 * A pessoa escreve o que contou; a app diz logo se bate certo.
 */
export function CashCountCard({
  expected,
  done,
  alwaysOpen = false,
}: {
  /** Quanto devia ter (vendas pagas + dívidas recebidas − despesas de hoje). */
  expected: number;
  /** Contagem já feita hoje (se houver). */
  done?: { counted: number; difference: number } | null;
  /** Na página da caixa o formulário fica sempre aberto. */
  alwaysOpen?: boolean;
}) {
  const [state, action] = useFormState<CashCountState, FormData>(saveCashCount, { error: null });
  const [open, setOpen] = useState(alwaysOpen);
  const [dismissed, setDismissed] = useState(false);
  const result = state.result ?? null;

  if (dismissed) return null;

  // Já contou hoje: mostra o resultado em pequeno.
  if (!open && !result && done) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-dark-border bg-dark-surface px-4 py-3.5">
        <div>
          <p className="text-xs text-dark-muted">Caixa de hoje</p>
          <Verdict difference={done.difference} />
        </div>
        <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-accent">
          Contar de novo
        </button>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-brandGlow/25 bg-dark-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brandGlow/15 text-brandGlow">
            <Coins className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold text-dark-text">Fechar o dia?</h2>
            <p className="text-sm text-dark-muted">
              Hoje devia ter <strong className="tabular-nums text-dark-text">{fmt(expected)}</strong>
            </p>
          </div>
        </div>
        {!alwaysOpen && (
          <button type="button" onClick={() => setDismissed(true)} aria-label="Agora não" className="-m-1 rounded-lg p-1 text-dark-faint hover:text-dark-text">
            <X className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>

      {result ? (
        <div className="mt-4 space-y-1 rounded-xl bg-white/[0.03] p-4">
          <Verdict difference={result.difference} />
          <p className="text-sm text-dark-muted">
            Contou {fmt(result.counted)} · devia ter {fmt(result.expected)}
          </p>
        </div>
      ) : !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 w-full rounded-xl bg-brand px-5 py-3.5 text-base font-bold text-onbrand transition hover:bg-brand/90 active:scale-[0.98]"
        >
          Contar a caixa
        </button>
      ) : (
        <form action={action} className="mt-4 space-y-3">
          <label className="block text-sm text-dark-muted">
            Dinheiro na gaveta
            <input name="cash" inputMode="decimal" autoFocus placeholder="0" className={`mt-1 ${FIELD}`} />
          </label>
          <label className="block text-sm text-dark-muted">
            Recebido no M-Pesa / e-Mola hoje <span className="text-dark-faint">(se houver)</span>
            <input name="mobile" inputMode="decimal" placeholder="0" className={`mt-1 ${FIELD}`} />
          </label>
          {state.error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>}
          <Confirm />
          <p className="text-xs text-dark-faint">Conta: vendas pagas + dívidas recebidas hoje, menos as despesas de hoje.</p>
        </form>
      )}
    </section>
  );
}
