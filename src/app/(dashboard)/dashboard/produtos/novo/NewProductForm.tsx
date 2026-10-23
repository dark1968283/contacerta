"use client";

import { useState } from "react";
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
  const [selling, setSelling] = useState("");
  const [cost, setCost] = useState("");
  const sellingN = Number(selling);
  const costN = Number(cost);
  const hasBoth = selling !== "" && cost !== "" && sellingN > 0 && costN >= 0;
  const margin = sellingN - costN;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Panel as="div" className="p-4 sm:p-6">
        <BlockTitle icon={Tag} title="Produto" description="O nome que vai ver na hora de vender." />
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
        <BlockTitle icon={Wallet} title="Preços" description="Por quanto vende e por quanto comprou." />
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
              value={selling}
              onChange={(e) => setSelling(e.target.value)}
              className={FIELD_INPUT}
              placeholder="500"
            />
          </div>
          <div>
            <label htmlFor="cost_price" className={FIELD_LABEL}>
              Preço de compra (opcional)
            </label>
            <input
              id="cost_price"
              name="cost_price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className={FIELD_INPUT}
              placeholder="350"
            />
          </div>
        </div>
        {hasBoth ? (
          <p
            className={`mt-4 rounded-xl p-3 text-sm font-semibold ${
              margin > 0 ? "bg-brandGlow/10 text-brandGlow" : "bg-danger/10 text-danger"
            }`}
          >
            {margin > 0
              ? `Ganha ${Math.round(margin).toLocaleString("pt-MZ")} MT em cada unidade vendida.`
              : margin === 0
                ? "Vende ao mesmo preço que comprou: não ganha nada."
                : `Atenção: perde ${Math.round(-margin).toLocaleString("pt-MZ")} MT em cada unidade vendida.`}
          </p>
        ) : (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-white/[0.03] p-3 text-xs leading-relaxed text-dark-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brandGlow" aria-hidden />
            <span>
              Preencha o preço de compra para a app mostrar quanto ganha em cada venda.
              Sem ele, este produto não entra no lucro.
            </span>
          </p>
        )}
      </Panel>

      <Panel as="div" className="p-4 sm:p-6">
        <BlockTitle icon={Package} title="Stock" description="Quantas unidades tem e quando quer ser avisado." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="initial_stock" className={FIELD_LABEL}>
              Quantas unidades tem agora?
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
              Avisar quando restarem
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
            <p className={FIELD_HINT}>Exemplo: com 5, avisa quando só restarem 5 ou menos.</p>
          </div>
        </div>
      </Panel>

      {state.error && <FormError>{state.error}</FormError>}

      <SubmitButton>Guardar produto</SubmitButton>
    </form>
  );
}
