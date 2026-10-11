"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateProfileName(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 2 || name.length > 80) {
    return { error: "O nome deve ter entre 2 e 80 caracteres." };
  }

  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "A sessão expirou. Entre novamente na sua conta." };
  }

  const { error } = await supabase.auth.updateUser({
    data: { full_name: name },
  });

  if (error) {
    return { error: "Não foi possível guardar o nome. Tente novamente." };
  }

  return { success: "Nome actualizado com sucesso." };
}
