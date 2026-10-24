import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Link de "Esqueci a palavra-passe": vai directo criar a nova.
      if (searchParams.get("next") === "/nova-senha") {
        return NextResponse.redirect(`${origin}/nova-senha`);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: invitedBusinessId, error: inviteError } =
          await supabase.rpc("accept_pending_employee_invite");

        if (!inviteError && invitedBusinessId) {
          return NextResponse.redirect(`${origin}/dashboard`);
        }

        const expectedInviteErrors = [
          "valid_invite_not_found",
          "user_already_has_business",
        ];

        const isExpectedError =
          !!inviteError &&
          expectedInviteErrors.some((message) =>
            inviteError.message.includes(message)
          );

        if (inviteError && !isExpectedError) {
          console.error(
            "[auth/callback] Falha na aceitação do convite:",
            inviteError.message
          );

          return NextResponse.redirect(
            `${origin}/login?error=invite`
          );
        }

        const { data: membership, error: membershipError } = await supabase
          .from("business_users")
          .select("business_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (membershipError) {
          console.error(
            "[auth/callback] Falha ao verificar associação:",
            membershipError.message
          );
          return NextResponse.redirect(`${origin}/login?error=invite`);
        }

        return NextResponse.redirect(
          `${origin}${membership ? "/dashboard" : "/onboarding"}`
        );
      }
    }
  }

  if (searchParams.get("next") === "/nova-senha") {
    return NextResponse.redirect(`${origin}/esqueci-senha?expirado=1`);
  }
  return NextResponse.redirect(`${origin}/login`);
}
