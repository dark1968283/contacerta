"use client";

import { useFormState } from "react-dom";
import { Mail, MapPin, Phone, User } from "lucide-react";
import { updateCustomer, type CustomerActionState } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Panel } from "@/components/dashboard/Panel";
import { FIELD_INPUT_ICON, FIELD_LABEL, FieldIcon, FormError } from "../_components/CustomersUI";
import type { Database } from "@/lib/types/database.types";

const initialState: CustomerActionState = { error: null };

type Customer = Database["public"]["Tables"]["customers"]["Row"];

export function EditCustomerForm({ customer }: { customer: Customer }) {
  const action = updateCustomer.bind(null, customer.id);
  const [state, formAction] = useFormState(action, initialState);

  return (
    <Panel as="div" className="p-4 sm:p-5">
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className={FIELD_LABEL}>
            Nome
          </label>
          <FieldIcon icon={User}>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={customer.name}
              required
              className={FIELD_INPUT_ICON}
            />
          </FieldIcon>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="phone" className={FIELD_LABEL}>
              Telefone
            </label>
            <FieldIcon icon={Phone}>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                defaultValue={customer.phone ?? ""}
                className={FIELD_INPUT_ICON}
              />
            </FieldIcon>
          </div>

          <div className="min-w-0">
            <label htmlFor="email" className={FIELD_LABEL}>
              Email
            </label>
            <FieldIcon icon={Mail}>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={customer.email ?? ""}
                className={FIELD_INPUT_ICON}
              />
            </FieldIcon>
          </div>
        </div>

        <div>
          <label htmlFor="address" className={FIELD_LABEL}>
            Endereço
          </label>
          <FieldIcon icon={MapPin}>
            <input
              id="address"
              name="address"
              type="text"
              defaultValue={customer.address ?? ""}
              className={FIELD_INPUT_ICON}
            />
          </FieldIcon>
        </div>

        {state.error && <FormError>{state.error}</FormError>}

        <SubmitButton>Guardar alterações</SubmitButton>
      </form>
    </Panel>
  );
}
