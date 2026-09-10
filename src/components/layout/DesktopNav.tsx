"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, WalletCards, Menu, ShieldCheck, type LucideIcon } from "lucide-react";

const items: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/dashboard/vendas", label: "Vendas", Icon: ShoppingCart },
  { href: "/dashboard/produtos", label: "Produtos", Icon: Package },
  { href: "/dashboard/dividas", label: "Dívidas", Icon: WalletCards },
  { href: "/dashboard/mais", label: "Mais", Icon: Menu },
];

/**
 * Nav flutuante partilhada por todo o (dashboard). Em ecrãs pequenos só
 * mostra o nome do negócio + o que for passado em `children` (o botão
 * Sair) — a navegação principal em mobile é a MobileNav (barra inferior).
 * A partir de `md:` mostra também os links, com estado ativo real
 * (usePathname), não estado local simulado.
 */
export function DesktopNav({
  businessName,
  isPlatformAdmin,
  children,
}: {
  businessName: string;
  isPlatformAdmin: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const allItems = isPlatformAdmin
    ? [...items, { href: "/platform-admin", label: "Plataforma", Icon: ShieldCheck }]
    : items;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-dark-border bg-dark-surface/95 px-3 py-2.5 shadow-xl shadow-black/30 backdrop-blur sm:px-4">
      <div className="flex min-w-0 items-center gap-4">
        <span className="truncate text-sm font-semibold text-dark-text">{businessName}</span>

        <nav aria-label="Navegação principal" className="hidden items-center gap-0.5 md:flex">
          {allItems.map((item) => {
            const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-dark-strong text-dark-text" : "text-dark-muted hover:bg-white/5 hover:text-dark-text"
                }`}
              >
                <item.Icon className={`h-4 w-4 ${active ? "text-brandGlow" : ""}`} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </div>
  );
}
