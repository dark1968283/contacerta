import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Chamado pelo Supabase depois do utilizador clicar no link de
 * confirmação do email (emailRedirectTo aponta para aqui).
 * Troca o "code" da URL por uma sessão real e manda o utilizador para
 * o sítio certo: onboarding se ainda não tem negócio, dashboard se já tem.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: membership } = await supabase
          .from("business_users")
          .select("business_id")
          .eq("user_id", user.id)
          .maybeSingle();

        return NextResponse.redirect(
          `${origin}${membership ? "/dashboard" : "/onboarding"}`
        );
      }
    }
  }

  // Link inválido, expirado, ou já usado — volta ao login sem sessão.
  return NextResponse.redirect(`${origin}/login`);
}
