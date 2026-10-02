"use client";

import { useFormState } from "react-dom";
import { useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { createCategory, type ProductActionState } from "../actions";
import { FIELD_INPUT, FormError } from "../_components/ProductsUI";

const initialState: ProductActionState = { error: null };

export function NewCategoryForm() {
  const [state, formAction] = useFormState(createCategory, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <input
            name="name"
            type="text"
            required
            placeholder="Nome da categoria"
            aria-label="Nome da categoria"
            className={FIELD_INPUT}
          />
        </div>
        <SubmitButtonCompact />
      </div>
      {state.error && <FormError>{state.error}</FormError>}
    </form>
  );
}

function SubmitButtonCompact() {
  return (
    <button
      type="submit"
      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-4 py-3 text-base font-medium text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand/90 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-brandGlow/50"
    >
      <Plus className="h-4 w-4" aria-hidden />
      Criar
    </button>
  );
}
