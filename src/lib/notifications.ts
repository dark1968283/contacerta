import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { formatMT } from "@/lib/format";
import { whatsappLink } from "@/lib/receipt";
import type { NoticeItem } from "@/app/(dashboard)/dashboard/notificacoes/NotificationCenter";


function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

/**
 * Avisos do negócio (stock, assinatura, pagamentos). Usado pela página de
 * Notificações e pelo sino da barra superior, para o número estar sempre certo.
 * Envolvido em cache() para correr uma só vez por pedido.
 */
export const loadNotices = cache(async () => {
  const { businessId } = await getBusinessContext();
  const supabase = createClient();
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    { data: products, error: productsError },
    { data: subscriptions, error: subscriptionsError },
    { data: payments, error: paymentsError },
    { data: openDebts, error: debtsError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,stock_quantity,low_stock_threshold,cost_price")
      .eq("business_id", businessId)
      .eq("is_active", true),
    supabase
      .from("subscriptions")
      .select("id,status,billing_cycle,current_period_end,plans(name)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("subscription_payments")
      .select("id,status,reference,amount,created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("debts")
      .select("id,total_amount,amount_paid,status,created_at,due_date,customers(name,phone)")
      .eq("business_id", businessId)
      .in("status", ["pendente", "parcial", "vencida"])
      .order("created_at", { ascending: true })
      .limit(50),
  ]);

  // Stock: o id inclui o nível ("baixo"/"esgotado"), para o aviso voltar se piorar.
  const stock: NoticeItem[] = (products ?? [])
    .filter(
      (product) =>
        product.stock_quantity === 0 ||
        (product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold),
    )
    .sort((a, b) => a.stock_quantity - b.stock_quantity)
    .map((product) => {
      const out = product.stock_quantity === 0;
      return {
        id: `stock:${product.id}:${out ? "out" : "low"}`,
        kind: "stock" as const,
        productId: product.id,
        productName: product.name,
        title: out ? `${product.name} esgotado` : `${product.name} a acabar`,
        description: out
          ? "Não pode vender este produto até repor o stock."
          : `Só restam ${product.stock_quantity} (avisa a partir de ${product.low_stock_threshold}).`,
        href: `/dashboard/produtos/${product.id}`,
        action: "Ver produto",
        tone: out ? ("danger" as const) : ("warning" as const),
      };
    });

  // Dívidas: em atraso (urgente) ou abertas há mais de 7 dias (atenção).
  const DAY = 24 * 60 * 60 * 1000;
  const debts: NoticeItem[] = [];
  for (const debt of openDebts ?? []) {
    const remaining = Math.max(0, Number(debt.total_amount) - Number(debt.amount_paid));
    if (remaining <= 0) continue;
    const customer = debt.customers as unknown as { name: string; phone: string | null } | null;
    const name = customer?.name ?? "Cliente";
    const days = Math.floor((now.getTime() - new Date(debt.created_at).getTime()) / DAY);
    const overdue = debt.status === "vencida";
    if (!overdue && days < 7) continue;
    const message = `Olá ${name} 👋\n\nEste é um lembrete sobre o valor de ${formatMT(remaining)} que está pendente.\n\nQuando puder, por favor passe para regularizar.\n\nObrigado!`;
    debts.push({
      id: `debt:${debt.id}:${overdue ? "overdue" : "old"}`,
      kind: "debt",
      title: `${name} deve ${formatMT(remaining)}`,
      description: overdue
        ? `Em atraso · fiado há ${days} dia${days === 1 ? "" : "s"}`
        : `Fiado há ${days} dias`,
      href: `/dashboard/dividas/${debt.id}#receber`,
      action: "Receber",
      secondary: customer?.phone
        ? { label: "Lembrar", href: whatsappLink(message, customer.phone), external: true }
        : undefined,
      tone: overdue ? "danger" : "warning",
    });
  }

  // Informação: produtos sem preço de compra (o lucro não os conta).
  const noCost = (products ?? []).filter((p) => p.cost_price === null || p.cost_price === undefined);
  const info: NoticeItem[] = noCost.length
    ? [
        {
          id: `info:cost:${noCost.length}`,
          kind: "info",
          title: `${noCost.length} produto${noCost.length === 1 ? "" : "s"} sem preço de compra`,
          description: `${noCost
            .slice(0, 3)
            .map((p) => p.name)
            .join(", ")}${noCost.length > 3 ? "…" : ""} — o lucro não conta estas vendas.`,
          href: noCost.length === 1 ? `/dashboard/produtos/${noCost[0]!.id}` : "/dashboard/produtos",
          action: "Completar",
          tone: "info",
        },
      ]
    : [];

  const sub = subscriptions?.[0];
  const plan = sub?.plans as unknown as { name: string } | null;
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end)
    : null;

  const subscription: NoticeItem[] = [];
  if (sub?.status === "pending") {
    subscription.push({
      id: `subscription:${sub.id}`,
      kind: "account",
      title: "Assinatura à espera de confirmação",
      description: "Consulte o estado da sua assinatura e os passos seguintes.",
      href: "/dashboard/meu-plano",
      action: "Ver assinatura",
      tone: "warning",
    });
  } else if (sub?.status === "past_due") {
    subscription.push({
      id: `subscription:${sub.id}`,
      kind: "account",
      title: "Assinatura com pagamento em atraso",
      description: "Verifique a sua assinatura e os pagamentos associados.",
      href: "/dashboard/pagamentos",
      action: "Ver pagamentos",
      tone: "danger",
    });
  } else if (sub?.status === "suspended" || sub?.status === "expired") {
    subscription.push({
      id: `subscription:${sub.id}`,
      kind: "account",
      title: sub.status === "suspended" ? "Assinatura suspensa" : "Assinatura expirada",
      description:
        sub.status === "suspended"
          ? "Consulte os detalhes da sua assinatura."
          : "Consulte os planos disponíveis para recuperar os benefícios.",
      href: sub.status === "suspended" ? "/dashboard/meu-plano" : "/dashboard/planos",
      action: sub.status === "suspended" ? "Ver assinatura" : "Ver planos",
      tone: "danger",
    });
  } else if (
    sub?.status === "active" &&
    periodEnd &&
    periodEnd.getTime() > now.getTime() &&
    periodEnd.getTime() <= soon.getTime()
  ) {
    subscription.push({
      id: `subscription:${sub.id}`,
      kind: "account",
      title: "A sua assinatura está próxima do fim do período",
      description: `Plano ${plan?.name ?? "actual"} · Data de renovação: ${formatDate(sub.current_period_end)}`,
      href: "/dashboard/meu-plano",
      action: "Ver assinatura",
      tone: "warning",
    });
  } else if (
    sub?.status === "active" &&
    periodEnd &&
    periodEnd.getTime() <= now.getTime()
  ) {
    subscription.push({
      id: `subscription:${sub.id}`,
      kind: "account",
      title: "O período da assinatura terminou",
      description: "Consulte o estado da sua assinatura.",
      href: "/dashboard/meu-plano",
      action: "Ver assinatura",
      tone: "danger",
    });
  }

  // Pendentes: todos. Rejeitado: só se for o pagamento mais recente
  // (se depois já pagou de novo, o aviso antigo deixa de fazer sentido).
  const relevantPayments = (payments ?? []).filter(
    (payment, index) => payment.status === "pending" || (payment.status === "rejected" && index === 0),
  );

  const paymentNotices: NoticeItem[] = relevantPayments.map((payment) => ({
    id: `payment:${payment.id}`,
    kind: "account" as const,
    title:
      payment.status === "pending"
        ? "Pagamento à espera de confirmação"
        : "Pagamento rejeitado",
    description: `Referência ${payment.reference} · ${formatMT(Number(payment.amount))} · ${formatDate(payment.created_at)}`,
    href: "/dashboard/pagamentos",
    action: "Ver pagamento",
    tone: payment.status === "rejected" ? ("danger" as const) : ("info" as const),
  }));

  return {
    stock,
    debts,
    subscription,
    payments: paymentNotices,
    info,
    hasError: !!(productsError || subscriptionsError || paymentsError || debtsError),
  };
});
