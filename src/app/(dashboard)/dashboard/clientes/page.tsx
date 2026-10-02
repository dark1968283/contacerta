import Link from "next/link";
import { ChevronRight, Plus, Search, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Panel } from "@/components/dashboard/Panel";
import { CustomerAvatar, CustomersHeader, CustomersShell, PRIMARY_LINK } from "./_components/CustomersUI";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  const query = searchParams.q?.trim() ?? "";

  let customersQuery = supabase
    .from("customers")
    .select("id, name, phone")
    .order("name");

  if (query) {
    customersQuery = customersQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`);
  }

  const { data: customers } = await customersQuery;

  const count = customers?.length ?? 0;
  const subtitle = query
    ? `${count} resultado${count === 1 ? "" : "s"} para “${query}”`
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

      {customers?.length === 0 && (
        <Panel className="px-6 py-10 text-center sm:py-14">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
            <Users className="h-5 w-5 text-dark-muted" aria-hidden />
          </span>
          <p className="mt-4 text-dark-muted">{query ? "Nenhum cliente encontrado." : "Ainda não há clientes."}</p>
          {!query && (
            <Link
              href="/dashboard/clientes/novo"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand/90 active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Criar primeiro cliente
            </Link>
          )}
        </Panel>
      )}

      <ul className="grid gap-3 xl:grid-cols-2">
        {customers?.map((customer) => (
          <li key={customer.id} className="min-w-0">
            <Link
              href={`/dashboard/clientes/${customer.id}`}
              className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-brandGlow/50"
            >
              <Panel as="div" className="p-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 sm:p-4">
                <div className="flex items-center gap-3.5">
                  <CustomerAvatar name={customer.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-dark-text">{customer.name}</p>
                    {customer.phone && <p className="truncate text-sm text-dark-muted">{customer.phone}</p>}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-dark-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
                </div>
              </Panel>
            </Link>
          </li>
        ))}
      </ul>
    </CustomersShell>
  );
}
