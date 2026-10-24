/**
 * Lucro bruto de itens vendidos.
 *
 * Regra: usa o custo GUARDADO NA VENDA (sale_items.cost_price), que é o
 * custo do produto no dia em que foi vendido. Assim, mudar o preço de
 * compra hoje não altera o lucro das vendas antigas.
 *
 * Vendas muito antigas (antes da migração 0012) não têm custo guardado;
 * só nesses casos usamos o custo actual do produto, como estimativa.
 * Se não houver custo nenhum, o item fica fora da conta (nunca assumimos 0).
 */
export type ProfitItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
  cost_price?: number | null;
};

export function itemCost(
  item: ProfitItem,
  currentCosts: Map<string, number | null | undefined>,
): number | null {
  if (item.cost_price !== null && item.cost_price !== undefined) return item.cost_price;
  const current = currentCosts.get(item.product_id);
  return current === null || current === undefined ? null : current;
}

export function grossProfitOf(
  items: ProfitItem[],
  currentCosts: Map<string, number | null | undefined>,
) {
  let profit = 0;
  let itemsWithCost = 0;
  const missing = new Set<string>();
  for (const item of items) {
    const cost = itemCost(item, currentCosts);
    if (cost === null) {
      missing.add(item.product_id);
      continue;
    }
    profit += item.quantity * (item.unit_price - cost);
    itemsWithCost += 1;
  }
  return { profit, itemsWithCost, hasData: itemsWithCost > 0, missingProductIds: missing };
}
