"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { Info, Package, Tag, Wallet } from "lucide-react";
import { createProduct, type ProductActionState } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Panel } from "@/components/dashboard/Panel";
import { BlockTitle, FIELD_HINT, FIELD_INPUT, FIELD_LABEL, FormError } from "../_components/ProductsUI";

const initialState: ProductActionState = { error: null };

export function NewProductForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [state, formAction] = useFormState(createProduct, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Panel as="div" className="p-4 sm:p-6">
        <BlockTitle icon={Tag} title="Informação do produto" description="Como o produto aparece nas vendas e no stock." />
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className={FIELD_LABEL}>
              Nome do produto
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              className={FIELD_INPUT}
              placeholder="Arroz 5kg"
            />
          </div>

          <div>
            <label htmlFor="category_id" className={FIELD_LABEL}>
              Categoria (opcional)
            </label>
            <select id="category_id" name="category_id" className={FIELD_INPUT}>
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className={FIELD_HINT}>
              Não vê a categoria que precisa?{" "}
              <Link href="/dashboard/produtos/categorias" className="font-medium text-brandGlow hover:underline">
                Criar categoria
              </Link>
            </p>
          </div>
        </div>
      </Panel>

      <Panel as="div" className="p-4 sm:p-6">
        <BlockTitle icon={Wallet} title="Preços" description="Quanto vende e, se quiser, quanto lhe custa." />
        <div className="grid gap-4 sm:grid-cols-2">
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
              required
              className={FIELD_INPUT}
              placeholder="500"
            />
          </div>
          <div>
            <label htmlFor="cost_price" className={FIELD_LABEL}>
              Custo (opcional)
            </label>
            <input
              id="cost_price"
              name="cost_price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={FIELD_INPUT}
              placeholder="350"
            />
          </div>
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-white/[0.03] p-3 text-xs leading-relaxed text-dark-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brandGlow" aria-hidden />
          <span>
            Sem custo, este produto fica de fora do cálculo de lucro bruto no
            Dashboard — pode preencher mais tarde.
          </span>
        </p>
      </Panel>

      <Panel as="div" className="p-4 sm:p-6">
        <BlockTitle icon={Package} title="Stock" description="Quantas unidades tem agora e quando quer ser avisado." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="initial_stock" className={FIELD_LABEL}>
              Stock inicial
            </label>
            <input
              id="initial_stock"
              name="initial_stock"
              type="number"
              inputMode="numeric"
              min="0"
              defaultValue={0}
              className={FIELD_INPUT}
            />
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
              defaultValue={5}
              className={FIELD_INPUT}
            />
            <p className={FIELD_HINT}>Mostra “Stock baixo” quando o stock for igual ou inferior a este valor.</p>
          </div>
        </div>
      </Panel>

      {state.error && <FormError>{state.error}</FormError>}

      <SubmitButton>Criar produto</SubmitButton>
    </form>
  );
}
