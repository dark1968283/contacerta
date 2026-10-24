import Link from "next/link";
import { MessageCircle, Phone, Plus, Search, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMT } from "@/lib/format";
import { whatsappNumber } from "@/lib/receipt";
import { LightGlass } from "@/components/ui/liquid-glass";
import { Panel } from "@/components/dashboard/Panel";
import { CustomerAvatar, CustomersHeader, CustomersShell, PRIMARY_LINK } from "./_components/CustomersUI";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { q?: string; filtro?: string };
}) {
  const supabase = createClient();
  const query = searchParams.q?.trim() ?? "";
  const onlyDebtors = searchParams.filtro === "devem";
  // Remove caracteres que alterariam o filtro do PostgREST.
  const safeQuery = query.replace(/[,()%*\\]/g, " ").trim();

  let customersQuery = supabase
    .from("customers")
    .select("id, name, phone")
    .order("name");

  if (safeQuery) {
    customersQuery = customersQuery.or(`name.ilike.%${safeQuery}%,phone.ilike.%${safeQuery}%`);
  }

  const [{ data: allCustomers }, { data: openDebts }] = await Promise.all([
    customersQuery,
    supabase.from("debts").select("customer_id, total_amount, amount_paid").in("status", ["pendente", "parcial", "vencida"]),
  ]);

  // Quanto cada cliente deve neste momento.
  const owed = new Map<string, number>();
  for (const d of openDebts ?? []) {
    const remaining = Math.max(0, Number(d.total_amount) - Number(d.amount_paid));
    if (remaining > 0) owed.set(d.customer_id, (owed.get(d.customer_id) ?? 0) + remaining);
  }
  const debtorsCount = (allCustomers ?? []).filter((c) => owed.has(c.id)).length;
  const customers = onlyDebtors ? (allCustomers ?? []).filter((c) => owed.has(c.id)) : allCustomers;

  const count = customers?.length ?? 0;
  const subtitle = query
    ? `${count} resultado${count === 1 ? "" : "s"} para “${query}”`
    : onlyDebtors
      ? `${count} cliente${count === 1 ? " deve" : "s devem"} dinheiro`
      : `${count} cliente${count === 1 ? "" : "s"} no total`;

  return (
    <CustomersShell>
      <CustomersHeader
        title="Clientes"
        subtitle={subtitle}
        action={
          <Link href="/dashboard/clientes/novo" className={PRIMARY_LINK}>
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" aria-hidden />
            Novo cliente
          </Link>
        }
      />

      <form className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-faint" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Pesquisar por nome ou telefone…"
          aria-label="Pesquisar cliente por nome ou telefone"
          enterKeyHint="search"
          className="w-full rounded-xl border border-dark-border bg-dark-surface py-3 pl-10 pr-4 text-base text-dark-text placeholder:text-dark-faint outline-none transition-all duration-200 [color-scheme:dark] focus:border-brandGlow/50 focus:ring-2 focus:ring-brandGlow/15"
        />
      </form>

      <LightGlass material="clear" refraction={10} dispersion={0.3}>
      <nav aria-label="Filtrar clientes" className="inline-flex gap-1 rounded-full border border-dark-border bg-white/[0.03] p-1">
        {[
          { key: "", label: "Todos" },
          { key: "devem", label: `Devem${debtorsCount ? ` · ${debtorsCount}` : ""}` },
        ].map((tab) => {
          const active = (tab.key === "devem") === onlyDebtors;
          const params = new URLSearchParams();
          if (query) params.set("q", query);
          if (tab.key) params.set("filtro", tab.key);
          const qs = params.toString();
          return (
            <Link
              key={tab.label}
              href={`/dashboard/clientes${qs ? `?${qs}` : ""}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active ? "bg-brand text-onbrand" : "text-dark-muted hover:text-dark-text"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      </LightGlass>

      {customers?.length === 0 && (
        <Panel className="px-6 py-10 text-center sm:py-14">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
            <Users className="h-5 w-5 text-dark-muted" aria-hidden />
          </span>
          <p className="mt-4 text-dark-muted">
            {onlyDebtors ? "Nenhum cliente lhe deve dinheiro." : query ? "Nenhum cliente encontrado." : "Ainda não há clientes."}
          </p>
          {!query && !onlyDebtors && (
            <Link
              href="/dashboard/clientes/novo"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-onbrand shadow-lg shadow-brand/20 transition-all hover:bg-brand/90 active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Criar primeiro cliente
            </Link>
          )}
        </Panel>
      )}

      <ul className="grid gap-3 xl:grid-cols-2">
        {customers?.map((customer) => {
          const debt = owed.get(customer.id) ?? 0;
          const wa = whatsappNumber(customer.phone);
          const tel = customer.phone?.replace(/[^\d+]/g, "");
          return (
            <li key={customer.id} className="min-w-0">
              <Panel as="div" className="p-3.5 sm:p-4">
                <div className="flex items-center gap-2">
                <Link
                  prefetch={false}
                  href={`/dashboard/clientes/${customer.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brandGlow/50"
                >
                  <CustomerAvatar name={customer.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-dark-text">{customer.name}</p>
                    {debt > 0 ? (
                      <p className="truncate text-sm font-semibold text-warning">Deve {formatMT(debt)}</p>
                    ) : (
                      customer.phone && <p className="truncate text-sm text-dark-muted">{customer.phone}</p>
                    )}
                  </div>
                </Link>
                {tel && (
                  <a
                    href={`tel:${tel}`}
                    aria-label={`Ligar a ${customer.name}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-dark-text transition hover:bg-white/[0.1] active:scale-95"
                  >
                    <Phone className="h-4 w-4" aria-hidden />
                  </a>
                )}
                {wa && (
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`WhatsApp de ${customer.name}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/[0.12] text-[#25D366] transition hover:bg-[#25D366]/[0.2] active:scale-95"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                  </a>
                )}
                </div>
              </Panel>
            </li>
          );
        })}
      </ul>
    </CustomersShell>
  );
}
