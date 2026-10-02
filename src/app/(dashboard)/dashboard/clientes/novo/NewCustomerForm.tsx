"use client";

import { useFormState } from "react-dom";
import { Mail, MapPin, Phone, User, UserPlus } from "lucide-react";
import { createCustomer, type CustomerActionState } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Panel } from "@/components/dashboard/Panel";
import { BlockTitle, FIELD_INPUT_ICON, FIELD_LABEL, FieldIcon, FormError } from "../_components/CustomersUI";

const initialState: CustomerActionState = { error: null };

export function NewCustomerForm() {
  const [state, formAction] = useFormState(createCustomer, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Panel as="div" className="p-4 sm:p-6">
        <BlockTitle icon={UserPlus} title="Informação do cliente" description="Como o cliente aparece nas vendas e nas dívidas." />
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className={FIELD_LABEL}>
              Nome
            </label>
            <FieldIcon icon={User}>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoFocus
                className={FIELD_INPUT_ICON}
                placeholder="Maria dos Santos"
              />
            </FieldIcon>
          </div>

          <div>
            <label htmlFor="phone" className={FIELD_LABEL}>
              Telefone (opcional)
            </label>
            <FieldIcon icon={Phone}>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                className={FIELD_INPUT_ICON}
                placeholder="84 123 4567"
              />
            </FieldIcon>
          </div>
        </div>
      </Panel>

      <Panel as="div" className="p-4 sm:p-6">
        <BlockTitle icon={Mail} title="Contacto" description="Opcional — pode preencher mais tarde." />
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className={FIELD_LABEL}>
              Email (opcional)
            </label>
            <FieldIcon icon={Mail}>
              <input id="email" name="email" type="email" className={FIELD_INPUT_ICON} />
            </FieldIcon>
          </div>

          <div>
            <label htmlFor="address" className={FIELD_LABEL}>
              Endereço (opcional)
            </label>
            <FieldIcon icon={MapPin}>
              <input id="address" name="address" type="text" className={FIELD_INPUT_ICON} />
            </FieldIcon>
          </div>
        </div>
      </Panel>

      {state.error && <FormError>{state.error}</FormError>}

      <SubmitButton>Criar cliente</SubmitButton>
    </form>
  );
}
