import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { NotificationCountBadge } from "./NotificationCountBadge";
import { ThemeToggleButton } from "@/components/theme/ThemeToggle";
import { LightGlass } from "@/components/ui/liquid-glass";
import { NOTIFICATIONS_HREF, NOTIFICATIONS_ICON as BellIcon } from "./nav-items";

type TopBarProps = {
  businessName: string;
  noticeIds?: string[];
  /** Slot à direita — o layout passa aqui o <form action={signOut}> existente. */
  children?: ReactNode;
};

/**
 * Barra superior flutuante (mesmo visual da DesktopNav actual). Não renderiza
 * <h1>: cada página já tem o seu próprio título.
 */
export function TopBar({ businessName, noticeIds, children }: TopBarProps) {
  return (
    <div className="sticky top-0 z-20 px-4 pt-4 sm:px-6">
      <LightGlass material="clear" refraction={24} dispersion={0.35}>
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-dark-border bg-dark-surface/95 px-3 py-2.5 shadow-xl shadow-black/30 backdrop-blur sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Logo showText={false} className="md:hidden" />
          <span className="truncate text-sm font-semibold text-dark-text">{businessName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggleButton />
          <Link
            href={NOTIFICATIONS_HREF}
            aria-label="Notificações"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-dark-muted transition hover:bg-white/5 hover:text-dark-text"
          >
            <BellIcon className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5">
              <NotificationCountBadge ids={noticeIds} />
            </span>
          </Link>
          {children}
        </div>
      </div>
      </LightGlass>
    </div>
  );
}
