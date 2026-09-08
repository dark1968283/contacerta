import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database.types";

/**
 * Cliente Supabase para Server Components, Route Handlers e Server Actions.
 * Usa a sessão do utilizador via cookies — nunca a service role key aqui.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado a partir de um Server Component — o middleware
            // já trata da renovação de sessão, por isso é seguro ignorar.
          }
        },
      },
    }
  );
}

/**
 * Cliente com a service role key — SÓ para uso em contexto de servidor
 * que precise de ignorar RLS deliberadamente (ex.: webhooks do Zenofy na Fase 8).
 * NUNCA importar este ficheiro num Client Component.
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}
