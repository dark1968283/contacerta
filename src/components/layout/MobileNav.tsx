"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MOBILE_ITEMS, MORE_GROUP_HREFS, isActivePath } from "./nav-items";

/**
 * Substitui a MobileNav actual (mesmo caminho e mesmo export nomeado).
 * Mantém o visual e a animação; "Mais" fica activo também em Clientes, Planos,
 * Meu plano e Pagamentos, que só são alcançáveis a partir de /dashboard/mais.
 */
export function MobileNav() {
  const pathname = usePathname();
  const moreActive = MORE_GROUP_HREFS.some((h) => isActivePath(pathname, h));

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="flex items-center gap-1 rounded-full border border-dark-border bg-dark-surface/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur">
        {MOBILE_ITEMS.map((item) => {
          const active = item.href === "/dashboard/mais" ? moreActive : isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center gap-0.5 rounded-full px-3.5 py-2 text-[10px] font-medium"
            >
              {active && (
                <motion.span
                  layoutId="mobile-nav-active"
                  className="absolute inset-0 rounded-full bg-white/10"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <item.Icon className={`relative h-5 w-5 ${active ? "text-brandGlow" : "text-dark-muted"}`} aria-hidden />
              <span className={`relative ${active ? "text-dark-text" : "text-dark-muted"}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
