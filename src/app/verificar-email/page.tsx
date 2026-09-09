import Link from "next/link";
import { ResendConfirmationButton } from "@/components/auth/ResendConfirmationButton";

export default function VerificarEmailPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams.email ?? "";

  return (
    <main className="mx-auto flex min-h-dvh max-w-app flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-2xl">
          ✉️
        </div>
        <h1 className="text-2xl font-semibold text-ink">Confirme o seu email</h1>
        <p className="mt-3 text-ink/70">
          A sua conta foi criada com sucesso. Enviámos um link de confirmação
          para o seu endereço de email. Abra o seu email e clique no link
          para ativar a sua conta.
        </p>
        {email && (
          <p className="mt-3 text-sm text-ink/60">
            Enviámos um email de confirmação para:
            <br />
            <span className="font-medium text-ink">{email}</span>
          </p>
        )}
      </div>

      <div className="mb-8 rounded-xl border border-line bg-white p-4 text-sm text-ink/60">
        <p className="mb-2 font-medium text-ink/80">Se não encontrar o email:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Verifique a pasta Spam ou Lixo Eletrónico.</li>
          <li>Aguarde alguns minutos.</li>
          <li>Confirme que escreveu o email corretamente.</li>
        </ul>
      </div>

      <div className="space-y-3">
        {email ? (
          <ResendConfirmationButton email={email} />
        ) : (
          <p className="text-center text-sm text-ink/50">
            Não sabemos qual foi o email usado — volte a criar a conta ou
            tente iniciar sessão para reenviar a confirmação.
          </p>
        )}

        <Link
          href="/login"
          className="block w-full rounded-xl border border-line py-3.5 text-center text-base font-medium text-ink/70"
        >
          Voltar para iniciar sessão
        </Link>
      </div>
    </main>
  );
}
