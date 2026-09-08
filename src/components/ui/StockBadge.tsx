export function StockBadge({
  quantity,
  threshold,
}: {
  quantity: number;
  threshold: number;
}) {
  if (quantity === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-alert-soft px-2.5 py-1 text-xs font-medium text-alert">
        Esgotado
      </span>
    );
  }
  if (quantity <= threshold) {
    return (
      <span className="inline-flex items-center rounded-full bg-warn-soft px-2.5 py-1 text-xs font-medium text-warn">
        Stock baixo
      </span>
    );
  }
  return null;
}
