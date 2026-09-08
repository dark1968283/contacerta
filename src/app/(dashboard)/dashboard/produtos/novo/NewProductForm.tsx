"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { createProduct, type ProductActionState } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: ProductActionState = { error: null };

export function NewProductForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [state, formAction] = useFormState(createProduct, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="name" className="field-label">
          Nome do produto
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoFocus
          className="input-field"
          placeholder="Arroz 5kg"
        />
      </div>

      <div>
        <label htmlFor="category_id" className="field-label">
          Categoria (opcional)
        </label>
        <select id="category_id" name="category_id" className="input-field">
          <option value="">Sem categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ink/50">
          Não vê a categoria que precisa?{" "}
          <Link href="/dashboard/produtos/categorias" className="text-brand">
            Criar categoria
          </Link>
        </p>
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
            required
            className="input-field"
            placeholder="500"
          />
        </div>
        <div>
          <label htmlFor="cost_price" className="field-label">
            Custo (opcional)
          </label>
          <input
            id="cost_price"
            name="cost_price"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            className="input-field"
            placeholder="350"
          />
        </div>
      </div>
      <p className="-mt-3 text-xs text-ink/50">
        Sem custo, este produto fica de fora do cálculo de lucro bruto no
        Dashboard — pode preencher mais tarde.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="initial_stock" className="field-label">
            Stock inicial
          </label>
          <input
            id="initial_stock"
            name="initial_stock"
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue={0}
            className="input-field"
          />
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
            defaultValue={5}
            className="input-field"
          />
        </div>
      </div>

      {state.error && <p className="error-text">{state.error}</p>}

      <SubmitButton>Criar produto</SubmitButton>
    </form>
  );
}
