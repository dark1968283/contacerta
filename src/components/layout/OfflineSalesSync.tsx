"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown, CloudUpload, RefreshCw, Trash2, WifiOff } from "lucide-react";
import { syncOfflineSale } from "@/app/(dashboard)/dashboard/vendas/actions";
import {
  OFFLINE_SALES_EVENT,
  isNetworkError,
  listQueuedSales,
  removeQueuedSale,
  updateQueuedSale,
  type QueuedSale,
} from "@/lib/offline-sales";

const formatMT = (v: number) => `${Math.round(v).toLocaleString("pt-MZ")} MT`;

/**
 * Envia para o servidor as vendas feitas sem internet, assim que a rede volta.
 * Mostra uma faixa discreta com quantas faltam e, se alguma falhar
 * (por ex. falta de stock), deixa o utilizador decidir o que fazer.
 */
export function OfflineSalesSync({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [queue, setQueue] = useState<QueuedSale[]>([]);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [open, setOpen] = useState(false);
  const busy = useRef(false);

  const refresh = useCallback(() => setQueue(listQueuedSales(businessId)), [businessId]);

  const syncAll = useCallback(async () => {
    if (busy.current || !navigator.onLine) return;
    const pending = listQueuedSales(businessId).filter((s) => s.status === "pending");
    if (!pending.length) return;

    busy.current = true;
    setSyncing(true);
    let sent = 0;
    try {
      for (const sale of pending) {
        try {
          const result = await syncOfflineSale({
            ref: sale.ref,
            soldAt: sale.soldAt,
            paymentMethod: sale.paymentMethod,
            customerId: sale.customerId,
            items: sale.items.map(({ product_id, quantity }) => ({ product_id, quantity })),
          });
          if (result.ok) {
            removeQueuedSale(sale.ref);
            sent += 1;
          } else if (!result.retry) {
            updateQueuedSale(sale.ref, { status: "error", error: result.error });
          } else {
            break; // problema temporário: tenta mais tarde
          }
        } catch (error) {
          if (isNetworkError(error)) break;
          break;
        }
      }
    } finally {
      busy.current = false;
      setSyncing(false);
      refresh();
      if (sent > 0) router.refresh();
    }
  }, [businessId, refresh, router]);

  useEffect(() => {
    const updateOnline = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) void syncAll();
    };
    refresh();
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    window.addEventListener(OFFLINE_SALES_EVENT, refresh);
    window.addEventListener("storage", refresh);
    // Tentativa periódica (a rede às vezes volta sem o evento "online").
    const timer = window.setInterval(() => void syncAll(), 30_000);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      window.removeEventListener(OFFLINE_SALES_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.clearInterval(timer);
    };
  }, [refresh, syncAll]);

  // Uma venda nova entrou na fila e há rede: envia logo.
  // (Depende só da lista de identificadores, para não repetir sem parar
  // quando o envio falha por falta de rede.)
  const pendingKey = queue
    .filter((s) => s.status === "pending")
    .map((s) => s.ref)
    .join("|");
  useEffect(() => {
    if (online && pendingKey) void syncAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingKey, online]);

  const failed = queue.filter((s) => s.status === "error");
  const waiting = queue.filter((s) => s.status === "pending");

  if (!queue.length && online) return null;

  const tone = failed.length ? "danger" : "amber";

  return (
    <div className="px-4 pt-3 sm:px-6">
      <div
        className={`overflow-hidden rounded-2xl border ${
          tone === "danger" ? "border-danger/30 bg-danger/[0.08]" : "border-warning/30 bg-warning/[0.08]"
        }`}
      >
        <button
          type="button"
          onClick={() => queue.length && setOpen((v) => !v)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left"
          aria-expanded={open}
        >
          <span className={tone === "danger" ? "text-danger" : "text-warning"}>
            {failed.length ? (
              <AlertTriangle className="h-5 w-5" aria-hidden />
            ) : !online ? (
              <WifiOff className="h-5 w-5" aria-hidden />
            ) : syncing ? (
              <RefreshCw className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <CloudUpload className="h-5 w-5" aria-hidden />
            )}
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-semibold text-dark-text">
              {failed.length
                ? `${failed.length} venda${failed.length > 1 ? "s" : ""} não ${failed.length > 1 ? "foram enviadas" : "foi enviada"}`
                : waiting.length
                  ? `${waiting.length} venda${waiting.length > 1 ? "s" : ""} por enviar`
                  : "Sem internet"}
            </span>
            <span className="block text-xs text-dark-muted">
              {failed.length
                ? "Toque para ver o que aconteceu."
                : !online
                  ? "Pode continuar a vender. Enviamos tudo quando a rede voltar."
                  : syncing
                    ? "A enviar…"
                    : "A enviar assim que possível."}
            </span>
          </span>
          {queue.length > 0 && (
            <ChevronDown className={`h-4 w-4 shrink-0 text-dark-muted transition ${open ? "rotate-180" : ""}`} aria-hidden />
          )}
        </button>

        {open && queue.length > 0 && (
          <ul className="divide-y divide-white/[0.06] border-t border-white/[0.08]">
            {queue.map((sale) => (
              <li key={sale.ref} className="px-4 py-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-dark-text">
                      {sale.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    </p>
                    <p className="text-xs text-dark-muted">
                      {new Date(sale.soldAt).toLocaleString("pt-MZ", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {sale.paymentMethod === "credito" && sale.customerName ? ` · fiado a ${sale.customerName}` : ""}
                    </p>
                    {sale.error && <p className="mt-1 text-xs font-medium text-danger">{sale.error}</p>}
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-dark-text">{formatMT(sale.total)}</span>
                </div>

                {sale.status === "error" && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        updateQueuedSale(sale.ref, { status: "pending", error: undefined });
                        void syncAll();
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-white/[0.07] px-3 py-2 text-xs font-semibold text-dark-text"
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Tentar de novo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Apagar esta venda? Ela não vai ser registada.")) removeQueuedSale(sale.ref);
                      }}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden /> Apagar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
