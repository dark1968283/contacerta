"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { getSiteURL } from "@/lib/site-url";

export type EmployeeActionState = {
  error: string | null;
  success?: string | null;
};

async function requireAdminAndSubscription() {
  const context = await getBusinessContext();

  if (context.role !== "admin") {
    throw new Error("Apenas o administrador pode gerir funcionários.");
  }

  const supabase = createClient();
  const { data: active, error } = await supabase.rpc(
    "has_active_subscription",
    { p_business_id: context.businessId }
  );

  if (error || !active) {
    throw new Error(
      "É necessária uma assinatura activa para gerir funcionários."
    );
  }

  return { ...context, supabase };
}

export async function inviteEmployee(
  _previous: EmployeeActionState,
  formData: FormData
): Promise<EmployeeActionState> {
  let context: Awaited<ReturnType<typeof requireAdminAndSubscription>>;

  try {
    context = await requireAdminAndSubscription();
  } catch (error) {
    return {
      error: error instanceof Error
        ? error.message
        : "Não foi possível validar as permissões.",
    };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { error: "Introduza um endereço de email válido." };
  }

  const admin = createAdminClient() as any;

  // Expira convites vencidos antes de verificar duplicados.
  const { error: expireError } = await admin
    .from("employee_invites")
    .update({ status: "expired" })
    .eq("business_id", context.businessId)
    .eq("status", "pending")
    .lte("expires_at", new Date().toISOString());

  if (expireError) {
    return {
      error: "Não foi possível verificar os convites anteriores.",
    };
  }

  const { data: existingInvite, error: lookupError } = await admin
    .from("employee_invites")
    .select("id")
    .eq("business_id", context.businessId)
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (lookupError) {
    return { error: "Não foi possível verificar os convites existentes." };
  }

  if (existingInvite) {
    return { error: "Já existe um convite pendente para este email." };
  }

  // Não associamos silenciosamente contas já registadas.
  const { data: existingUser, error: userLookupError } = await admin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (userLookupError) {
    return { error: "Não foi possível validar a conta deste email." };
  }

  if (existingUser) {
    return {
      error:
        "Este email já tem uma conta. Por segurança, usa um email ainda não registado para o convite.",
    };
  }

  const { data: invite, error: insertError } = await admin
    .from("employee_invites")
    .insert({
      business_id: context.businessId,
      email,
      invited_by: context.userId,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !invite) {
    const dbMessage = insertError?.message ?? "";
    return {
      error: insertError?.code === "23505"
        ? "Já existe um convite pendente para este email."
        : dbMessage.includes("team_limit_reached")
          ? "O plano actual atingiu o limite de utilizadores e convites. Remova um convite pendente ou escolha outro plano."
          : dbMessage.includes("subscription_required")
            ? "A subscrição não permite convidar funcionários neste momento."
            : "Não foi possível criar o convite. Tente novamente.",
    };
  }

  const { error: authError } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo: `${getSiteURL()}/auth/callback`,
      data: {
        invitation_type: "employee",
        invited_business_id: context.businessId,
      },
    }
  );

  if (authError) {
    // Não deixa um convite pendente sem email enviado.
    await admin
      .from("employee_invites")
      .delete()
      .eq("id", invite.id);

    if (
      authError.message.toLowerCase().includes("already") ||
      authError.message.toLowerCase().includes("registered")
    ) {
      return {
        error:
          "O Supabase não aceitou o convite. O email pode já estar registado; verifica a conta antes de tentar novamente.",
      };
    }

    return {
      error:
        "Não foi possível enviar o convite. Confirme a configuração de email do Supabase Auth e tente novamente.",
    };
  }

  revalidatePath("/dashboard/funcionarios");

  return {
    error: null,
    success: `Convite enviado para ${email}.`,
  };
}

export async function removeEmployee(formData: FormData) {
  const userId = String(formData.get("userId") ?? "").trim();

  if (!userId) return;

  let context: Awaited<ReturnType<typeof requireAdminAndSubscription>>;

  try {
    context = await requireAdminAndSubscription();
  } catch {
    return;
  }

  if (userId === context.userId) return;

  // A eliminação usa o cliente normal para que as políticas RLS
  // da tabela business_users continuem a ser aplicadas.
  const { error } = await context.supabase
    .from("business_users")
    .delete()
    .eq("business_id", context.businessId)
    .eq("user_id", userId)
    .eq("role", "funcionario");

  if (!error) {
    revalidatePath("/dashboard/funcionarios");
  }
}

export async function cancelEmployeeInvite(formData: FormData) {
  const inviteId = String(formData.get("inviteId") ?? "").trim();

  if (!inviteId) return;

  let context: Awaited<ReturnType<typeof requireAdminAndSubscription>>;

  try {
    context = await requireAdminAndSubscription();
  } catch {
    return;
  }

  const admin = createAdminClient() as any;

  const { error } = await admin
    .from("employee_invites")
    .update({ status: "cancelled" })
    .eq("id", inviteId)
    .eq("business_id", context.businessId)
    .eq("status", "pending");

  if (!error) {
    revalidatePath("/dashboard/funcionarios");
  }
}
