import { LogOut } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { signOut } from "../(auth)/actions";
import { getBusinessContext } from "@/lib/supabase/business";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { businessName } = await getBusinessContext();
  const { data: isPlatformAdmin } = await createClient().rpc("is_platform_admin");

  return (
    <AppShell
      businessName={businessName}
      isPlatformAdmin={!!isPlatformAdmin}
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
