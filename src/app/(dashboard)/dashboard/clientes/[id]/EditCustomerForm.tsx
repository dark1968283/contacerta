"use client";

import { useFormState } from "react-dom";
import { updateCustomer, type CustomerActionState } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Database } from "@/lib/types/database.types";

const initialState: CustomerActionState = { error: null };

type Customer = Database["public"]["Tables"]["customers"]["Row"];

export function EditCustomerForm({ customer }: { customer: Customer }) {
  const action = updateCustomer.bind(null, customer.id);
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-line bg-white p-4">
      <div>
        <label htmlFor="name" className="field-label">
          Nome
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={customer.name}
          required
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="phone" className="field-label">
          Telefone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={customer.phone ?? ""}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={customer.email ?? ""}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="address" className="field-label">
          Endereço
        </label>
        <input
          id="address"
          name="address"
          type="text"
          defaultValue={customer.address ?? ""}
          className="input-field"
        />
      </div>

      {state.error && <p className="error-text">{state.error}</p>}

      <SubmitButton>Guardar alterações</SubmitButton>
    </form>
  );
}
