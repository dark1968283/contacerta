import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Clientes</h1>
        <Link href="/dashboard/clientes/novo" className="text-sm font-medium text-brand">
          + Novo
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Pesquisar por nome ou telefone…"
          className="input-field"
        />
      </form>

      <div className="space-y-2">
        {customers?.length === 0 && (
          <p className="py-8 text-center text-ink/50">
            {query ? "Nenhum cliente encontrado." : "Ainda não há clientes."}
          </p>
        )}

        {customers?.map((customer) => (
          <Link
            key={customer.id}
            href={`/dashboard/clientes/${customer.id}`}
            className="flex items-center justify-between rounded-xl border border-line bg-white p-4"
          >
            <div>
              <p className="font-medium text-ink">{customer.name}</p>
              {customer.phone && <p className="text-sm text-ink/60">{customer.phone}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
