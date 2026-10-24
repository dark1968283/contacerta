import Link from "next/link";
import { Banknote, BarChart3, Bell, ChevronRight, Coins, FileText, LogOut, Settings, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { signOut } from "../../../(auth)/actions";
import { ThemeChooser } from "@/components/theme/ThemeToggle";
import {
  IconCustomers,
  IconPayments,
  IconPlan,
  IconProducts,
  IconSales,
  IconTeam,
  type NavIcon,
} from "@/components/icons/NavIcons";
import { BUSINESS_TIMEZONE } from "@/lib/timezone";

type Row = { href: string; label: string; hint?: string; Icon: NavIcon };

function RowLink({ href, label, hint, Icon }: Row) {
  return (
    <li>
      <Link
        href={href}
        className="flex min-h-[56px] items-center gap-3.5 px-4 py-3 transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none"
      >
        <Icon className="h-5 w-5 shrink-0 text-dark-muted" />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium text-dark-text">{label}</span>
          {hint && <span className="block truncate text-sm text-dark-muted">{hint}</span>}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-dark-faint" aria-hidden />
      </Link>
    </li>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-dark-faint">{title}</h2>
      <ul className="divide-y divide-dark-border overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
        {children}
      </ul>
    </section>
  );
}

const asNav = (Icon: typeof Settings): NavIcon =>
  function Wrapped({ className }) {
    return <Icon className={className} aria-hidden />;
  };

export default async function MaisPage() {
  const { businessId, businessName, role } = await getBusinessContext();
  const supabase = createClient();

  const [
    {
      data: { user },
    },
    { data: subscriptions },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("subscriptions")
      .select("status, current_period_end, plans(name)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const name =
    (typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    user?.email?.split("@")[0] ||
    "Utilizador";
  const avatar = typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : "";
  const sub = subscriptions?.[0];
  const planName = (sub?.plans as unknown as { name: string } | null)?.name ?? "Grátis";
  const renewal = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("pt-MZ", { day: "numeric", month: "long", timeZone: BUSINESS_TIMEZONE })
    : null;
  const isAdmin = role === "admin";

  return (
    <div className="-mx-4 -mt-5 -mb-6 min-h-[calc(100dvh-5rem)] bg-dark-bg px-4 pb-16 pt-6 text-dark-text shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-100vmax_-100vmax)] sm:-mx-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Mais</h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start lg:gap-8">
          {/* Coluna da conta */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <section className="rounded-2xl border border-dark-border bg-dark-surface p-5">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-dark-strong text-lg font-semibold text-dark-text">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    name.slice(0, 1).toUpperCase()
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">{name}</p>
                  <p className="truncate text-sm text-dark-muted">{user?.email}</p>
                  <p className="truncate text-sm text-dark-muted">{businessName}</p>
                </div>
              </div>

              <Link
                href="/dashboard/meu-plano"
                className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.07]"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">Plano {planName}</span>
                  <span className="block text-xs text-dark-muted">
                    {sub?.status === "active" && renewal ? `Renova a ${renewal}` : "Ver detalhes do plano"}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-dark-faint" aria-hidden />
              </Link>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  href="/dashboard/configuracoes"
                  className="flex items-center justify-center gap-2 rounded-xl border border-dark-border px-3 py-2.5 text-sm font-medium transition hover:bg-white/[0.04]"
                >
                  <Settings className="h-4 w-4" aria-hidden /> Perfil
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dark-border px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger/[0.06]"
                  >
                    <LogOut className="h-4 w-4" aria-hidden /> Sair
                  </button>
                </form>
              </div>
            </section>

            <section>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-dark-faint">Aparência</h2>
              <ThemeChooser />
            </section>
          </div>

          {/* Coluna das áreas */}
          <div className="space-y-6">
            <Group title="Negócio">
              <RowLink href="/dashboard/vendas" label="Histórico de vendas" hint="Todas as vendas e recibos" Icon={IconSales} />
              {isAdmin && (
                <RowLink href="/dashboard/relatorios" label="Relatórios" hint="Lucro do mês, mais vendidos, Excel e PDF" Icon={asNav(BarChart3)} />
              )}
              <RowLink href="/dashboard/despesas/nova" label="Gastei dinheiro" hint="Registar uma despesa agora" Icon={asNav(Banknote)} />
              <RowLink href="/dashboard/despesas" label="Despesas" hint="Ver o que gastou este mês" Icon={asNav(Wallet)} />
              <RowLink href="/dashboard/caixa" label="Contar a caixa" hint="Ver se o dinheiro do dia bate certo" Icon={asNav(Coins)} />
              <RowLink href="/dashboard/clientes" label="Clientes" hint="Contactos e quem lhe deve" Icon={IconCustomers} />
              {isAdmin && (
                <RowLink href="/dashboard/produtos/categorias" label="Categorias de produtos" hint="Organizar o catálogo" Icon={IconProducts} />
              )}
              <RowLink href="/dashboard/funcionarios" label="Funcionários" hint="Equipa e convites" Icon={IconTeam} />
            </Group>

            <Group title="Conta e assinatura">
              <RowLink href="/dashboard/meu-plano" label="Meu plano" hint={`Plano ${planName}`} Icon={IconPlan} />
              <RowLink href="/dashboard/planos" label="Mudar de plano" hint="Comparar preços e funcionalidades" Icon={asNav(ShieldCheck)} />
              <RowLink href="/dashboard/pagamentos" label="Pagamentos" hint="Pedidos e histórico" Icon={IconPayments} />
            </Group>

            <Group title="App">
              <RowLink href="/descarregar" label="Descarregar a app" hint="Android e iPhone, funciona sem internet" Icon={asNav(Smartphone)} />
              <RowLink href="/dashboard/configuracoes#avisos" label="Avisos no celular" hint="Resumo diário às 8h, stock e dívidas" Icon={asNav(Bell)} />
              <RowLink href="/termos-de-servico" label="Termos de serviço" Icon={asNav(FileText)} />
              <RowLink href="/politica-de-privacidade" label="Política de privacidade" Icon={asNav(FileText)} />
            </Group>
          </div>
        </div>
      </div>
    </div>
  );
}
