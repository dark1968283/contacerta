"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useFormState, useFormStatus } from "react-dom";
import {
  ArrowRight,
  Banknote,
  Check,
  Clock3,
  MessageCircle,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  WifiOff,
  UserPlus,
  X,
} from "lucide-react";
import {
  createSale,
  quickCreateCustomer,
  type SaleActionState,
} from "../actions";
import { SaleSuccessCheck } from "./SaleSuccessCheck";
import { PhoneInput } from "@/components/ui/PhoneInput";
import {
  OFFLINE_SALES_EVENT,
  isNetworkError,
  newSaleRef,
  pendingQuantities,
  queueSale,
} from "@/lib/offline-sales";

type Product = {
  id: string;
  name: string;
  selling_price: number;
  stock_quantity: number;
};

type Customer = {
  id: string;
  name: string;
  phone: string | null;
};

type CartLine = { id: string; quantity: number };
type PaymentMethod = "pago" | "credito";

type FormState = SaleActionState & {
  /** Venda guardada no telemóvel por falta de internet. */
  offline?: { ref: string; total: number; createdAt: string } | null;
};

const initialState: FormState = { error: null, sale: null, offline: null };
const NOTES = [50, 100, 200, 500, 1000];
const LOW_STOCK = 5;

const formatMT = (value: number) =>
  `${Math.round(value).toLocaleString("pt-MZ")} MT`;

const fieldClass =
  "w-full rounded-xl border border-white/[0.12] bg-[#0B1110] px-4 py-3.5 text-base text-[#F5F6F4] outline-none transition placeholder:text-white/35 focus:border-[#22C766]/70 focus:ring-2 focus:ring-[#22C766]/15";

function vibrate(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* sem vibração neste dispositivo */
  }
}

/** Converte "84 123 4567" em "258841234567" para o link do WhatsApp. */
function whatsappNumber(phone: string | null | undefined) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("258")) return digits;
  if (digits.length === 9 && digits.startsWith("8")) return `258${digits}`;
  return digits;
}

