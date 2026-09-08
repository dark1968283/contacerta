import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./server";
export type UserRole = string;

export interface BusinessContext {
  userId: string;
  businessId: string;
  businessName: string;
  role: UserRole;
}

/**
 * Busca o negÃ³cio e papel do utilizador autenticado.
 * Envolvido em React.cache() para que mÃºltiplas pÃ¡ginas/layouts no mesmo
 * pedido sÃ³ disparem UMA query, mesmo chamando esta funÃ§Ã£o vÃ¡rias vezes.
 *
 * Redireciona automaticamente para /login (sem sessÃ£o) ou /onboarding
 * (sem negÃ³cio ainda) â€” por isso quem chama esta funÃ§Ã£o pode assumir
 * sempre que recebe um contexto vÃ¡lido de volta.
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
