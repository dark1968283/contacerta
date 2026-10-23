"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  UserRound,
  Settings,
  X,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  MOBILE_LEFT_ITEMS,
  MOBILE_RIGHT_ITEMS,
  MORE_GROUP_HREFS,
  MORE_ITEMS,
  NEW_SALE_HREF,
  isActivePath,
  type NavItem,
} from "./nav-items";

type MobileNavProps = {
  userLabel: string;
  avatarUrl?: string;
};



export function MobileNav({ userLabel, avatarUrl }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const moreActive = MORE_GROUP_HREFS.some((href) => isActivePath(pathname, href));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Fechar menu Mais"
              className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-[2px] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              id="mobile-more-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Mais opções"
              className="fixed bottom-[calc(5.7rem+env(safe-area-inset-bottom))] left-3 z-[70] flex max-h-[min(72dvh,620px)] w-[min(84vw,340px)] flex-col overflow-hidden rounded-3xl border border-dark-border bg-dark-surface shadow-2xl shadow-black/40 md:hidden"
              initial={{ opacity: 0, x: -24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -18, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              <div className="flex items-center gap-3 border-b border-dark-border p-4">
                <Link
                  href="/dashboard/configuracoes"
                  onClick={() => setOpen(false)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brandGlow"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brandGlow/25 bg-brandGlow/10 text-brandGlow">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserRound className="h-6 w-6" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-medium uppercase tracking-wider text-dark-muted">
                      A sua conta
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-semibold text-dark-text">
                      {userLabel || "Perfil"}
                    </span>
                    <span className="mt-1 block text-xs text-brandGlow">Ver perfil e definições</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar menu"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-dark-muted transition hover:bg-white/5 hover:text-dark-text"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="overflow-y-auto overscroll-contain p-2.5">
                <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-dark-muted">
                  Navegação
                </p>

                {MORE_ITEMS.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`mb-1 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        active
                          ? "bg-brandGlow/10 text-brandGlow"
                          : "text-dark-muted hover:bg-white/[0.04] hover:text-dark-text"
                      }`}
                    >
                      <item.Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight className="h-4 w-4 opacity-50" aria-hidden />
                    </Link>
                  );
                })}

                <Link
                  href="/dashboard/configuracoes"
                  onClick={() => setOpen(false)}
                  className={`mb-1 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    isActivePath(pathname, "/dashboard/configuracoes")
                      ? "bg-brandGlow/10 text-brandGlow"
                      : "text-dark-muted hover:bg-white/[0.04] hover:text-dark-text"
                  }`}
                >
                  <Settings className="h-[18px] w-[18px]" aria-hidden />
                  <span className="flex-1">Configurações</span>
                  <ChevronRight className="h-4 w-4 opacity-50" aria-hidden />
                </Link>
              </div>

              <div className="border-t border-dark-border px-4 py-3">
                <p className="text-[11px] leading-5 text-dark-muted">
                  Gerencie o seu negócio e a sua conta num só lugar.
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <div className="flex items-center gap-1 rounded-full border border-dark-border bg-dark-surface/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur">
          {MOBILE_LEFT_ITEMS.map((item) => (
            <NavTab key={item.href} item={item} active={isActivePath(pathname, item.href)} />
          ))}

          <Link
            href={NEW_SALE_HREF}
            aria-label="Vender: registar nova venda"
            aria-current={isActivePath(pathname, NEW_SALE_HREF) ? "page" : undefined}
            className={`mx-1 flex h-14 min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-full px-4 text-[11px] font-bold text-[#06120C] shadow-[0_6px_24px_rgba(34,199,102,0.45)] outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-white ${
              isActivePath(pathname, "/dashboard/vendas") ? "bg-[#4BE08A]" : "bg-[#22C766]"
            }`}
          >
            <Plus className="h-6 w-6" strokeWidth={3} aria-hidden />
            Vender
          </Link>

          {MOBILE_RIGHT_ITEMS.map((item) => {
            const isMore = item.href === "/dashboard/mais";
            if (!isMore) {
              return <NavTab key={item.href} item={item} active={isActivePath(pathname, item.href)} />;
            }
            return (
              <NavTab
                key={item.href}
                item={item}
                active={moreActive || open}
                onClick={() => setOpen((value) => !value)}
                ariaExpanded={open}
              />
            );
          })}
        </div>
      </nav>
    </>
  );
}

function NavTab({
  item,
  active,
  onClick,
  ariaExpanded,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
  ariaExpanded?: boolean;
}) {
  const classes = `relative flex min-w-[54px] flex-col items-center gap-0.5 rounded-full px-3 py-2 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-brandGlow ${
    active ? "text-dark-text" : "text-dark-muted"
  }`;

  const contents = (
    <>
      {active && (
        <motion.span
          layoutId="mobile-nav-active"
          className="absolute inset-0 rounded-full bg-white/10"
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        />
      )}
      <item.Icon className={`relative h-5 w-5 ${active ? "text-brandGlow" : "text-dark-muted"}`} aria-hidden />
      <span className="relative">{item.label}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        aria-label={ariaExpanded ? "Fechar Mais" : "Abrir Mais"}
        aria-expanded={ariaExpanded}
        aria-controls="mobile-more-drawer"
        onClick={onClick}
      >
        {contents}
      </button>
    );
  }

  return (
    <Link href={item.href} aria-label={item.label} aria-current={active ? "page" : undefined} className={classes}>
      {contents}
    </Link>
  );
}
