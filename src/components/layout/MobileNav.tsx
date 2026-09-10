"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, ShoppingCart, Package, WalletCards, Menu, type LucideIcon } from "lucide-react";

const items: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Início", Icon: LayoutDashboard },
  { href: "/dashboard/vendas", label: "Vendas", Icon: ShoppingCart },
  { href: "/dashboard/produtos", label: "Produtos", Icon: Package },
  { href: "/dashboard/dividas", label: "Dívidas", Icon: WalletCards },
  { href: "/dashboard/mais", label: "Mais", Icon: Menu },
];

/**
 * Barra de navegação inferior, flutuante, para mobile. Inspirada no
 * FloatingNav fornecido como referência, mas adaptada ao ContaCerta:
 * rotas reais do produto (não Home/Search/Alerts/Profile genéricos),
 * estado ativo derivado de usePathname() (nunca um setActive(index) local),
 * e navegação real via <Link>, não botões que só mudam estado visual.
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="flex items-center gap-1 rounded-full border border-dark-border bg-dark-surface/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur">
        {items.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
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