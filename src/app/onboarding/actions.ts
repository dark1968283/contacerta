"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "../(auth)/actions";

export async function createBusiness(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Dê um nome ao seu negócio." };
  }

  const supabase = createClient();

  // Toda a lógica (criar business + associar admin) corre atomicamente
  // dentro da função Postgres — nunca dois inserts separados aqui.
  const { error } = await supabase.rpc("create_business_with_admin", {
    p_name: name,
  });

  if (error) {
    return { error: "Não foi possível criar o negócio. Tente novamente." };
  }

  redirect("/dashboard");
}
