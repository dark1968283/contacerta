"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import {
  Search,
  ShoppingBag,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  UserRound,
  Package,
} from "lucide-react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createSale, type SaleActionState } from "../actions";

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

type CartItem = Product & { quantity: number };

const initialState: SaleActionState = { error: null };

const formatMT = (value: number) =>
  `${Math.round(value).toLocaleString("pt-MZ")} MT`;

const fieldClass =
  "w-full rounded-xl border border-white/[0.12] bg-[#0B1110] px-3.5 py-3 text-sm text-[#F5F6F4] outline-none transition placeholder:text-white/35 focus:border-[#22C766]/70 focus:ring-2 focus:ring-[#22C766]/10";

export function NewSaleForm({
  products,
  customers,
}: {
  products: Product[];
  customers: Customer[];
}) {
  const [state, action] = useFormState(createSale, initialState);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"pago" | "credito">("pago");
  const [query, setQuery] = useState("");

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return products.filter(
      (product) =>
        (!normalized ||
          product.name.toLocaleLowerCase().includes(normalized)) &&
        !cart.some((item) => item.id === product.id),
    );
  }, [products, query, cart]);

  const total = cart.reduce(
    (sum, item) => sum + item.selling_price * item.quantity,
    0,
  );

  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addProduct(product: Product) {
    if (product.stock_quantity < 1) return;

    setCart((current) => {
      const present = current.find((item) => item.id === product.id);

      if (!present) return [...current, { ...product, quantity: 1 }];
      if (present.quantity >= product.stock_quantity) return current;

      return current.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    });
  }

  function setQuantity(id: string, quantity: number) {
    setCart((current) =>
      current.flatMap((item) => {
        if (item.id !== id) return [item];
        if (quantity <= 0) return [];

        return [
          {
            ...item,
            quantity: Math.min(
              Math.floor(quantity),
              item.stock_quantity,
            ),
          },
        ];
      }),
    );
  }

  return (
    <form action={action} className="space-y-5 text-[#F5F6F4] sm:space-y-6">
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          cart.map(({ id, quantity }) => ({
            product_id: id,
            quantity,
          })),
        )}
      />

      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101816]">
        <div className="border-b border-white/[0.08] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#22C766]/20 bg-[#22C766]/10 text-[#78E6A0]">
              <Package className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[#F5F6F4]">
                Adicionar produtos
              </h2>
              <p className="mt-0.5 text-xs text-white/50 sm:text-sm">
                Escolha os produtos para esta venda.
              </p>
            </div>
          </div>

          <label htmlFor="product-search" className="sr-only">
            Pesquisar produtos
          </label>
          <div className="relative mt-4">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
              aria-hidden
            />
            <input
              id="product-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar por nome do produto..."
              className={`${fieldClass} pl-10`}
            />
          </div>
        </div>

        <div className="space-y-2 p-3 sm:p-4">
          {visibleProducts.map((product) => {
            const outOfStock = product.stock_quantity < 1;

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => addProduct(product)}
                disabled={outOfStock}
                className="group flex w-full min-w-0 items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:border-[#22C766]/35 hover:bg-[#22C766]/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C766]/60 disabled:cursor-not-allowed disabled:opacity-45 sm:p-3.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-[#182722] text-white/65 transition group-hover:border-[#22C766]/20 group-hover:text-[#78E6A0]">
                  <ShoppingBag className="h-4 w-4" aria-hidden />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-medium text-[#F5F6F4]">
                    {product.name}
                  </span>
                  <span className="mt-1 block text-xs text-white/55">
                    {outOfStock
                      ? "Sem stock disponível"
                      : `${product.stock_quantity} unidade(s) em stock`}
                  </span>
                </span>

                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold tabular-nums text-[#78E6A0]">
                    {formatMT(product.selling_price)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-white/45 transition group-hover:text-[#78E6A0]">
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Adicionar
                  </span>
                </span>
              </button>
            );
          })}

          {visibleProducts.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/[0.12] px-4 py-8 text-center">
              <Search className="mx-auto h-5 w-5 text-white/30" aria-hidden />
              <p className="mt-2 text-sm font-medium text-white/75">
                {products.length === 0
                  ? "Ainda não existem produtos activos."
                  : query.trim()
                    ? "Nenhum produto encontrado."
                    : "Todos os produtos disponíveis já foram adicionados."}
              </p>
              <p className="mt-1 text-xs text-white/40">
                {query.trim()
                  ? "Experimente pesquisar por outro nome."
                  : "Verifique os produtos e o stock da loja."}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101816]">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-white/70">
              <ShoppingCart className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#F5F6F4]">
                Carrinho
              </h2>
              <p className="mt-0.5 text-xs text-white/50">
                {totalUnits} {totalUnits === 1 ? "unidade" : "unidades"} na venda
              </p>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setCart([])}
              className="rounded-lg px-2.5 py-2 text-xs font-medium text-white/50 transition hover:bg-[#F2685C]/10 hover:text-[#F58C83] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2685C]/50"
            >
              Limpar
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="px-4 py-8 text-center sm:py-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025] text-white/35">
              <ShoppingCart className="h-5 w-5" aria-hidden />
            </div>
            <p className="mt-3 text-sm font-medium text-white/75">
              O carrinho está vazio
            </p>
            <p className="mt-1 text-xs text-white/45">
              Adicione produtos para iniciar a venda.
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-3 sm:p-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0B1110]/60 p-3 sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium text-[#F5F6F4]">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    {formatMT(item.selling_price)} por unidade
                  </p>
                  <p className="mt-1.5 text-sm font-semibold tabular-nums text-[#78E6A0]">
                    {formatMT(item.selling_price * item.quantity)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/[0.1] bg-[#101816] p-1">
                  <button
                    type="button"
                    aria-label={`Diminuir quantidade de ${item.name}`}
                    onClick={() => setQuantity(item.id, item.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/65 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C766]/50"
                  >
                    {item.quantity === 1 ? (
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Minus className="h-3.5 w-3.5" aria-hidden />
                    )}
                  </button>
                  <span className="w-7 text-center text-sm font-semibold tabular-nums text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Aumentar quantidade de ${item.name}`}
                    disabled={item.quantity >= item.stock_quantity}
                    onClick={() => setQuantity(item.id, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/65 transition hover:bg-[#22C766]/10 hover:text-[#78E6A0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C766]/50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-white/[0.08] bg-[#0B1110]/55 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/45">
                Total da venda
              </p>
              <p className="mt-1 text-xs text-white/35">
                {cart.length} {cart.length === 1 ? "produto" : "produtos"} diferentes
              </p>
            </div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-[#78E6A0] sm:text-3xl">
              {formatMT(total)}
            </p>
          </div>
        </div>
      </section>

      <fieldset className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101816]">
        <div className="border-b border-white/[0.08] p-4 sm:p-5">
          <legend className="text-base font-semibold text-[#F5F6F4]">
            Forma de pagamento
          </legend>
          <p className="mt-1 text-xs text-white/50 sm:text-sm">
            Indique como esta venda será paga.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4">
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition sm:p-4 ${
              paymentMethod === "pago"
                ? "border-[#22C766]/50 bg-[#22C766]/[0.08] ring-1 ring-[#22C766]/15"
                : "border-white/[0.09] bg-white/[0.02] hover:border-white/[0.18]"
            }`}
          >
            <input
              className="sr-only"
              type="radio"
              name="payment_method"
              value="pago"
              checked={paymentMethod === "pago"}
              onChange={() => setPaymentMethod("pago")}
            />
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                paymentMethod === "pago"
                  ? "bg-[#22C766]/15 text-[#78E6A0]"
                  : "bg-white/[0.05] text-white/55"
              }`}
            >
              <Banknote className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[#F5F6F4]">
                Pago
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-white/50">
                O cliente paga agora.
              </span>
            </span>
            <span
              className={`h-4 w-4 shrink-0 rounded-full border ${
                paymentMethod === "pago"
                  ? "border-[#22C766] bg-[#22C766] shadow-[inset_0_0_0_3px_#101816]"
                  : "border-white/25"
              }`}
            />
          </label>

          <label
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition sm:p-4 ${
              paymentMethod === "credito"
                ? "border-[#F5B754]/50 bg-[#F5B754]/[0.07] ring-1 ring-[#F5B754]/10"
                : "border-white/[0.09] bg-white/[0.02] hover:border-white/[0.18]"
            }`}
          >
            <input
              className="sr-only"
              type="radio"
              name="payment_method"
              value="credito"
              checked={paymentMethod === "credito"}
              onChange={() => setPaymentMethod("credito")}
            />
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                paymentMethod === "credito"
                  ? "bg-[#F5B754]/10 text-[#F5C879]"
                  : "bg-white/[0.05] text-white/55"
              }`}
            >
              <CreditCard className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[#F5F6F4]">
                A crédito
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-white/50">
                O cliente paga mais tarde.
              </span>
            </span>
            <span
              className={`h-4 w-4 shrink-0 rounded-full border ${
                paymentMethod === "credito"
                  ? "border-[#F5B754] bg-[#F5B754] shadow-[inset_0_0_0_3px_#101816]"
                  : "border-white/25"
              }`}
            />
          </label>
        </div>
      </fieldset>

      {paymentMethod === "credito" && (
        <section className="rounded-2xl border border-[#F5B754]/20 bg-[#101816] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5B754]/10 text-[#F5C879]">
              <UserRound className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#F5F6F4]">
                Cliente responsável
              </h2>
              <p className="mt-0.5 text-xs text-white/50">
                Associe a dívida ao cliente correcto.
              </p>
            </div>
          </div>

          <label
            className="mb-2 block text-sm font-medium text-white/80"
            htmlFor="customer_id"
          >
            Seleccionar cliente
          </label>
          <select
            id="customer_id"
            name="customer_id"
            required
            className={fieldClass}
            defaultValue=""
          >
            <option value="" className="bg-[#101816] text-white">
              Seleccione o cliente...
            </option>
            {customers.map((customer) => (
              <option
                key={customer.id}
                value={customer.id}
                className="bg-[#101816] text-white"
              >
                {customer.name}
                {customer.phone ? ` — ${customer.phone}` : ""}
              </option>
            ))}
          </select>

          {customers.length === 0 && (
            <p className="mt-3 rounded-xl border border-[#F5B754]/20 bg-[#F5B754]/[0.06] p-3 text-sm leading-relaxed text-[#F5C879]">
              Crie um cliente antes de registar uma venda a crédito.
            </p>
          )}
        </section>
      )}

      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-[#F2685C]/25 bg-[#F2685C]/[0.08] p-4 text-sm leading-relaxed text-[#FF9A90]"
        >
          {state.error}
        </p>
      )}

      <div className="rounded-2xl border border-white/[0.08] bg-[#101816] p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <span className="text-sm text-white/55">Total a registar</span>
          <span className="text-lg font-semibold tabular-nums text-[#F5F6F4]">
            {formatMT(total)}
          </span>
        </div>
        <SubmitButton>Concluir venda</SubmitButton>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-white/40">
          Confirme os produtos e o total antes de concluir.
        </p>
      </div>
    </form>
  );
}
