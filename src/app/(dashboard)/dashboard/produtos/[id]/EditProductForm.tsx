"use client";

import { useFormState } from "react-dom";
import { updateProduct, type ProductActionState } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Panel } from "@/components/dashboard/Panel";
import { FIELD_INPUT, FIELD_LABEL, FormError } from "../_components/ProductsUI";
import type { Database } from "@/lib/types/database.types";

const initialState: ProductActionState = { error: null };

type Product = Database["public"]["Tables"]["products"]["Row"];

export function EditProductForm({
  product,
  categories,
}: {
  product: Product;
  categories: { id: string; name: string }[];
}) {
  const action = updateProduct.bind(null, product.id);
  const [state, formAction] = useFormState(action, initialState);

  return (
    <Panel as="div" className="p-4 sm:p-5">
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className={FIELD_LABEL}>
            Nome
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={product.name}
            required
            className={FIELD_INPUT}
          />
        </div>

        <div>
          <label htmlFor="category_id" className={FIELD_LABEL}>
            Categoria
          </label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={product.category_id ?? ""}
            className={FIELD_INPUT}
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 min-[420px]:grid-cols-2">
          <div>
            <label htmlFor="selling_price" className={FIELD_LABEL}>
              Preço de venda (MT)
            </label>
            <input
              id="selling_price"
              name="selling_price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              defaultValue={product.selling_price}
              required
              className={FIELD_INPUT}
            />
          </div>
          <div>
            <label htmlFor="cost_price" className={FIELD_LABEL}>
              Custo
            </label>
            <input
              id="cost_price"
              name="cost_price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              defaultValue={product.cost_price ?? ""}
              className={FIELD_INPUT}
            />
          </div>
        </div>

        <div>
          <label htmlFor="low_stock_threshold" className={FIELD_LABEL}>
            Alerta de stock baixo
          </label>
          <input
            id="low_stock_threshold"
            name="low_stock_threshold"
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue={product.low_stock_threshold}
            className={FIELD_INPUT}
          />
        </div>

        {state.error && <FormError>{state.error}</FormError>}

        <SubmitButton>Guardar alterações</SubmitButton>
      </form>
    </Panel>
  );
}
