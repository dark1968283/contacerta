"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  UserRound,
  Settings,
  X,
  ChevronRight,
  LogOut,
  Plus,
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { ThemeChooser } from "@/components/theme/ThemeToggle";
import { LightGlass } from "@/components/ui/liquid-glass";
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



const TAB_ITEMS = [...MOBILE_LEFT_ITEMS, ...MOBILE_RIGHT_ITEMS];
const MORE_HREF = "/dashboard/mais";

type Box = { x: number; y: number; w: number; h: number };

export function MobileNav({ userLabel, avatarUrl }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const moreActive = MORE_GROUP_HREFS.some((href) => isActivePath(pathname, href));

  /* ── Gota de vidro (estilo iOS 26): marca o separador activo e pode ser
     arrastada com o dedo de um separador para outro. ───────────────────── */
  const barRef = useRef<HTMLDivElement>(null);
  const [rest, setRest] = useState<Box | null>(null);
  const [dragX, setDragX] = useState<number | null>(null);
  const [hoverHref, setHoverHref] = useState<string | null>(null);
  const drag = useRef({ active: false, moved: false, startX: 0, pointerId: -1, href: null as string | null });
  const suppressClick = useRef(false);

  const activeHref = open
    ? MORE_HREF
    : (TAB_ITEMS.find((i) => (i.href === MORE_HREF ? moreActive : isActivePath(pathname, i.href)))?.href ?? null);

  const boxOf = useCallback((el: HTMLElement): Box => {
    const b = barRef.current!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
  }, []);

  const tabEls = () => [...(barRef.current?.querySelectorAll<HTMLElement>("[data-tab]") ?? [])];

  const nearest = (clientX: number) => {
    let best: HTMLElement | null = null;
    let dist = Infinity;
    for (const el of tabEls()) {
      const r = el.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - clientX);
      if (d < dist) {
        dist = d;
        best = el;
      }
    }
    return best;
  };

  useLayoutEffect(() => {
    const measure = () => {
      const el = tabEls().find((t) => t.dataset.tab === activeHref);
      setRest(el && barRef.current ? boxOf(el) : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeHref, boxOf]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const tab = (e.target as HTMLElement).closest<HTMLElement>("[data-tab]");
    if (!tab || e.button !== 0) return;
    drag.current = { active: true, moved: false, startX: e.clientX, pointerId: e.pointerId, href: tab.dataset.tab ?? null };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.pointerId || !barRef.current || !rest) return;
    if (!d.moved) {
      if (Math.abs(e.clientX - d.startX) < 8) return;
      d.moved = true;
      barRef.current.setPointerCapture(e.pointerId);
    }
    const b = barRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(b.width - rest.w, e.clientX - b.left - rest.w / 2));
    setDragX(x);
    const over = nearest(e.clientX)?.dataset.tab ?? null;
    if (over && over !== hoverHref) {
      setHoverHref(over);
      try {
        navigator.vibrate?.(6);
      } catch {
        /* sem vibração */
      }
    }
  }

  function finishDrag(e: React.PointerEvent<HTMLDivElement>, cancelled = false) {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.pointerId) return;
    d.active = false;
    if (d.moved && !cancelled) {
      suppressClick.current = true;
      const target = nearest(e.clientX)?.dataset.tab;
      if (target === MORE_HREF) setOpen(true);
      else if (target && target !== activeHref) router.push(target);
    }
    setDragX(null);
    setHoverHref(null);
  }

  const visualActive = (href: string) => (dragX !== null ? hoverHref === href : activeHref === href);

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
                  prefetch={false}
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
                      prefetch={false}
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
                      <item.Icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight className="h-4 w-4 opacity-50" aria-hidden />
                    </Link>
                  );
                })}

                <Link
                  prefetch={false}
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

              <div className="space-y-3 border-t border-dark-border p-3">
                <div>
                  <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-dark-muted">
                    Aparência
                  </p>
                  <ThemeChooser compact />
                </div>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger/[0.06]"
                  >
                    <LogOut className="h-5 w-5" aria-hidden />
                    Terminar sessão
                  </button>
                </form>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <LightGlass material="clear" refraction={26} dispersion={0.35}>
        <div
          ref={barRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => finishDrag(e)}
          onPointerCancel={(e) => finishDrag(e, true)}
          onClickCapture={(e) => {
            if (suppressClick.current) {
              suppressClick.current = false;
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          className="relative flex touch-none select-none items-center gap-1 rounded-full border border-dark-border bg-dark-surface/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur"
        >
          {rest && (
            <LightGlass material="clear" refraction={12} dispersion={0.45}>
              <motion.span
                aria-hidden
                className="cc-tab-droplet pointer-events-none absolute left-0 top-0 rounded-full bg-white/10"
                style={{ width: rest.w, height: rest.h }}
                initial={false}
                animate={{ x: dragX ?? rest.x, y: rest.y, scale: dragX !== null ? 1.16 : 1 }}
                transition={
                  dragX !== null
                    ? { x: { type: "spring", stiffness: 900, damping: 50 }, scale: { type: "spring", stiffness: 500, damping: 22 } }
                    : { type: "spring", stiffness: 420, damping: 30 }
                }
              />
            </LightGlass>
          )}

          {MOBILE_LEFT_ITEMS.map((item) => (
            <NavTab key={item.href} item={item} active={visualActive(item.href)} />
          ))}

          <Link
            prefetch={false}
            href={NEW_SALE_HREF}
            aria-label="Vender: registar nova venda"
            aria-current={isActivePath(pathname, NEW_SALE_HREF) ? "page" : undefined}
            className={`mx-1 flex h-14 min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-full px-4 text-[11px] font-bold text-onglow shadow-[0_6px_24px_rgba(34,199,102,0.45)] outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-white ${
              isActivePath(pathname, "/dashboard/vendas") ? "bg-brandGlow" : "bg-brandGlow"
            }`}
          >
            <Plus className="h-6 w-6" strokeWidth={3} aria-hidden />
            Vender
          </Link>

          {MOBILE_RIGHT_ITEMS.map((item) => {
            const isMore = item.href === "/dashboard/mais";
            if (!isMore) {
              return <NavTab key={item.href} item={item} active={visualActive(item.href)} />;
            }
            return (
              <NavTab
                key={item.href}
                item={item}
                active={visualActive(item.href)}
                onClick={() => setOpen((value) => !value)}
                ariaExpanded={open}
              />
            );
          })}
        </div>
        </LightGlass>
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
  const classes = `relative z-10 flex min-w-[54px] flex-col items-center gap-0.5 rounded-full px-3 py-2 text-[11px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brandGlow ${
    active ? "text-dark-text" : "text-dark-muted"
  }`;

  const contents = (
    <>
      <item.Icon filled={active} className={`relative h-6 w-6 ${active ? "text-brandGlow" : "text-dark-muted"}`} />
      <span className="relative">{item.label}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        data-tab={item.href}
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
    <Link
      prefetch={false}
      href={item.href}
      data-tab={item.href}
      draggable={false}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={classes}
    >
      {contents}
    </Link>
  );
}
