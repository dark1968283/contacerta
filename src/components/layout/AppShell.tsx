import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { OfflineSalesSync } from "./OfflineSalesSync";

type AppShellProps = {
  businessName: string;
  isPlatformAdmin: boolean;
  userLabel: string;
  planName: string;
  avatarUrl?: string;
  /** Negócio actual (para a fila de vendas sem internet). */
  businessId: string;
  /** IDs dos avisos actuais (para o número do sino). */
  noticeIds?: string[];
  /** Acções da barra superior e do menu da conta. */
  actions?: ReactNode;
  sidebarActions?: ReactNode;
  children: ReactNode;
};

/**
 * Não força fundo escuro: as páginas actuais são claras (bg-paper / text-ink),
 * por isso só a "chrome" (sidebar, topo, barra mobile) é dark. As larguras
 * max-w-app / md:max-w-2xl / lg:max-w-5xl são as do layout actual.
 */
export function AppShell({
  businessName,
  isPlatformAdmin,
  userLabel,
  planName,
  avatarUrl,
  noticeIds,
  businessId,
  actions,
  sidebarActions,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-dvh">
      <Sidebar
        isPlatformAdmin={isPlatformAdmin}
        userLabel={userLabel}
        businessName={businessName}
        planName={planName}
        avatarUrl={avatarUrl}
        accountActions={sidebarActions}
      />

      <div className="md:pl-60">
        <div className="mx-auto min-h-dvh max-w-app pb-28 md:max-w-2xl md:pb-10 lg:max-w-5xl">
          <TopBar businessName={businessName} noticeIds={noticeIds}>{actions}</TopBar>
          <OfflineSalesSync businessId={businessId} />
          <main className="px-4 pb-6 pt-5 sm:px-6">{children}</main>
        </div>
      </div>

      <MobileNav userLabel={userLabel} avatarUrl={avatarUrl} />
    </div>
  );
}
