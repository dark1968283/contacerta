"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronUp,
  CircleUserRound,
  CreditCard,
  LogOut,
  MoreHorizontal,
  Settings,
} from "lucide-react";
import { Logo } from "./Logo";
import { NotificationCountBadge } from "./NotificationCountBadge";
import { SIDEBAR_ITEMS, PLATFORM_ITEM, isActivePath, type NavItem } from "./nav-items";

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActivePath(pathname, item.href);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
        active
          ? "bg-dark-strong text-dark-text"
          : "text-dark-muted hover:bg-white/5 hover:text-dark-text"
      }`}
    >
      <item.Icon
        className={`h-[18px] w-[18px] shrink-0 ${active ? "text-brandGlow" : ""}`}
        aria-hidden
      />
      <span className="min-w-0 flex-1">{item.label}</span>
      {item.href === "/dashboard/notificacoes" && <NotificationCountBadge />}
    </Link>
  );
}

type SidebarProps = {
  isPlatformAdmin: boolean;
  userLabel: string;
  businessName: string;
  planName: string;
  avatarUrl?: string;
  accountActions?: ReactNode;
};

export function Sidebar({
  isPlatformAdmin,
  userLabel,
  businessName,
  planName,
  avatarUrl,
  accountActions,
}: SidebarProps) {
  const pathname = usePathname();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const safeUserLabel = typeof userLabel === "string" ? userLabel.trim() : "";
  const safeBusinessName = typeof businessName === "string" ? businessName : "ContaCerta";
  const safePlanName = typeof planName === "string" && planName.trim() ? planName.trim() : "Free";
  const initial = safeUserLabel.charAt(0).toUpperCase() || "U";

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-dark-border bg-dark-surface md:flex">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Logo />
      </div>

      <nav
        aria-label="Navegação principal"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-3"
      >
        {SIDEBAR_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}

        {isPlatformAdmin && (
          <div className="mt-3 border-t border-dark-border pt-3">
            <SidebarLink item={PLATFORM_ITEM} pathname={pathname} />
          </div>
        )}
      </nav>

      <div className="relative shrink-0 border-t border-dark-border p-3">
        {accountMenuOpen && (
          <div
            id="sidebar-account-menu"
            className="mb-2 overflow-hidden rounded-2xl border border-dark-border bg-[#17211C] p-1.5 shadow-2xl shadow-black/30"
          >
            <div className="border-b border-dark-border px-3 py-3">
              <p className="truncate text-sm font-medium text-dark-text">
                {safeUserLabel || "Utilizador"}
              </p>
              <p className="mt-1 truncate text-xs text-dark-muted">
                {safeBusinessName}
              </p>
              <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-brandGlow/15 bg-brandGlow/[0.08] px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-brandGlow" />
                <span className="truncate text-xs font-medium text-brandGlow">
                  Plano {safePlanName}
                </span>
              </div>
            </div>

            <Link
              href="/dashboard/meu-plano"
              onClick={() => setAccountMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-dark-muted transition-colors hover:bg-white/5 hover:text-dark-text"
            >
              <CreditCard className="h-4 w-4" aria-hidden />
              Meu plano
            </Link>

            <Link
              href="/dashboard/configuracoes"
              onClick={() => setAccountMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-dark-muted transition-colors hover:bg-white/5 hover:text-dark-text"
            >
              <Settings className="h-4 w-4" aria-hidden />
              Configurações
            </Link>

            <Link
              href="/dashboard/mais"
              onClick={() => setAccountMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-dark-muted transition-colors hover:bg-white/5 hover:text-dark-text"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden />
              Mais opções
            </Link>

            {accountActions}
          </div>
        )}

        <button
          type="button"
          aria-expanded={accountMenuOpen}
          aria-controls="sidebar-account-menu"
          onClick={() => setAccountMenuOpen((open) => !open)}
          className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition-all duration-200 hover:border-white/[0.07] hover:bg-white/[0.045] active:scale-[0.99]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-brandGlow/20 bg-brandGlow/10 text-sm font-semibold text-brandGlow transition-colors group-hover:bg-brandGlow/15">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : initial}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-dark-text">
              {safeUserLabel || "Utilizador"}
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-dark-muted">
              <span className="truncate">Plano {safePlanName}</span>
            </span>
          </span>

          <ChevronUp
            className={`h-4 w-4 shrink-0 text-dark-muted transition-transform duration-200 ${
              accountMenuOpen ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>

        <p className="px-2 pb-1 pt-3 text-center text-[10px] text-dark-faint">
          O seu negócio. Sob controlo.
        </p>
      </div>
    </aside>
  );
}
