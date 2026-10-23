import { UsersRound, UserPlus, Clock3, ShieldCheck } from "lucide-react";
import { getBusinessContext } from "@/lib/supabase/business";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { InviteEmployeeForm } from "./InviteEmployeeForm";
import { removeEmployee, cancelEmployeeInvite } from "./actions";

export const dynamic = "force-dynamic";

type Member = {
  user_id: string;
  role: string;
  created_at: string;
  users: { name: string; email: string } | null;
};

type Invite = {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  status: string;
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function FuncionariosPage() {
  const context = await getBusinessContext();
  const supabase = createClient();
  const isAdmin = context.role === "admin";

  const { data: rawMembers } = await supabase
    .from("business_users")
    .select("user_id, role, created_at, users(name, email)")
    .eq("business_id", context.businessId)
    .order("created_at", { ascending: true });

  const members = (rawMembers ?? []) as unknown as Member[];

  let invites: Invite[] = [];
  let inviteReadError = false;

  if (isAdmin) {
    try {
      const admin = createAdminClient() as any;
      const { data, error } = await admin
        .from("employee_invites")
        .select("id, email, created_at, expires_at, status")
        .eq("business_id", context.businessId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        inviteReadError = true;
      } else {
        invites = (data ?? []) as Invite[];
      }
    } catch {
      inviteReadError = true;
    }
  }

  const employees = members.filter((member) => member.role === "funcionario");
  const admins = members.filter((member) => member.role === "admin");

  return (
    <div className="-mx-4 -mt-5 -mb-6 min-h-[calc(100dvh-5rem)] bg-dark-bg px-4 pb-16 pt-6 text-dark-text shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-100vmax_-100vmax)] sm:-mx-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-brandGlow/20 bg-brandGlow/10 text-brandGlow">
            <UsersRound size={22} aria-hidden="true" />
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brandGlow">
            Gestão do negócio
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Funcionários
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-dark-muted">
            Controle quem tem acesso ao {context.businessName} e acompanhe
            os convites enviados à sua equipa.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-dark-border bg-dark-surface p-4 sm:p-5">
            <p className="text-sm text-dark-muted">Funcionários</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {employees.length}
            </p>
          </div>
          <div className="rounded-2xl border border-dark-border bg-dark-surface p-4 sm:p-5">
            <p className="text-sm text-dark-muted">Administradores</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {admins.length}
            </p>
          </div>
        </div>

        {isAdmin ? (
          <section className="space-y-4 rounded-2xl border border-dark-border bg-dark-surface p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brandGlow/20 bg-brandGlow/10 text-brandGlow">
                <UserPlus size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold">Convidar funcionário</h2>
                <p className="mt-1 text-sm leading-5 text-dark-muted">
                  Envie um convite para o email de alguém que ainda não tem
                  conta no ContaCerta.
                </p>
              </div>
            </div>

            <InviteEmployeeForm />
          </section>
        ) : (
          <section className="rounded-2xl border border-dark-border bg-dark-surface p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="mt-0.5 text-brandGlow" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">Acesso de funcionário</h2>
                <p className="mt-1 text-sm leading-6 text-dark-muted">
                  Pode consultar a equipa. Apenas um administrador pode
                  enviar convites ou remover funcionários.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Equipa actual</h2>
            <p className="mt-1 text-sm text-dark-muted">
              Pessoas associadas a este negócio.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
            {members.length === 0 ? (
              <p className="p-5 text-sm text-dark-muted">
                Não foi possível carregar os membros da equipa.
              </p>
            ) : (
              <ul className="divide-y divide-dark-border">
                {members.map((member) => {
                  const isSelf = member.user_id === context.userId;
                  const name = member.users?.name?.trim() || "Utilizador";
                  const email = member.users?.email || "Email indisponível";

                  return (
                    <li key={member.user_id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dark-border bg-dark-elevated text-sm font-semibold text-brandGlow">
                          {name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {name}{isSelf ? " (você)" : ""}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-dark-muted">
                            {email}
                          </p>
                          <p className="mt-1 text-xs text-dark-faint">
                            Desde {dateLabel(member.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className="rounded-full border border-dark-border px-3 py-1 text-xs text-dark-muted">
                          {member.role === "admin" ? "Administrador" : "Funcionário"}
                        </span>

                        {isAdmin && member.role === "funcionario" && (
                          <form action={removeEmployee}>
                            <input type="hidden" name="userId" value={member.user_id} />
                            <button
                              type="submit"
                              className="rounded-lg px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-400/10"
                            >
                              Remover
                            </button>
                          </form>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {isAdmin && (
          <section className="space-y-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Clock3 size={18} className="text-brandGlow" aria-hidden="true" />
                Convites pendentes
              </h2>
              <p className="mt-1 text-sm text-dark-muted">
                Convites ainda à espera de serem aceites.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
              {inviteReadError ? (
                <p className="p-5 text-sm text-dark-muted">
                  Não foi possível carregar os convites. Confirme a configuração
                  da chave de serviço no servidor.
                </p>
              ) : invites.length === 0 ? (
                <p className="p-5 text-sm text-dark-muted">
                  Não existem convites pendentes.
                </p>
              ) : (
                <ul className="divide-y divide-dark-border">
                  {invites.map((invite) => (
                    <li key={invite.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                      <div className="min-w-0">
                        <p className="break-all text-sm font-medium">{invite.email}</p>
                        <p className="mt-1 text-xs text-dark-muted">
                          Enviado em {dateLabel(invite.created_at)} · Expira em {dateLabel(invite.expires_at)}
                        </p>
                      </div>
                      <form action={cancelEmployeeInvite}>
                        <input type="hidden" name="inviteId" value={invite.id} />
                        <button
                          type="submit"
                          className="self-start rounded-lg px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-400/10 sm:self-auto"
                        >
                          Cancelar convite
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
