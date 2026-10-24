import { Zap } from "lucide-react";
import { startPaysuitePayment } from "../planos/paysuite-actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { MethodLogo } from "@/components/payments/MethodLogo";

/**
 * Pagamento automático: o cliente paga na página da PaySuite e o plano
 * fica activo sozinho, sem esperar pela equipa.
 */
export function PaysuiteBox({ planId, cycle, error }: { planId: string; cycle: string; error?: string }) {
  return (
    <section className="rounded-2xl border border-brandGlow/30 bg-brandGlow/[0.06] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brandGlow/15 text-brandGlow">
          <Zap size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold text-dark-text">Pagar agora · activação imediata</h2>
          <p className="mt-1 text-sm leading-5 text-dark-muted">
            Escolha M-Pesa ou e-Mola, confirme no celular com o seu PIN e o plano fica activo na hora.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-dark-text">{error}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        {(["mpesa", "emola"] as const).map((method) => (
          <form key={method} action={startPaysuitePayment}>
            <input type="hidden" name="plan_id" value={planId} />
            <input type="hidden" name="billing_cycle" value={cycle} />
            <input type="hidden" name="method" value={method} />
            <SubmitButton className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-brand text-base font-bold text-onbrand transition hover:bg-brand/90 disabled:opacity-60">
              <MethodLogo method={method} size={30} className="bg-white" />
              {method === "mpesa" ? "M-Pesa" : "e-Mola"}
            </SubmitButton>
          </form>
        ))}
      </div>
      <p className="mt-3 text-xs text-dark-faint">Pagamento seguro processado pela PaySuite.</p>
    </section>
  );
}
