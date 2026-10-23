import { loadNotices } from "@/lib/notifications";
import NotificationCenter from "./NotificationCenter";

export default async function NotificacoesPage() {
  const notices = await loadNotices();

  return (
    <NotificationCenter
      stock={notices.stock}
      subscription={notices.subscription}
      payments={notices.payments}
      hasError={notices.hasError}
    />
  );
}
