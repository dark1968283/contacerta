import Link from "next/link";

const links = [
  { href: "/dashboard/dividas", label: "Dívidas", description: "Acompanhe quem lhe deve e registe pagamentos" },
  { href: "/dashboard/planos", label: "Planos", description: "Veja os planos disponíveis do ContaCerta" },
  { href: "/dashboard/meu-plano", label: "Meu plano", description: "Estado da sua assinatura e limites" },
  { href: "/dashboard/pagamentos", label: "Pagamentos", description: "Histórico dos seus pedidos de pagamento" },
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
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center justify-between p-4"
          >
            <div>
              <p className="font-medium text-ink">{link.label}</p>
              <p className="text-sm text-ink/60">{link.description}</p>
            </div>
            <span className="text-ink/30">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
