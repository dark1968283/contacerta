import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  WalletCards,
  Sparkles,
  Wallet,
  CreditCard,
  Menu,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; Icon: LucideIcon };

export const DASHBOARD_HREF = "/dashboard";

/** Sidebar (md+): todas as áreas do (dashboard). Rotas reais do projeto. */
export const SIDEBAR_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/dashboard/vendas", label: "Vendas", Icon: ShoppingCart },
  { href: "/dashboard/produtos", label: "Produtos", Icon: Package },
  { href: "/dashboard/clientes", label: "Clientes", Icon: Users },
  { href: "/dashboard/dividas", label: "Dívidas", Icon: WalletCards },
  { href: "/dashboard/planos", label: "Planos", Icon: Sparkles },
  { href: "/dashboard/meu-plano", label: "Meu plano", Icon: Wallet },
  { href: "/dashboard/pagamentos", label: "Pagamentos", Icon: CreditCard },
];

/** Só aparece quando is_platform_admin = true (mesma regra do DesktopNav actual). */
export const PLATFORM_ITEM: NavItem = {
  href: "/platform-admin",
  label: "Plataforma",
  Icon: ShieldCheck,
};

/** Barra inferior mobile: igual à MobileNav actual. "Mais" é uma página real. */
export const MOBILE_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Início", Icon: LayoutDashboard },
  { href: "/dashboard/vendas", label: "Vendas", Icon: ShoppingCart },
  { href: "/dashboard/produtos", label: "Produtos", Icon: Package },
  { href: "/dashboard/dividas", label: "Dívidas", Icon: WalletCards },
  { href: "/dashboard/mais", label: "Mais", Icon: Menu },
];

/** Rotas acessíveis a partir da página /dashboard/mais (para destacar "Mais"). */
export const MORE_GROUP_HREFS = [
  "/dashboard/mais",
  "/dashboard/clientes",
  "/dashboard/planos",
  "/dashboard/meu-plano",
  "/dashboard/pagamentos",
];

/** "/dashboard" só é activo em correspondência exacta; os restantes por prefixo de segmento. */
export function isActivePath(pathname: string, href: string) {
  if (href === DASHBOARD_HREF) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
