"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error: string | null };

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
    options: { data: { name } },
  });

  if (error) {
    return { error: traduzErroAuth(error.message) };
  }

  redirect("/onboarding");
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
    return { error: traduzErroAuth(error.message) };
  }

  redirect("/dashboard");
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