function parseAmount(value: string) {
  const n = Number(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export function NewSaleForm({
  products: serverProducts,
  customers,
  soldCount,
  businessName,
  businessId,
}: {
  products: Product[];
  customers: Customer[];
  soldCount: Record<string, number>;
  businessName: string;
  businessId: string;
}) {
  const router = useRouter();

  // Identificador desta venda: evita duplicados se for enviada duas vezes.
  const [clientRef, setClientRef] = useState<string>("");
  useEffect(() => setClientRef(newSaleRef()), []);


  // Unidades em vendas ainda por enviar: descontam do stock mostrado.
  const [pending, setPending] = useState<Map<string, number>>(new Map());
  useEffect(() => {
    const refresh = () => setPending(pendingQuantities(businessId));
    refresh();
    window.addEventListener(OFFLINE_SALES_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(OFFLINE_SALES_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [businessId]);

  const products = useMemo(
    () =>
      serverProducts.map((p) => ({
        ...p,
        stock_quantity: Math.max(0, p.stock_quantity - (pending.get(p.id) ?? 0)),
      })),
    [serverProducts, pending],
  );

  // Dados actuais do carrinho, para guardar a venda se não houver internet.
  const snapshot = useRef<{
    lines: { id: string; name: string; selling_price: number; quantity: number }[];
    total: number;
    customerName: string | null;
  }>({ lines: [], total: 0, customerName: null });

  const [state, action] = useFormState(async (previous: FormState, formData: FormData): Promise<FormState> => {
    const saveOffline = (): FormState => {
      const ref = String(formData.get("client_ref") || newSaleRef());
      const method = String(formData.get("payment_method")) === "credito" ? "credito" : "pago";
      const now = new Date().toISOString();
      const snap = snapshot.current;
      queueSale({
        ref,
        businessId,
        soldAt: now,
        paymentMethod: method,
        customerId: method === "credito" ? String(formData.get("customer_id") || "") || null : null,
        customerName: method === "credito" ? snap.customerName : null,
        items: snap.lines.map((l) => ({
          product_id: l.id,
          quantity: l.quantity,
          name: l.name,
          unit_price: l.selling_price,
        })),
        total: snap.total,
        status: "pending",
      });
      return { error: null, sale: null, offline: { ref, total: snap.total, createdAt: now } };
    };

    if (typeof navigator !== "undefined" && navigator.onLine === false) return saveOffline();
    try {
      const result = await createSale(previous, formData);
      return { ...result, offline: null };
    } catch (error) {
      if (isNetworkError(error)) return saveOffline();
      return { error: "Algo correu mal. Tente de novo.", sale: null, offline: null };
    }
  }, initialState);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pago");
  const [received, setReceived] = useState("");
  const [stockNote, setStockNote] = useState<string | null>(null);
  const [dismissedSaleId, setDismissedSaleId] = useState<string | null>(null);

  // Cliente (vendas a crédito)
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(customers);
  const [customerId, setCustomerId] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCustomerError, setNewCustomerError] = useState<string | null>(null);
  const [savingCustomer, startSavingCustomer] = useTransition();

  useEffect(() => setLocalCustomers((current) => {
    const ids = new Set(customers.map((c) => c.id));
    return [...customers, ...current.filter((c) => !ids.has(c.id))];
  }), [customers]);

  const productsById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const quantityOf = (id: string) => cart.find((l) => l.id === id)?.quantity ?? 0;

  const sortedProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return products
      .filter((p) => !normalized || p.name.toLocaleLowerCase().includes(normalized))
      .sort((a, b) => {
        const aOut = a.stock_quantity < 1 ? 1 : 0;
        const bOut = b.stock_quantity < 1 ? 1 : 0;
        if (aOut !== bOut) return aOut - bOut;
        const sold = (soldCount[b.id] ?? 0) - (soldCount[a.id] ?? 0);
        if (sold !== 0) return sold;
        return a.name.localeCompare(b.name, "pt");
      });
  }, [products, query, soldCount]);

  const lines = cart
    .map((line) => {
      const product = productsById.get(line.id);
      return product ? { ...product, quantity: line.quantity } : null;
    })
    .filter((l): l is Product & { quantity: number } => l !== null);

  const total = lines.reduce((sum, l) => sum + l.selling_price * l.quantity, 0);
  const totalUnits = lines.reduce((sum, l) => sum + l.quantity, 0);

  const receivedValue = parseAmount(received);
  const hasReceived = received.trim() !== "" && !Number.isNaN(receivedValue);
  const change = hasReceived ? receivedValue - total : 0;

  const noteSuggestions = useMemo(() => {
    if (total <= 0) return [];
    const values = new Set<number>();
    for (const note of NOTES) {
      const v = Math.ceil(total / note) * note;
      if (v > total) values.add(v);
    }
    return Array.from(values).sort((a, b) => a - b).slice(0, 3);
  }, [total]);

  const selectedCustomer = localCustomers.find((c) => c.id === customerId) ?? null;
  snapshot.current = { lines, total, customerName: selectedCustomer?.name ?? null };

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLocaleLowerCase();
    return localCustomers
      .filter(
        (c) =>
          !q ||
          c.name.toLocaleLowerCase().includes(q) ||
          (c.phone ?? "").replace(/\s/g, "").includes(q.replace(/\s/g, "")),
      )
      .slice(0, 8);
  }, [localCustomers, customerQuery]);

  const canSubmit =
    lines.length > 0 && (paymentMethod === "pago" || Boolean(customerId));

  const completedSale =
    state.sale && state.sale.id !== dismissedSaleId
      ? { ...state.sale, offline: false }
      : state.offline && state.offline.ref !== dismissedSaleId
        ? { id: state.offline.ref, total: state.offline.total, createdAt: state.offline.createdAt, offline: true }
        : null;

  // Ao concluir a venda: fecha a janela e dá feedback.
  useEffect(() => {
    if (state.sale || state.offline) {
      setCheckoutOpen(false);
      vibrate(30);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state.sale, state.offline]);

  // Bloqueia o scroll da página por trás da janela de pagamento.
  useEffect(() => {
    if (!checkoutOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCheckoutOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [checkoutOpen]);

  useEffect(() => {
    if (!stockNote) return;
    const t = setTimeout(() => setStockNote(null), 2200);
    return () => clearTimeout(t);
  }, [stockNote]);

  function addProduct(product: Product) {
    if (product.stock_quantity < 1) {
      setStockNote(`${product.name} está esgotado.`);
      return;
    }
    const current = quantityOf(product.id);
    if (current >= product.stock_quantity) {
      setStockNote(`Só há ${product.stock_quantity} de ${product.name} em stock.`);
      return;
    }
    vibrate();
    setCart((c) =>
      current === 0
        ? [...c, { id: product.id, quantity: 1 }]
        : c.map((l) => (l.id === product.id ? { ...l, quantity: l.quantity + 1 } : l)),
    );
  }

  function setQuantity(id: string, quantity: number) {
    const product = productsById.get(id);
    if (!product) return;
    const safe = Math.max(0, Math.min(Math.floor(quantity), product.stock_quantity));
    if (quantity > product.stock_quantity) {
      setStockNote(`Só há ${product.stock_quantity} de ${product.name} em stock.`);
    }
    setCart((c) =>
      safe === 0
        ? c.filter((l) => l.id !== id)
        : c.map((l) => (l.id === id ? { ...l, quantity: safe } : l)),
    );
  }

  function saveNewCustomer() {
    setNewCustomerError(null);
    startSavingCustomer(async () => {
      const result = await quickCreateCustomer(newName, newPhone);
      if (result.error || !result.customer) {
        setNewCustomerError(result.error ?? "Não foi possível criar o cliente.");
        return;
      }
      const created = result.customer;
      setLocalCustomers((c) => [created, ...c]);
      setCustomerId(created.id);
      setNewCustomerOpen(false);
      setNewName("");
      setNewPhone("");
      setCustomerQuery("");
    });
  }

  function startNewSale() {
    if (state.sale) setDismissedSaleId(state.sale.id);
    else if (state.offline) setDismissedSaleId(state.offline.ref);
    setClientRef(newSaleRef());
    setCart([]);
    setQuery("");
    setPaymentMethod("pago");
    setReceived("");
    setCustomerId("");
    setCustomerQuery("");
    router.refresh();
    window.scrollTo({ top: 0 });
  }

  /* ---------------------------------------------------------------- */
  /* Venda concluída                                                  */
  /* ---------------------------------------------------------------- */
  if (completedSale) {
    const date = new Date(completedSale.createdAt);
    const receiptTotal = completedSale.total || total;
    const receiptLines = [
      `*${businessName}*`,
      `Recibo de venda · ${date.toLocaleDateString("pt-MZ")} ${date.toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" })}`,
      "",
      ...lines.map((l) => `${l.quantity} × ${l.name} — ${formatMT(l.selling_price * l.quantity)}`),
      "",
      `*Total: ${formatMT(receiptTotal)}*`,
      paymentMethod === "credito"
        ? `Pagamento: a crédito (em dívida)`
        : `Pagamento: pago${hasReceived && change >= 0 ? ` · Recebido ${formatMT(receivedValue)} · Troco ${formatMT(change)}` : ""}`,
      "",
      "Obrigado pela preferência!",
    ];
    const phone = paymentMethod === "credito" ? whatsappNumber(selectedCustomer?.phone) : "";
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(receiptLines.join("\n"))}`;

    return (
      <section className="mx-auto max-w-md space-y-4 text-center text-[#F5F6F4]">
        <div className="rounded-3xl border border-[#22C766]/25 bg-[#101816] px-5 py-8">
          {completedSale.offline ? (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F5B754]/15 text-[#F5C879]">
              <WifiOff className="h-9 w-9" aria-hidden />
            </div>
          ) : (
            <SaleSuccessCheck />
          )}
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            {completedSale.offline ? "Venda guardada no telemóvel" : "Venda registada"}
          </h2>
          <p className="mt-1 text-sm text-white/55">
            {completedSale.offline
              ? "Está sem internet. A venda é enviada sozinha quando a rede voltar — não precisa de fazer nada."
              : paymentMethod === "credito"
                ? `Dívida criada para ${selectedCustomer?.name ?? "o cliente"}.`
                : "O stock já foi actualizado."}
          </p>
          <p className="mt-5 text-4xl font-bold tabular-nums text-[#78E6A0]">
            {formatMT(receiptTotal)}
          </p>
          {paymentMethod === "pago" && hasReceived && change > 0 && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-base">
              Troco a dar: <strong className="tabular-nums">{formatMT(change)}</strong>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={startNewSale}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#22C766] px-5 py-4 text-lg font-semibold text-[#06120C] transition active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" aria-hidden />
          Nova venda
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.04] px-5 py-4 text-base font-semibold text-[#F5F6F4] transition hover:bg-white/[0.07] active:scale-[0.98]"
        >
          <MessageCircle className="h-5 w-5 text-[#25D366]" aria-hidden />
          Enviar recibo por WhatsApp
        </a>

        <Link
          href="/dashboard/vendas"
          className="block py-2 text-sm font-medium text-white/55 hover:text-white"
        >
          Ver todas as vendas
        </Link>
      </section>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Escolher produtos + confirmar                                    */
  /* ---------------------------------------------------------------- */
  return (
    <form
      id="sale-form"
      action={action}
      className="text-[#F5F6F4]"
      onKeyDown={(e) => {
        // "Enter" num campo não deve concluir a venda sem querer.
        if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault();
      }}
    >
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(lines.map((l) => ({ product_id: l.id, quantity: l.quantity })))}
      />
      <input type="hidden" name="payment_method" value={paymentMethod} />
      <input type="hidden" name="client_ref" value={clientRef} />
      {paymentMethod === "credito" && <input type="hidden" name="customer_id" value={customerId} />}


      {/* Pesquisa */}
      {products.length > 6 && (
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" aria-hidden />
          <label htmlFor="product-search" className="sr-only">Pesquisar produto</label>
          <input
            id="product-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Procurar produto..."
            className={`${fieldClass} pl-12`}
          />
        </div>
      )}

      {/* Produtos */}
      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.14] px-5 py-10 text-center">
          <p className="text-base font-medium">Ainda não tem produtos.</p>
          <p className="mt-1 text-sm text-white/50">Adicione um produto para poder vender.</p>
          <Link
            href="/dashboard/produtos/novo"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#22C766] px-5 py-3 font-semibold text-[#06120C]"
          >
            <Plus className="h-4 w-4" aria-hidden /> Adicionar produto
          </Link>
        </div>
      ) : sortedProducts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/[0.14] px-5 py-8 text-center text-white/60">
          Nenhum produto com esse nome.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sortedProducts.map((product) => {
            const qty = quantityOf(product.id);
            const out = product.stock_quantity < 1;
            const low = !out && product.stock_quantity <= LOW_STOCK;

            return (
              <li key={product.id} className="relative">
                <button
                  type="button"
                  onClick={() => addProduct(product)}
                  aria-label={`Adicionar ${product.name}, ${formatMT(product.selling_price)}`}
                  className={`flex h-full min-h-[118px] w-full flex-col rounded-2xl border p-3.5 text-left transition active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C766]/60 ${
                    qty > 0
                      ? "border-[#22C766]/70 bg-[#22C766]/[0.10]"
                      : out
                        ? "border-white/[0.06] bg-white/[0.015] opacity-50"
                        : "border-white/[0.09] bg-white/[0.035] hover:border-white/[0.2]"
                  }`}
                >
                  <span className="line-clamp-2 pr-8 text-[15px] font-semibold leading-snug">
                    {product.name}
                  </span>
                  <span className="mt-auto pt-2 text-lg font-bold tabular-nums text-[#78E6A0]">
                    {formatMT(product.selling_price)}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      out ? "text-[#F58C83]" : low ? "text-[#F5C879]" : "text-white/45"
                    }`}
                  >
                    {out ? "Esgotado" : low ? `Só restam ${product.stock_quantity}` : `${product.stock_quantity} em stock`}
                  </span>
                </button>

                {qty > 0 && (
                  <>
                    <span className="pointer-events-none absolute right-2.5 top-2.5 flex h-8 min-w-8 items-center justify-center rounded-full bg-[#22C766] px-2 text-sm font-bold tabular-nums text-[#06120C]">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(product.id, qty - 1)}
                      aria-label={`Tirar um ${product.name}`}
                      className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0B1110] text-white/80 active:scale-95"
                    >
                      {qty === 1 ? <Trash2 className="h-4 w-4" aria-hidden /> : <Minus className="h-4 w-4" aria-hidden />}
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Barra fixa: total + continuar */}
      <div className="sticky bottom-[calc(5.9rem+env(safe-area-inset-bottom))] z-30 mt-5 md:bottom-4">
        {stockNote && (
          <p role="status" className="mb-2 rounded-xl border border-[#F5B754]/30 bg-[#2A2213] px-4 py-2.5 text-center text-sm text-[#F5C879] shadow-lg">
            {stockNote}
          </p>
        )}
        {lines.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#101816]/95 px-4 py-4 text-center text-sm text-white/50 shadow-2xl backdrop-blur">
            Toque num produto para começar a venda
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCheckoutOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl bg-[#22C766] px-4 py-3.5 text-left text-[#06120C] shadow-[0_12px_40px_rgba(34,199,102,0.35)] transition active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/15">
              <ShoppingCart className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold opacity-75">
                {totalUnits} {totalUnits === 1 ? "item" : "itens"}
              </span>
              <span className="block text-xl font-bold tabular-nums">{formatMT(total)}</span>
            </span>
            <span className="flex items-center gap-1 text-base font-bold">
              Continuar <ArrowRight className="h-5 w-5" aria-hidden />
            </span>
          </button>
        )}
      </div>

      {/* Janela de confirmação — aberta num "portal" no <body>, para ficar
          sempre por cima da barra de navegação do telemóvel. */}
      {checkoutOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center text-[#F5F6F4] md:items-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setCheckoutOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />

          <div className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/[0.1] bg-[#101816] shadow-2xl md:max-w-lg md:rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <h2 id="checkout-title" className="text-lg font-semibold">Confirmar venda</h2>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white/70"
                aria-label="Voltar aos produtos"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              {/* 1. Produtos */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/45">Produtos</h3>
                <ul className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08]">
                  {lines.map((line) => (
                    <li key={line.id} className="flex items-center gap-3 px-3.5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-medium">{line.name}</p>
                        <p className="text-sm tabular-nums text-white/50">
                          {formatMT(line.selling_price)} × {line.quantity} ={" "}
                          <span className="font-semibold text-[#78E6A0]">{formatMT(line.selling_price * line.quantity)}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.id, line.quantity - 1)}
                          aria-label={`Tirar um ${line.name}`}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] active:scale-95"
                        >
                          {line.quantity === 1 ? <Trash2 className="h-4 w-4" aria-hidden /> : <Minus className="h-4 w-4" aria-hidden />}
                        </button>
                        <QuantityInput
                          value={line.quantity}
                          label={`Quantidade de ${line.name}`}
                          onCommit={(n) => setQuantity(line.id, n)}
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity(line.id, line.quantity + 1)}
                          disabled={line.quantity >= line.stock_quantity}
                          aria-label={`Mais um ${line.name}`}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] active:scale-95 disabled:opacity-30"
                        >
                          <Plus className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  className="mt-2 flex items-center gap-1.5 px-1 text-sm font-medium text-[#78E6A0]"
                >
                  <Plus className="h-4 w-4" aria-hidden /> Adicionar mais produtos
                </button>
              </section>

              {/* 2. Pagamento */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/45">Como vai pagar?</h3>
                <div className="grid grid-cols-2 gap-3">
                  <PaymentOption
                    active={paymentMethod === "pago"}
                    onClick={() => setPaymentMethod("pago")}
                    icon={<Banknote className="h-6 w-6" aria-hidden />}
                    title="Pagou agora"
                    tone="green"
                  />
                  <PaymentOption
                    active={paymentMethod === "credito"}
                    onClick={() => setPaymentMethod("credito")}
                    icon={<Clock3 className="h-6 w-6" aria-hidden />}
                    title="Fica a dever"
                    tone="amber"
                  />
                </div>
              </section>

              {/* 3a. Troco */}
              {paymentMethod === "pago" && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                    Quanto recebeu? <span className="normal-case tracking-normal text-white/30">(opcional, para calcular o troco)</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setReceived(String(total))}
                      className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold ${hasReceived && receivedValue === total ? "bg-[#22C766] text-[#06120C]" : "bg-white/[0.06] text-white/80"}`}
                    >
                      Valor certo
                    </button>
                    {noteSuggestions.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setReceived(String(v))}
                        className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold tabular-nums ${hasReceived && receivedValue === v ? "bg-[#22C766] text-[#06120C]" : "bg-white/[0.06] text-white/80"}`}
                      >
                        {formatMT(v)}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={received}
                    onChange={(e) => setReceived(e.target.value)}
                    placeholder="Outro valor (MT)"
                    aria-label="Valor recebido em meticais"
                    className={`${fieldClass} mt-2`}
                  />
                  {hasReceived && (
                    <p
                      className={`mt-2 rounded-xl px-4 py-3 text-base font-semibold ${
                        change < 0 ? "bg-[#F2685C]/10 text-[#FF9A90]" : "bg-[#22C766]/10 text-[#78E6A0]"
                      }`}
                    >
                      {change < 0
                        ? `Faltam ${formatMT(-change)}`
                        : change === 0
                          ? "Sem troco"
                          : `Troco a dar: ${formatMT(change)}`}
                    </p>
                  )}
                </section>
              )}

              {/* 3b. Cliente para crédito */}
              {paymentMethod === "credito" && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/45">Quem fica a dever?</h3>

                  {selectedCustomer ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-[#F5B754]/40 bg-[#F5B754]/[0.08] px-4 py-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5B754]/20 text-sm font-bold text-[#F5C879]">
                        {selectedCustomer.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{selectedCustomer.name}</p>
                        {selectedCustomer.phone && <p className="text-sm text-white/50">{selectedCustomer.phone}</p>}
                      </div>
                      <button type="button" onClick={() => setCustomerId("")} className="text-sm font-medium text-[#F5C879]">
                        Trocar
                      </button>
                    </div>
                  ) : newCustomerOpen ? (
                    <div className="space-y-2 rounded-2xl border border-white/[0.1] p-3.5">
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Nome do cliente"
                        aria-label="Nome do cliente"
                        className={fieldClass}
                        autoFocus
                      />
                      <PhoneInput
                        name="new_customer_phone"
                        value={newPhone}
                        onChange={setNewPhone}
                        placeholder="Telefone (opcional) · 84 123 4567"
                        aria-label="Telefone do cliente"
                        className={fieldClass}
                      />
                      {newCustomerError && <p className="text-sm text-[#FF9A90]">{newCustomerError}</p>}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setNewCustomerOpen(false)}
                          className="flex-1 rounded-xl bg-white/[0.06] py-3 font-medium text-white/80"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={saveNewCustomer}
                          disabled={savingCustomer || !newName.trim()}
                          className="flex-1 rounded-xl bg-[#F5B754] py-3 font-semibold text-[#1A1206] disabled:opacity-50"
                        >
                          {savingCustomer ? "A guardar…" : "Guardar cliente"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {localCustomers.length > 5 && (
                        <input
                          type="search"
                          value={customerQuery}
                          onChange={(e) => setCustomerQuery(e.target.value)}
                          placeholder="Procurar por nome ou telefone..."
                          aria-label="Procurar cliente"
                          className={fieldClass}
                        />
                      )}
                      <ul className="space-y-2">
                        {filteredCustomers.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => setCustomerId(c.id)}
                              className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left hover:border-white/[0.2]"
                            >
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-sm font-bold text-white/70">
                                {c.name.slice(0, 2).toUpperCase()}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{c.name}</span>
                                {c.phone && <span className="block text-sm text-white/45">{c.phone}</span>}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => {
                          setNewCustomerOpen(true);
                          setNewName(customerQuery);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#F5B754]/40 py-3.5 font-medium text-[#F5C879]"
                      >
                        <UserPlus className="h-5 w-5" aria-hidden /> Novo cliente
                      </button>
                    </div>
                  )}
                </section>
              )}

              {state.error && (
                <p role="alert" className="rounded-xl border border-[#F2685C]/25 bg-[#F2685C]/[0.08] p-4 text-sm leading-relaxed text-[#FF9A90]">
                  {state.error}
                </p>
              )}
            </div>

            <div className="border-t border-white/[0.08] bg-[#0B1110] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
              <ConfirmButton
                disabled={!canSubmit}
                label={
                  paymentMethod === "credito" && !customerId
                    ? "Escolha quem fica a dever"
                    : `Concluir venda · ${formatMT(total)}`
                }
              />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </form>
  );
}

