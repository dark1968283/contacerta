"use client";

import { useFormState } from "react-dom";
import { updateProduct, type ProductActionState } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
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
    <form action={formAction} className="space-y-4 rounded-xl border border-line bg-white p-4">
      <div>
        <label htmlFor="name" className="field-label">
          Nome
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={product.name}
          required
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="category_id" className="field-label">
          Categoria
        </label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={product.category_id ?? ""}
          className="input-field"
        >
          <option value="">Sem categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="selling_price" className="field-label">
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
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="cost_price" className="field-label">
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
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label htmlFor="low_stock_threshold" className="field-label">
          Alerta de stock baixo
        </label>
        <input
          id="low_stock_threshold"
          name="low_stock_threshold"
          type="number"
          inputMode="numeric"
          min="0"
          defaultValue={product.low_stock_threshold}
          className="input-field"
        />
      </div>

      {state.error && <p className="error-text">{state.error}</p>}

      <SubmitButton>Guardar alterações</SubmitButton>
    </form>
  );
}
