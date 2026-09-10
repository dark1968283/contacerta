import { LogOut } from "lucide-react";
import { MobileNav } from "@/components/layout/MobileNav";
import { DesktopNav } from "@/components/layout/DesktopNav";
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
    <div className="mx-auto min-h-dvh max-w-app pb-28 md:max-w-2xl lg:max-w-5xl">
      <div className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
        <DesktopNav businessName={businessName} isPlatformAdmin={!!isPlatformAdmin}>
          <form action={signOut}>
            <button
              type="submit"
              className="flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-medium text-dark-muted transition-colors hover:bg-white/5 hover:text-dark-text"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </form>
        </DesktopNav>
      </div>

      <main className="px-4 pb-6 pt-5 sm:px-6">{children}</main>

      <MobileNav />
    </div>
  );
}