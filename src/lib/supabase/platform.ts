import { redirect } from "next/navigation";
import { createClient } from "./server";

export async function requirePlatformAdmin() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("is_platform_admin");
  if (error || !data) redirect("/dashboard");
  return supabase;
}
