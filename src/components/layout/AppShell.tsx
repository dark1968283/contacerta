import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";

type AppShellProps = {
  businessName: string;
  isPlatformAdmin: boolean;
  /** Slot da TopBar (botão Sair). O signOut continua no layout, sem alterações. */
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * Não força fundo escuro: as páginas actuais são claras (bg-paper / text-ink),
 * por isso só a "chrome" (sidebar, topo, barra mobile) é dark. As larguras
 * max-w-app / md:max-w-2xl / lg:max-w-5xl são as do layout actual.
 */
export function AppShell({ businessName, isPlatformAdmin, actions, children }: AppShellProps) {
  return (
    <div className="min-h-dvh">
      <Sidebar isPlatformAdmin={isPlatformAdmin} />

      <div className="md:pl-60">
        <div className="mx-auto min-h-dvh max-w-app pb-28 md:max-w-2xl md:pb-10 lg:max-w-5xl">
          <TopBar businessName={businessName}>{actions}</TopBar>
          <main className="px-4 pb-6 pt-5 sm:px-6">{children}</main>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