function ConfirmButton({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      form="sale-form"
      disabled={disabled || pending}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#22C766] px-5 py-4 text-lg font-bold text-[#06120C] transition active:scale-[0.98] disabled:bg-white/[0.08] disabled:text-white/40"
    >
      {pending ? "A registar a venda…" : (
        <>
          <Check className="h-5 w-5" strokeWidth={3} aria-hidden /> {label}
        </>
      )}
    </button>
  );
}

function PaymentOption({
  active,
  onClick,
  icon,
  title,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  tone: "green" | "amber";
}) {
  const activeClass =
    tone === "green"
      ? "border-[#22C766] bg-[#22C766]/[0.12] text-[#78E6A0]"
      : "border-[#F5B754] bg-[#F5B754]/[0.10] text-[#F5C879]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-base font-semibold transition active:scale-[0.97] ${
        active ? activeClass : "border-white/[0.08] bg-white/[0.03] text-white/70"
      }`}
    >
      {icon}
      {title}
    </button>
  );
}

function QuantityInput({
  value,
  label,
  onCommit,
}: {
  value: number;
  label: string;
  onCommit: (n: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  function commit() {
    const n = parseInt(draft, 10);
    if (Number.isNaN(n)) setDraft(String(value));
    else onCommit(n);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      value={draft}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
          (e.target as HTMLInputElement).blur();
        }
      }}
      onFocus={(e) => e.target.select()}
      className="h-10 w-12 rounded-xl bg-[#0B1110] text-center text-base font-bold tabular-nums text-white outline-none ring-1 ring-white/10 focus:ring-[#22C766]/60"
    />
  );
}
