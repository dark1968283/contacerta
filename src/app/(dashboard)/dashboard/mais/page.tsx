import Link from "next/link";
import { Users, Sparkles, Wallet, CreditCard, type LucideIcon } from "lucide-react";

const links: { href: string; label: string; description: string; Icon: LucideIcon }[] = [
  { href: "/dashboard/clientes", label: "Clientes", description: "Consulte e adicione clientes do seu negócio", Icon: Users },
  { href: "/dashboard/planos", label: "Planos", description: "Veja os planos disponíveis do ContaCerta", Icon: Sparkles },
  { href: "/dashboard/meu-plano", label: "Meu plano", description: "Estado da sua assinatura e limites", Icon: Wallet },
  { href: "/dashboard/pagamentos", label: "Pagamentos", description: "Histórico dos seus pedidos de pagamento", Icon: CreditCard },
];

export default function MaisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Mais</h1>
        <p className="text-sm text-ink/60">Outras áreas do seu negócio</p>
      </div>

      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="flex items-center gap-3 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <link.Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{link.label}</p>
              <p className="text-sm text-ink/60">{link.description}</p>
            </div>
            <span className="shrink-0 text-ink/30">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}