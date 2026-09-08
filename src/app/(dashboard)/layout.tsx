import { MobileNav } from "@/components/layout/MobileNav";
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
    <div className="mx-auto min-h-dvh max-w-app pb-20">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <div><span className="font-semibold text-ink">{businessName}</span><div className="mt-1 flex gap-3 text-xs"><a href="/dashboard/planos" className="text-ink/60">Planos</a><a href="/dashboard/meu-plano" className="text-ink/60">Meu plano</a><a href="/dashboard/pagamentos" className="text-ink/60">Pagamentos</a>{isPlatformAdmin && <a href="/platform-admin" className="text-brand">Plataforma</a>}</div></div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-ink/50">
            Sair
          </button>
        </form>
      </header>

      <main className="px-6 py-6">{children}</main>

      <MobileNav />
    </div>
  );
}
