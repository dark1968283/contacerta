"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createSale, type SaleActionState } from "../actions";

type Product = { id: string; name: string; selling_price: number; stock_quantity: number };
type Customer = { id: string; name: string; phone: string | null };
type CartItem = Product & { quantity: number };

const initialState: SaleActionState = { error: null };

export function NewSaleForm({ products, customers }: { products: Product[]; customers: Customer[] }) {
  const [state, action] = useFormState(createSale, initialState);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"pago" | "credito">("pago");
  const [query, setQuery] = useState("");

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return products.filter((product) => !normalized || product.name.toLocaleLowerCase().includes(normalized));
  }, [products, query]);
  const total = cart.reduce((sum: number, item: CartItem) => sum + item.selling_price * item.quantity, 0);

  function addProduct(product: Product) {
    if (product.stock_quantity < 1) return;
    setCart((current: CartItem[]) => {
      const present = current.find((item: CartItem) => item.id === product.id);
      if (!present) return [...current, { ...product, quantity: 1 }];
      if (present.quantity >= product.stock_quantity) return current;
      return current.map((item: CartItem) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
    });
  }

  function setQuantity(id: string, quantity: number) {
    setCart((current: CartItem[]) => current.flatMap((item: CartItem) => {
      if (item.id !== id) return [item];
      if (quantity <= 0) return [];
      return [{ ...item, quantity: Math.min(Math.floor(quantity), item.stock_quantity) }];
    }));
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="items" value={JSON.stringify(cart.map(({ id, quantity }: CartItem) => ({ product_id: id, quantity })))} />

      <section className="space-y-3">
        <label className="block text-sm font-medium text-ink" htmlFor="product-search">Adicionar produtos</label>
        <input id="product-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar produto…" className="input-field" />
        <div className="space-y-2">
          {visibleProducts.map((product: Product) => (
            <button key={product.id} type="button" onClick={() => addProduct(product)} disabled={product.stock_quantity < 1} className="flex w-full items-center justify-between rounded-xl border border-line bg-white p-3 text-left disabled:opacity-40">
              <span><span className="block font-medium text-ink">{product.name}</span><span className="text-sm text-ink/60">{Math.round(product.selling_price).toLocaleString("pt-MZ")} MT · {product.stock_quantity} em stock</span></span>
              <span className="text-lg font-medium text-brand">+</span>
            </button>
          ))}
          {visibleProducts.length === 0 && <p className="py-3 text-center text-sm text-ink/50">Nenhum produto disponível.</p>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Carrinho</h2>
        {cart.length === 0 ? <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink/50">Adicione produtos para iniciar a venda.</p> : <div className="space-y-2">{cart.map((item: CartItem) => (
          <div key={item.id} className="rounded-xl border border-line bg-white p-3">
            <div className="flex items-center justify-between gap-3"><div><p className="font-medium text-ink">{item.name}</p><p className="text-sm text-ink/60">{Math.round(item.selling_price * item.quantity).toLocaleString("pt-MZ")} MT</p></div><input aria-label={`Quantidade de ${item.name}`} type="number" min="1" max={item.stock_quantity} value={item.quantity} onChange={(event) => setQuantity(item.id, Number(event.target.value))} className="w-16 rounded-lg border border-line p-2 text-center" /></div>
          </div>
        ))}</div>}
        <div className="flex justify-between border-t border-line pt-3 font-semibold text-ink"><span>Total</span><span>{Math.round(total).toLocaleString("pt-MZ")} MT</span></div>
      </section>

      <fieldset className="space-y-3"><legend className="text-sm font-semibold uppercase tracking-wide text-ink/50">Pagamento</legend><div className="grid grid-cols-2 gap-2"><label className={`rounded-xl border p-3 text-center ${paymentMethod === "pago" ? "border-brand bg-brand/5 text-brand" : "border-line"}`}><input className="sr-only" type="radio" name="payment_method" value="pago" checked={paymentMethod === "pago"} onChange={() => setPaymentMethod("pago")} />Pago</label><label className={`rounded-xl border p-3 text-center ${paymentMethod === "credito" ? "border-brand bg-brand/5 text-brand" : "border-line"}`}><input className="sr-only" type="radio" name="payment_method" value="credito" checked={paymentMethod === "credito"} onChange={() => setPaymentMethod("credito")} />Crédito</label></div></fieldset>

      {paymentMethod === "credito" && <section className="space-y-2"><label className="block text-sm font-medium text-ink" htmlFor="customer_id">Cliente</label><select id="customer_id" name="customer_id" required className="input-field" defaultValue=""><option value="">Selecione o cliente…</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.phone ? ` — ${customer.phone}` : ""}</option>)}</select>{customers.length === 0 && <p className="text-sm text-alert">Crie um cliente antes de registar uma venda a crédito.</p>}</section>}

      {state.error && <p role="alert" className="rounded-xl bg-alert/10 p-3 text-sm text-alert">{state.error}</p>}
      <SubmitButton>Concluir venda</SubmitButton>
    </form>
  );
}
