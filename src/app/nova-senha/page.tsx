import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "@/components/auth/AuthCard";
import { NewPasswordForm } from "./NewPasswordForm";

export const metadata: Metadata = { title: "Nova palavra-passe · ContaCerta" };

/** Só se chega aqui pelo link do email (que já abre a sessão). */
export default async function NovaSenhaPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/esqueci-senha?expirado=1");

  return (
    <AuthCard title="Crie a nova palavra-passe" subtitle={<>Conta: <span className="font-medium text-dark-text">{user.email}</span></>}>
      <NewPasswordForm />
    </AuthCard>
  );
}
