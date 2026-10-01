"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { SIDEBAR_ITEMS, PLATFORM_ITEM, isActivePath, type NavItem } from "./nav-items";

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActivePath(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? "bg-dark-strong text-dark-text" : "text-dark-muted hover:bg-white/5 hover:text-dark-text"
      }`}
    >
      <item.Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-brandGlow" : ""}`} aria-hidden />
      {item.label}
    </Link>
  );
}

/** Sidebar fixa, visível a partir de md: (a MobileNav cobre abaixo de md:). */
export function Sidebar({ isPlatformAdmin }: { isPlatformAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-dark-border bg-dark-surface md:flex">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Logo />
      </div>

      <nav aria-label="Navegação principal" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {SIDEBAR_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}

        {isPlatformAdmin && (
          <div className="mt-3 border-t border-dark-border pt-3">
            <SidebarLink item={PLATFORM_ITEM} pathname={pathname} />
          </div>
        )}
      </nav>

      <p className="shrink-0 border-t border-dark-border px-5 py-4 text-xs text-dark-faint">
        O seu negócio. Sob controlo.
      </p>
    </aside>
  );
}
