"use client";

import { useFormState } from "react-dom";
import { useRef, useEffect } from "react";
import { createCategory, type ProductActionState } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

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
    <form ref={formRef} action={formAction} className="flex items-start gap-2">
      <div className="flex-1">
        <input
          name="name"
          type="text"
          required
          placeholder="Nome da categoria"
          className="input-field"
        />
        {state.error && <p className="error-text">{state.error}</p>}
      </div>
      <SubmitButtonCompact />
    </form>
  );
}

function SubmitButtonCompact() {
  return (
    <button type="submit" className="rounded-xl bg-brand px-4 py-3 font-medium text-white">
      Criar
    </button>
  );
}
