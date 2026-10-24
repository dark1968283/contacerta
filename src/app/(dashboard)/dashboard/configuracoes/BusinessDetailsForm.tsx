"use client";

import { useFormState, useFormStatus } from "react-dom";
import { saveBusinessDetails, type BusinessDetailsState } from "./business-actions";

const INPUT =
  "mt-1.5 w-full rounded-xl border border-dark-border bg-dark-bg px-3.5 py-3 text-base text-dark-text placeholder:text-dark-faint focus:border-brandGlow/50 focus:outline-none";

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-onbrand transition hover:bg-brand/90 disabled:opacity-60"
    >
      {pending ? "A guardar…" : "Guardar dados"}
    </button>
  );
}

/** Dados que aparecem no topo das facturas e recibos em PDF. */
export function BusinessDetailsForm({
  businessId,
  initial,
}: {
  businessId: string;
  initial: { name: string; nuit: string; phone: string; address: string };
}) {
  const [state, action] = useFormState<BusinessDetailsState, FormData>(saveBusinessDetails, {});

  return (
    <section aria-labelledby="negocio-title" className="mt-6 rounded-2xl border border-dark-border bg-dark-surface p-4 sm:p-5">
      <h2 id="negocio-title" className="text-base font-semibold text-dark-text">
        O seu negócio
      </h2>
      <p className="mt-1 text-sm text-dark-muted">O nome aparece no topo da app, nos recibos e nas facturas. O resto é opcional.</p>

      <form action={action} className="mt-4 grid max-w-xl gap-4">
        <input type="hidden" name="business_id" value={businessId} />
        <input type="hidden" name="current_name" value={initial.name} />
        <label className="block text-sm font-medium text-dark-text">
          Nome do negócio
          <input name="name" defaultValue={initial.name} required minLength={2} maxLength={80} placeholder="Ex.: Mercearia da Ana" className={INPUT} />
        </label>
        <label className="block text-sm font-medium text-dark-text">
          NUIT
          <input name="nuit" defaultValue={initial.nuit} inputMode="numeric" maxLength={11} placeholder="9 algarismos" className={INPUT} />
        </label>
        <label className="block text-sm font-medium text-dark-text">
          Telefone
          <input name="phone" defaultValue={initial.phone} inputMode="tel" maxLength={30} placeholder="84 000 0000" className={INPUT} />
        </label>
        <label className="block text-sm font-medium text-dark-text">
          Endereço
          <input name="address" defaultValue={initial.address} maxLength={200} placeholder="Bairro, rua, cidade" className={INPUT} />
        </label>
        {state.error && <p className="text-sm font-medium text-danger">{state.error}</p>}
        {state.success && <p className="text-sm font-medium text-brandGlow">{state.success}</p>}
        <div>
          <Save />
        </div>
      </form>
    </section>
  );
}
