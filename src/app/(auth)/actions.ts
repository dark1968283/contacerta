"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteURL } from "@/lib/site-url";

export type AuthActionState = {
  error: string | null;
  emailNotConfirmed?: boolean;
  email?: string;
};

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "Preencha nome, email e palavra-passe." };
  }
  if (password.length < 6) {
    return { error: "A palavra-passe deve ter pelo menos 6 caracteres." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${getSiteURL()}/auth/callback`,
    },
  });

  if (error) {
    return { error: traduzErroAuth(error.message) };
  }

  redirect(`/verificar-email?email=${encodeURIComponent(email)}`);
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Preencha email e palavra-passe." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return {
        error:
          "A sua conta ainda não foi ativada. Verifique o seu email e clique no link de confirmação antes de iniciar sessão.",
        emailNotConfirmed: true,
        email,
      };
    }
    return { error: traduzErroAuth(error.message) };
  }

  redirect("/dashboard");
}

export async function signInWithGoogle() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteURL()}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=google");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function traduzErroAuth(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "Email ou palavra-passe incorretos.";
  }
  if (message.includes("already registered")) {
    return "Já existe uma conta com este email.";
  }
  return "Não foi possível concluir. Tente novamente.";
}

export type ResetState = { error: string | null; sent?: boolean; email?: string };

/** Envia o email com o link para criar uma nova palavra-passe. */
export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Escreva o seu email." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteURL()}/auth/callback?next=/nova-senha`,
  });

  // Por segurança, não dizemos se o email existe ou não.
  if (error && /rate|too many|seconds/i.test(error.message)) {
    return { error: "Já pedimos um link há pouco. Espere um minuto e tente de novo." };
  }
  return { error: null, sent: true, email };
}

export type NewPasswordState = { error: string | null };

/** Guarda a nova palavra-passe (o utilizador entrou pelo link do email). */
export async function setNewPassword(_prev: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 6) return { error: "A palavra-passe deve ter pelo menos 6 caracteres." };
  if (password !== confirm) return { error: "As duas palavras-passe não são iguais." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "O link expirou. Peça um link novo." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (/different from the old|same/i.test(error.message)) {
      return { error: "Escolha uma palavra-passe diferente da antiga." };
    }
    return { error: traduzErroAuth(error.message) };
  }
  redirect("/dashboard?senha=nova");
}
