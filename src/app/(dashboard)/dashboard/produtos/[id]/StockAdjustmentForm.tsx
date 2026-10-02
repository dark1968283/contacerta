"use client";

import { useFormState } from "react-dom";
import { useRef, useEffect, useState } from "react";
import { PackagePlus, SlidersHorizontal } from "lucide-react";
import { adjustStock, type ProductActionState } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Panel } from "@/components/dashboard/Panel";
import { FIELD_INPUT, FIELD_LABEL, FormError } from "../_components/ProductsUI";

const initialState: ProductActionState = { error: null };

export function StockAdjustmentForm({ productId }: { productId: string }) {
  const action = adjustStock.bind(null, productId);
  const [state, formAction] = useFormState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<"entrada" | "ajuste">("entrada");

  useEffect(() => {
    if (!state.error) {
      formRef.current?.reset();
      setType("entrada");
    }
  }, [state]);

  return (
    <Panel as="div" className="p-4 sm:p-5">
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setType("entrada")}
            aria-pressed={type === "entrada"}
            className={`rounded-xl border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brandGlow/50 ${
              type === "entrada"
                ? "border-brandGlow/40 bg-brandGlow/10"
                : "border-dark-border bg-white/[0.02] hover:border-dark-borderStrong"
            }`}
          >
            <PackagePlus className={`h-5 w-5 ${type === "entrada" ? "text-brandGlow" : "text-dark-muted"}`} aria-hidden />
            <span className="mt-2 block text-sm font-semibold text-dark-text">Entrada</span>
            <span className="block text-xs text-dark-muted">Adicionar stock</span>
          </button>
          <button
            type="button"
            onClick={() => setType("ajuste")}
            aria-pressed={type === "ajuste"}
            className={`rounded-xl border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-warning/50 ${
              type === "ajuste"
                ? "border-warning/40 bg-warning/10"
                : "border-dark-border bg-white/[0.02] hover:border-dark-borderStrong"
            }`}
          >
            <SlidersHorizontal className={`h-5 w-5 ${type === "ajuste" ? "text-warning" : "text-dark-muted"}`} aria-hidden />
            <span className="mt-2 block text-sm font-semibold text-dark-text">Correção</span>
            <span className="block text-xs text-dark-muted">Corrigir stock existente</span>
          </button>
        </div>
        <input type="hidden" name="type" value={type} />

        <div>
          <label htmlFor="quantity" className={FIELD_LABEL}>
            {type === "entrada" ? "Quantidade recebida" : "Ajuste (use − para reduzir)"}
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            inputMode="numeric"
            required
            placeholder={type === "entrada" ? "10" : "-2"}
            className={FIELD_INPUT}
          />
        </div>

        <div>
          <label htmlFor="note" className={FIELD_LABEL}>
            Nota (opcional)
          </label>
          <input
            id="note"
            name="note"
            type="text"
            placeholder={type === "entrada" ? "Compra ao fornecedor X" : "Contagem física"}
            className={FIELD_INPUT}
          />
        </div>

        {state.error && <FormError>{state.error}</FormError>}

        <SubmitButton>Registar</SubmitButton>
      </form>
    </Panel>
  );
}
