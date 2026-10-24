import { loadNotices } from "@/lib/notifications";
import { getBusinessContext } from "@/lib/supabase/business";
import NotificationCenter from "./NotificationCenter";

export default async function NotificacoesPage() {
  const [notices, { role }] = await Promise.all([loadNotices(), getBusinessContext()]);

  return (
    <NotificationCenter
      stock={notices.stock}
      debts={notices.debts}
      subscription={notices.subscription}
      payments={notices.payments}
      info={notices.info}
      hasError={notices.hasError}
      isAdmin={role === "admin"}
    />
  );
}
