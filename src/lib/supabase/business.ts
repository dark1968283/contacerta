import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./server";
import type { UserRole } from "@/lib/types/database.types";

export interface BusinessContext {
  userId: string;
  businessId: string;
  businessName: string;
  role: UserRole;
}

/**
 * Busca o negócio e papel do utilizador autenticado.
 * Envolvido em React.cache() para que múltiplas páginas/layouts no mesmo
 * pedido só disparem UMA query, mesmo chamando esta função várias vezes.
 *
 * Redireciona automaticamente para /login (sem sessão) ou /onboarding
 * (sem negócio ainda) — por isso quem chama esta função pode assumir
 * sempre que recebe um contexto válido de volta.
 */
export const getBusinessContext = cache(async (): Promise<BusinessContext> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("business_users")
    .select("business_id, role, businesses(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  return {
    userId: user.id,
    businessId: membership.business_id,
    role: membership.role,
    businessName:
      (membership.businesses as unknown as { name: string } | null)?.name ?? "ContaCerta",
  };
});
