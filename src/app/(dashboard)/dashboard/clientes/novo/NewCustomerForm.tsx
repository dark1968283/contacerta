"use client";

import { useFormState } from "react-dom";
import { createCustomer, type CustomerActionState } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: CustomerActionState = { error: null };

export function NewCustomerForm() {
  const [state, formAction] = useFormState(createCustomer, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="name" className="field-label">
          Nome
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoFocus
          className="input-field"
          placeholder="Maria dos Santos"
        />
      </div>

      <div>
        <label htmlFor="phone" className="field-label">
          Telefone (opcional)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          className="input-field"
          placeholder="84 123 4567"
        />
      </div>

      <div>
        <label htmlFor="email" className="field-label">
          Email (opcional)
        </label>
        <input id="email" name="email" type="email" className="input-field" />
      </div>

      <div>
        <label htmlFor="address" className="field-label">
          Endereço (opcional)
        </label>
        <input id="address" name="address" type="text" className="input-field" />
      </div>

      {state.error && <p className="error-text">{state.error}</p>}

      <SubmitButton>Criar cliente</SubmitButton>
    </form>
  );
}
