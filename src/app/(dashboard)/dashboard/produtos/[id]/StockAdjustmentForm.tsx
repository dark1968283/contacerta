"use client";

import { useFormState } from "react-dom";
import { useRef, useEffect, useState } from "react";
import { adjustStock, type ProductActionState } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

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
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-xl border border-line bg-white p-4"
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("entrada")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            type === "entrada" ? "bg-brand text-white" : "bg-paper text-ink/60"
          }`}
        >
          Entrada
        </button>
        <button
          type="button"
          onClick={() => setType("ajuste")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            type === "ajuste" ? "bg-brand text-white" : "bg-paper text-ink/60"
          }`}
        >
          Correção
        </button>
      </div>
      <input type="hidden" name="type" value={type} />

      <div>
        <label htmlFor="quantity" className="field-label">
          {type === "entrada" ? "Quantidade recebida" : "Ajuste (use − para reduzir)"}
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          inputMode="numeric"
          required
          placeholder={type === "entrada" ? "10" : "-2"}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="note" className="field-label">
          Nota (opcional)
        </label>
        <input
          id="note"
          name="note"
          type="text"
          placeholder={type === "entrada" ? "Compra ao fornecedor X" : "Contagem física"}
          className="input-field"
        />
      </div>

      {state.error && <p className="error-text">{state.error}</p>}

      <SubmitButton>Registar</SubmitButton>
    </form>
  );
}
