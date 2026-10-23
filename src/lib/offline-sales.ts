/**
 * Fila de vendas guardadas no telemóvel quando não há internet.
 * Só corre no browser. O servidor continua a ser quem confirma a venda:
 * enquanto estiver aqui, a venda está "por enviar", não "registada".
 */

export type QueuedSaleItem = {
  product_id: string;
  quantity: number;
  name: string;
  unit_price: number;
};

export type QueuedSale = {
  ref: string;
  businessId: string;
  soldAt: string;
  paymentMethod: "pago" | "credito";
  customerId: string | null;
  customerName: string | null;
  items: QueuedSaleItem[];
  total: number;
  status: "pending" | "error";
  error?: string;
};

const KEY = "contacerta-offline-sales-v1";
export const OFFLINE_SALES_EVENT = "contacerta-offline-sales-changed";

function readAll(): QueuedSale[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? (value as QueuedSale[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: QueuedSale[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } finally {
    window.dispatchEvent(new CustomEvent(OFFLINE_SALES_EVENT));
  }
}

export function listQueuedSales(businessId: string) {
  return readAll().filter((s) => s.businessId === businessId);
}

export function queueSale(sale: QueuedSale) {
  const all = readAll().filter((s) => s.ref !== sale.ref);
  writeAll([...all, sale]);
}

export function removeQueuedSale(ref: string) {
  writeAll(readAll().filter((s) => s.ref !== ref));
}

export function updateQueuedSale(ref: string, patch: Partial<QueuedSale>) {
  writeAll(readAll().map((s) => (s.ref === ref ? { ...s, ...patch } : s)));
}

/** Unidades de cada produto que estão em vendas ainda por enviar. */
export function pendingQuantities(businessId: string) {
  const map = new Map<string, number>();
  for (const sale of listQueuedSales(businessId)) {
    for (const item of sale.items) {
      map.set(item.product_id, (map.get(item.product_id) ?? 0) + item.quantity);
    }
  }
  return map;
}

export function newSaleRef() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // Alternativa para browsers antigos.
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
  );
}

/** Diz se o erro é de rede (sem internet / pedido não chegou ao servidor). */
export function isNetworkError(error: unknown) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const msg = error instanceof Error ? error.message : String(error);
  return /fetch|network|Failed to fetch|NetworkError|Load failed|ERR_INTERNET/i.test(msg);
}
