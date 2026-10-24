import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "./ProfileSettingsForm";
import { InstallAppCard } from "@/components/pwa/InstallAppCard";
import { ThemeChooser } from "@/components/theme/ThemeToggle";

export default async function ConfiguracoesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const initialName =
    (typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "") ||
    user?.email?.split("@")[0] ||
    "";

  const avatarUrl =
    typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : "";

  return (
    <div className="-mx-4 -mt-5 -mb-6 min-h-[calc(100dvh-5rem)] bg-dark-bg px-4 pb-16 pt-6 text-dark-text shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-100vmax_-100vmax)] sm:-mx-6 sm:px-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brandGlow">
          A sua conta
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-dark-text sm:text-3xl">
          Configurações
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-dark-muted">
          Personalize o seu perfil. As alterações ficam associadas à sua conta.
        </p>
      </header>

      <section aria-labelledby="aparencia-title" className="mt-6 rounded-2xl border border-dark-border bg-dark-surface p-4 sm:p-5">
        <h2 id="aparencia-title" className="text-base font-semibold text-dark-text">
          Aparência
        </h2>
        <p className="mt-1 text-sm text-dark-muted">
          Claro é melhor ao sol; escuro poupa bateria à noite. “Automático” segue o telemóvel.
        </p>
        <div className="mt-4 max-w-md">
          <ThemeChooser />
        </div>
      </section>

      <div className="mt-6">
        <InstallAppCard />
      </div>

      <ProfileSettingsForm
        initialName={initialName}
        email={user?.email ?? ""}
        initialAvatarUrl={avatarUrl}
      />
    </div>
  );
}
