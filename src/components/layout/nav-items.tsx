import { ShieldCheck } from "lucide-react";
import {
  IconBell,
  IconCustomers,
  IconDebts,
  IconHome,
  IconMore,
  IconPayments,
  IconPlan,
  IconProducts,
  IconSales,
  IconTeam,
  type NavIcon,
} from "@/components/icons/NavIcons";

export type NavItem = { href: string; label: string; Icon: NavIcon };

/** Ícone do Lucide adaptado ao formato dos ícones de navegação (sem versão preenchida). */
const ShieldIcon: NavIcon = ({ className }) => <ShieldCheck className={className} aria-hidden />;

export const DASHBOARD_HREF = "/dashboard";
export const NEW_SALE_HREF = "/dashboard/vendas/nova";
export const NOTIFICATIONS_HREF = "/dashboard/notificacoes";
export const NOTIFICATIONS_ICON = IconBell;

/**
 * Sidebar (md+), organizada em dois grupos para ser fácil de ler:
 * o que se usa todos os dias primeiro, a gestão da conta depois.
 * As notificações estão no sino da barra superior; "Planos" abre-se a partir de "Meu plano".
 */
export const SIDEBAR_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Dia-a-dia",
    items: [
      { href: "/dashboard", label: "Início", Icon: IconHome },
      { href: "/dashboard/vendas", label: "Vendas", Icon: IconSales },
      { href: "/dashboard/produtos", label: "Produtos", Icon: IconProducts },
      { href: "/dashboard/dividas", label: "Dívidas", Icon: IconDebts },
      { href: "/dashboard/clientes", label: "Clientes", Icon: IconCustomers },
    ],
  },
  {
    title: "Gestão",
    items: [
      { href: "/dashboard/funcionarios", label: "Funcionários", Icon: IconTeam },
      { href: "/dashboard/meu-plano", label: "Meu plano", Icon: IconPlan },
      { href: "/dashboard/pagamentos", label: "Pagamentos", Icon: IconPayments },
    ],
  },
];

/** Lista plana (mantida para compatibilidade). */
export const SIDEBAR_ITEMS: NavItem[] = SIDEBAR_GROUPS.flatMap((g) => g.items);

/** Só aparece quando is_platform_admin = true. */
export const PLATFORM_ITEM: NavItem = {
  href: "/platform-admin",
  label: "Plataforma",
  Icon: ShieldIcon,
};

/**
 * Barra inferior mobile: 2 itens + botão "Vender" ao centro + 2 itens.
 * O botão central é desenhado à parte no MobileNav.
 */
export const MOBILE_LEFT_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Início", Icon: IconHome },
  { href: "/dashboard/produtos", label: "Produtos", Icon: IconProducts },
];

export const MOBILE_RIGHT_ITEMS: NavItem[] = [
  { href: "/dashboard/dividas", label: "Dívidas", Icon: IconDebts },
  { href: "/dashboard/mais", label: "Mais", Icon: IconMore },
];

/** Mantido para compatibilidade com código antigo. */
export const MOBILE_ITEMS: NavItem[] = [...MOBILE_LEFT_ITEMS, ...MOBILE_RIGHT_ITEMS];

/** Itens do menu "Mais" no telemóvel. */
export const MORE_ITEMS: NavItem[] = [
  { href: "/dashboard/vendas", label: "Histórico de vendas", Icon: IconSales },
  { href: "/dashboard/clientes", label: "Clientes", Icon: IconCustomers },
  { href: "/dashboard/funcionarios", label: "Funcionários", Icon: IconTeam },
  { href: "/dashboard/meu-plano", label: "Meu plano", Icon: IconPlan },
  { href: "/dashboard/planos", label: "Planos", Icon: IconPlan },
  { href: "/dashboard/pagamentos", label: "Pagamentos", Icon: IconPayments },
];

/** Rotas que destacam o botão "Mais" no telemóvel. */
export const MORE_GROUP_HREFS = [
  "/dashboard/mais",
  "/dashboard/clientes",
  "/dashboard/funcionarios",
  "/dashboard/planos",
  "/dashboard/meu-plano",
  "/dashboard/pagamentos",
  "/dashboard/configuracoes",
];

/** "/dashboard" só é activo em correspondência exacta; os restantes por prefixo de segmento. */
export function isActivePath(pathname: string, href: string) {
  if (href === DASHBOARD_HREF) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
