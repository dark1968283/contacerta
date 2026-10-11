import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { formatMT } from "@/lib/format";
import NotificationCenter, { type NoticeItem } from "./NotificationCenter";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

export default async function NotificacoesPage() {
  const { businessId } = await getBusinessContext();
  const supabase = createClient();
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    { data: products, error: productsError },
    { data: subscriptions, error: subscriptionsError },
    { data: payments, error: paymentsError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,stock_quantity,low_stock_threshold")
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
      .in("status", ["pending", "rejected"])
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const stock: NoticeItem[] = (products ?? [])
    .filter((product) =>
      product.stock_quantity === 0 ||
      (product.stock_quantity > 0 &&
        product.stock_quantity <= product.low_stock_threshold),
    )
    .map((product) => ({
      id: `stock:${product.id}`,
      title: `${product.name} — ${product.stock_quantity === 0 ? "esgotado" : "stock baixo"}`,
      description:
        product.stock_quantity === 0
          ? "Não existem unidades disponíveis. Actualize o stock para voltar a vender."
          : `${product.stock_quantity} unidade${product.stock_quantity === 1 ? "" : "s"} disponível${product.stock_quantity === 1 ? "" : "e"}; limite de alerta: ${product.low_stock_threshold}.`,
      href: "/dashboard/produtos",
      action: product.stock_quantity === 0 ? "Gerir stock" : "Ver produto",
      tone: product.stock_quantity === 0 ? "danger" : "warning",
    }));

  const sub = subscriptions?.[0];
  const plan = sub?.plans as unknown as { name: string } | null;
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end)
    : null;

  const subscription: NoticeItem[] = [];
  if (sub?.status === "pending") {
    subscription.push({
      id: `subscription:${sub.id}`,
      title: "Assinatura à espera de confirmação",
      description: "Consulte o estado da sua assinatura e os passos seguintes.",
      href: "/dashboard/meu-plano",
      action: "Ver assinatura",
      tone: "warning",
    });
  } else if (sub?.status === "past_due") {
    subscription.push({
      id: `subscription:${sub.id}`,
      title: "Assinatura com pagamento em atraso",
      description: "Verifique a sua assinatura e os pagamentos associados.",
      href: "/dashboard/pagamentos",
      action: "Ver pagamentos",
      tone: "danger",
    });
  } else if (sub?.status === "suspended" || sub?.status === "expired") {
    subscription.push({
      id: `subscription:${sub.id}`,
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
      title: "O período da assinatura terminou",
      description: "Consulte o estado da sua assinatura.",
      href: "/dashboard/meu-plano",
      action: "Ver assinatura",
      tone: "danger",
    });
  }

  const paymentNotices: NoticeItem[] = (payments ?? []).map((payment) => ({
    id: `payment:${payment.id}`,
    title:
      payment.status === "pending"
        ? "Pagamento à espera de confirmação"
        : "Pagamento rejeitado",
    description: `Referência ${payment.reference} · ${formatMT(Number(payment.amount))} · ${formatDate(payment.created_at)}`,
    href: "/dashboard/pagamentos",
    action: "Ver pagamento",
    tone: payment.status === "rejected" ? "danger" : "warning",
  }));

  return (
    <NotificationCenter
      stock={stock}
      subscription={subscription}
      payments={paymentNotices}
      hasError={!!(productsError || subscriptionsError || paymentsError)}
    />
  );
}
