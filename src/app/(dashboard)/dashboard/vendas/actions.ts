"use server";

import { revalidatePath } from "next/cache";
import { getBusinessContext } from "@/lib/supabase/business";
import { createClient } from "@/lib/supabase/server";
import { checkMzPhone } from "@/lib/phone";

export type CompletedSale = {
  id: string;
  total: number;
  createdAt: string;
};

export type SaleActionState = {
  error: string | null;
  sale?: CompletedSale | null;
};

type SaleInputItem = { product_id: string; quantity: number };

export async function createSale(
  _previousState: SaleActionState,
  formData: FormData
): Promise<SaleActionState> {
  const { businessId } = await getBusinessContext();
  const paymentMethod = String(formData.get("payment_method") ?? "");
  const customerId = String(formData.get("customer_id") ?? "").trim() || null;
  const rawItems = String(formData.get("items") ?? "");

  if (paymentMethod !== "pago" && paymentMethod !== "credito") {
    return { error: "Escolha como o cliente vai pagar." };
  }
  if (paymentMethod === "credito" && !customerId) {
    return { error: "Para vender a crédito, escolha o cliente." };
  }

  let items: SaleInputItem[];
  try {
    const parsed: unknown = JSON.parse(rawItems);
    if (!Array.isArray(parsed)) throw new Error("not an array");
    items = parsed.map((item) => {
      const value = typeof item === "object" && item !== null
        ? item as { product_id?: unknown; quantity?: unknown }
        : {};
      return {
        product_id: typeof value.product_id === "string" ? value.product_id : "",
        quantity: Number(value.quantity),
      };
    });
  } catch {
    return { error: "O carrinho é inválido. Adicione os produtos novamente." };
  }

  if (!items.length || items.some((item) => !item.product_id || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
    return { error: "Adicione pelo menos um produto." };
  }

  const clientRef = String(formData.get("client_ref") ?? "").trim() || null;
  const result = await registerSale({ businessId, paymentMethod, customerId, items, clientRef, soldAt: null });

  if (result.error !== null) {
    return { error: result.error };
  }

  const data = result.data;

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/vendas");
  revalidatePath("/dashboard/vendas/nova");
  revalidatePath("/dashboard/produtos");
  revalidatePath("/dashboard/clientes");
  revalidatePath("/dashboard/dividas");

  const row = data as unknown as { id: string; total_amount: number | string; created_at: string } | null;

  return {
    error: null,
    sale: row
      ? { id: row.id, total: Number(row.total_amount), createdAt: row.created_at }
      : { id: crypto.randomUUID(), total: 0, createdAt: new Date().toISOString() },
  };
}

type RegisterInput = {
  businessId: string;
  paymentMethod: string;
  customerId: string | null;
  items: SaleInputItem[];
  clientRef: string | null;
  soldAt: string | null;
};

type RegisterResult =
  | { error: null; data: unknown }
  | { error: string; retry: boolean };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Regista a venda. Com identificador (client_ref) usa a função sem duplicados
 * (migração 0020). Se essa função ainda não existir na base de dados, usa a
 * create_sale normal, para a app nunca deixar de vender.
 */
async function registerSale(input: RegisterInput): Promise<RegisterResult> {
  const supabase = createClient();
  const ref = input.clientRef && UUID_RE.test(input.clientRef) ? input.clientRef : null;

  let response = ref
    ? await supabase.rpc("create_sale_idempotent", {
        p_business_id: input.businessId,
        p_payment_method: input.paymentMethod,
        p_customer_id: input.customerId as string,
        p_items: input.items,
        p_client_ref: ref,
        ...(input.soldAt ? { p_sold_at: input.soldAt } : {}),
      })
    : null;

  const missingFunction =
    response?.error &&
    (response.error.code === "PGRST202" || response.error.message.includes("create_sale_idempotent"));

  if (!response || missingFunction) {
    response = await supabase.rpc("create_sale", {
      p_business_id: input.businessId,
      p_payment_method: input.paymentMethod,
      p_customer_id: input.customerId as string,
      p_items: input.items,
    });
  }

  const { data, error } = response;
  if (!error) return { error: null, data };

  const msg = error.message;
  if (msg.includes("Stock insuficiente") || msg.includes("produto indisponível")) {
    return { error: "Um dos produtos já não tem stock suficiente. Reveja as quantidades.", retry: false };
  }
  if (msg.includes("Cliente não encontrado")) {
    return { error: "O cliente desta venda já não existe.", retry: false };
  }
  if (msg.includes("Sem permissão") || msg.toLowerCase().includes("assinatura") || msg.toLowerCase().includes("plano")) {
    return { error: msg, retry: false };
  }
  return { error: "Não foi possível concluir a venda. Verifique a internet e tente novamente.", retry: true };
}

export type OfflineSalePayload = {
  ref: string;
  soldAt: string;
  paymentMethod: "pago" | "credito";
  customerId: string | null;
  items: SaleInputItem[];
};

export type SyncResult = { ok: true; saleId: string | null } | { ok: false; error: string; retry: boolean };

/** Envia para o servidor uma venda que ficou guardada no celular sem internet. */
export async function syncOfflineSale(payload: OfflineSalePayload): Promise<SyncResult> {
  const { businessId } = await getBusinessContext();

  if (payload.paymentMethod !== "pago" && payload.paymentMethod !== "credito") {
    return { ok: false, error: "Forma de pagamento inválida.", retry: false };
  }
  if (payload.paymentMethod === "credito" && !payload.customerId) {
    return { ok: false, error: "Venda a crédito sem cliente.", retry: false };
  }
  const items = (payload.items ?? []).filter(
    (i) => typeof i.product_id === "string" && Number.isInteger(i.quantity) && i.quantity > 0,
  );
  if (!items.length) return { ok: false, error: "A venda não tem produtos.", retry: false };

  const result = await registerSale({
    businessId,
    paymentMethod: payload.paymentMethod,
    customerId: payload.customerId,
    items,
    clientRef: payload.ref,
    soldAt: payload.soldAt,
  });

  if (result.error !== null) return { ok: false, error: result.error, retry: result.retry };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/vendas");
  revalidatePath("/dashboard/produtos");
  revalidatePath("/dashboard/dividas");

  const row = result.data as { id?: string } | null;
  return { ok: true, saleId: row?.id ?? null };
}

export type QuickCustomerResult = {
  error: string | null;
  customer?: { id: string; name: string; phone: string | null };
};

/** Cria um cliente sem sair do ecrã de venda (usado nas vendas a crédito). */
export async function quickCreateCustomer(
  name: string,
  phone: string
): Promise<QuickCustomerResult> {
  const { businessId, userId } = await getBusinessContext();
  const cleanName = name.trim();

  if (!cleanName) {
    return { error: "Escreva o nome do cliente." };
  }

  const phoneCheck = checkMzPhone(phone);
  if (!phoneCheck.ok) {
    return { error: `Telefone inválido: ${phoneCheck.reason}` };
  }
  const cleanPhone = phoneCheck.formatted || null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({ business_id: businessId, name: cleanName, phone: cleanPhone, created_by: userId })
    .select("id, name, phone")
    .single();

  if (error || !data) {
    return { error: "Não foi possível criar o cliente. Tente novamente." };
  }

  revalidatePath("/dashboard/clientes");
  return { error: null, customer: data };
}
