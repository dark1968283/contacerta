import Link from "next/link";
import {
  ArrowUpRight,
  CreditCard,
  Layers3,
  Sparkles,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const sections: {
  title: string;
  description: string;
  links: {
    href: string;
    label: string;
    description: string;
    Icon: LucideIcon;
    accent: string;
  }[];
}[] = [
  {
    title: "Negócio",
    description: "Organize a relação com os seus clientes.",
    links: [
      {
        href: "/dashboard/clientes",
        label: "Clientes",
        description: "Consulte, registe e acompanhe os seus clientes.",
        Icon: Users,
        accent: "text-sky-300 bg-sky-400/10 border-sky-400/15",
      },
      {
        href: "/dashboard/funcionarios",
        label: "Funcionários",
        description: "Consulte a equipa e gira os convites de acesso.",
        Icon: UsersRound,
        accent: "text-emerald-300 bg-emerald-400/10 border-emerald-400/15",
      },
    ],
  },
  {
    title: "Conta e assinatura",
    description: "Consulte os planos e acompanhe a sua subscrição.",
    links: [
      {
        href: "/dashboard/planos",
        label: "Planos disponíveis",
        description: "Compare opções e escolha o plano adequado.",
        Icon: Sparkles,
        accent: "text-brandGlow bg-brandGlow/10 border-brandGlow/15",
      },
      {
        href: "/dashboard/meu-plano",
        label: "Meu plano",
        description: "Estado da assinatura, renovação e limites.",
        Icon: Wallet,
        accent: "text-violet-300 bg-violet-400/10 border-violet-400/15",
      },
      {
        href: "/dashboard/pagamentos",
        label: "Pagamentos",
        description: "Consulte os pedidos e o estado da confirmação.",
        Icon: CreditCard,
        accent: "text-amber-300 bg-amber-400/10 border-amber-400/15",
      },
    ],
  },
];

export default function MaisPage() {
  return (
    <div className="-mx-4 -mt-5 -mb-6 min-h-[calc(100dvh-5rem)] bg-dark-bg px-4 pb-16 pt-6 text-dark-text shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-100vmax_-100vmax)] sm:-mx-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-brandGlow/20 bg-brandGlow/10 text-brandGlow">
            <Layers3 size={22} />
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brandGlow">
            ContaCerta
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Plataforma
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-dark-muted">
            Aceda às ferramentas do seu negócio e gira a sua conta num só
            lugar, de forma simples e organizada.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          {sections.map((section) => (
            <section key={section.title} className="space-y-4">
              <div>
                <h2 className="text-base font-semibold">{section.title}</h2>
                <p className="mt-1 text-sm leading-5 text-dark-muted">
                  {section.description}
                </p>
              </div>

              <div className="space-y-3">
                {section.links.map(({ href, label, description, Icon, accent }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex min-h-[104px] items-center gap-4 rounded-2xl border border-dark-border bg-dark-surface p-4 transition duration-200 hover:border-brandGlow/35 hover:bg-dark-elevated sm:p-5"
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${accent}`}
                    >
                      <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-dark-text">
                        {label}
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-dark-muted">
                        {description}
                      </span>
                    </span>

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-dark-faint transition group-hover:bg-brandGlow/10 group-hover:text-brandGlow">
                      <ArrowUpRight size={18} />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-dark-border bg-dark-surface/70 p-4 sm:p-5">
          <div className="rounded-xl border border-brandGlow/15 bg-brandGlow/10 p-2 text-brandGlow">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-sm font-medium">O seu negócio. Sob controlo.</p>
            <p className="mt-1 text-sm leading-5 text-dark-muted">
              O ContaCerta reúne as ferramentas essenciais para acompanhar o
              seu negócio, com uma experiência simples e organizada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
