import { LogOut } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { signOut } from "../(auth)/actions";
import { getBusinessContext } from "@/lib/supabase/business";
import { createClient } from "@/lib/supabase/server";
import { loadNotices } from "@/lib/notifications";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { businessId, businessName } = await getBusinessContext();
  const supabase = createClient();

  const [
    { data: isPlatformAdmin },
    { data: { user } },
    { data: activeSubscriptions },
    notices,
  ] = await Promise.all([
    supabase.rpc("is_platform_admin"),
    supabase.auth.getUser(),
    supabase
      .from("subscriptions")
      .select("plans(name)")
      .eq("business_id", businessId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1),
    loadNotices(),
  ]);

  // O sino conta só os alertas urgentes e de atenção (não os informativos).
  const noticeIds = [...notices.stock, ...notices.debts, ...notices.subscription, ...notices.payments]
    .filter((n) => n.tone !== "info")
    .map((n) => n.id);

  const userLabel =
    (typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "") ||
    user?.email?.split("@")[0] ||
    "Utilizador";

  const avatarUrl =
    typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : "";

  const planRelation = activeSubscriptions?.[0]?.plans as unknown as
    | { name: string }
    | { name: string }[]
    | null
    | undefined;

  const planName = (
    Array.isArray(planRelation) ? planRelation[0]?.name : planRelation?.name
  )?.trim() || "Free";

  return (
    <AppShell
      businessName={businessName}
      isPlatformAdmin={!!isPlatformAdmin}
      userLabel={userLabel}
      planName={planName}
      avatarUrl={avatarUrl}
      noticeIds={noticeIds}
      businessId={businessId}
      actions={
        <form action={signOut}>
          <button
            type="submit"
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-medium text-dark-muted transition-colors hover:bg-white/5 hover:text-dark-text"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </form>
      }
    >
      {children}
    </AppShell>
  );
}
