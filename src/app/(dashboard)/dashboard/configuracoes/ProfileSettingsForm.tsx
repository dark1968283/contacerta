"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Camera,
  Check,
  LoaderCircle,
  Save,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProfileName } from "./actions";

type Props = {
  initialName: string;
  email: string;
  initialAvatarUrl: string;
};

export function ProfileSettingsForm({
  initialName,
  email,
  initialAvatarUrl,
}: Props) {
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const displayedAvatar = previewUrl || avatarUrl;

  function choosePhoto(file?: File) {
    setMessage("");
    setErrorMessage("");

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMessage("Escolha uma imagem JPG, PNG ou WebP.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage("A imagem deve ter no máximo 3 MB.");
      return;
    }

    setSelectedFile(file);
  }

  async function saveProfile() {
    setMessage("");
    setErrorMessage("");

    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 80) {
      setErrorMessage("O nome deve ter entre 2 e 80 caracteres.");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setErrorMessage("A sessão expirou. Entre novamente na sua conta.");
        return;
      }

      let nextAvatarUrl = avatarUrl;

      if (selectedFile) {
        const extension =
          selectedFile.type === "image/png"
            ? "png"
            : selectedFile.type === "image/webp"
              ? "webp"
              : "jpg";

        const path = `${user.id}/avatar.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, selectedFile, {
            upsert: true,
            contentType: selectedFile.type,
            cacheControl: "3600",
          });

        if (uploadError) {
          setErrorMessage(
            uploadError.message.includes("Bucket not found")
              ? "O armazenamento de fotografias ainda não foi configurado no Supabase."
              : "Não foi possível carregar a fotografia. Verifique o armazenamento e tente novamente."
          );
          return;
        }

        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        nextAvatarUrl = `${data.publicUrl}?v=${Date.now()}`;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: cleanName,
          avatar_url: nextAvatarUrl || null,
        },
      });

      if (updateError) {
        setErrorMessage("A imagem foi carregada, mas não foi possível guardar o perfil.");
        return;
      }

      setAvatarUrl(nextAvatarUrl);
      setSelectedFile(null);
      setMessage("Perfil actualizado com sucesso.");
      window.location.reload();
    } catch {
      setErrorMessage("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-dark-border bg-dark-surface p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brandGlow/15 bg-brandGlow/10 text-brandGlow">
            <UserRound size={20} aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold text-dark-text">Perfil pessoal</h2>
            <p className="mt-0.5 text-sm text-dark-muted">
              Nome e fotografia apresentados na sua conta.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col items-center gap-4 rounded-2xl border border-dark-border bg-dark-bg/60 p-5 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dark-border bg-dark-elevated">
            {displayedAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayedAvatar}
                alt="Pré-visualização da fotografia de perfil"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-10 w-10 text-dark-muted" aria-hidden />
            )}
          </div>

          <div className="text-center sm:text-left">
            <p className="font-medium text-dark-text">Fotografia de perfil</p>
            <p className="mt-1 text-xs leading-5 text-dark-muted">
              JPG, PNG ou WebP. Tamanho máximo de 3 MB.
            </p>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-dark-border bg-dark-elevated px-4 py-2 text-sm font-medium text-dark-text transition hover:border-brandGlow/40 hover:bg-white/5"
            >
              <Camera size={16} aria-hidden />
              {selectedFile || avatarUrl ? "Trocar fotografia" : "Adicionar fotografia"}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => choosePhoto(event.target.files?.[0])}
            />
            {selectedFile && (
              <p className="mt-2 max-w-full break-all text-xs text-brandGlow">
                Nova imagem: {selectedFile.name}
              </p>
            )}
          </div>
        </div>

        <div className="mt-7 space-y-5">
          <div>
            <label htmlFor="profile-name" className="mb-2 block text-sm font-medium text-dark-text">
              Nome
            </label>
            <input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={80}
              autoComplete="name"
              required
              className="min-h-12 w-full rounded-xl border border-dark-border bg-dark-bg px-4 text-base text-dark-text outline-none transition placeholder:text-dark-faint focus:border-brandGlow/60 focus:ring-2 focus:ring-brandGlow/10"
              placeholder="O seu nome"
            />
          </div>

          <div>
            <label htmlFor="profile-email" className="mb-2 block text-sm font-medium text-dark-text">
              Email da conta
            </label>
            <input
              id="profile-email"
              value={email}
              readOnly
              className="min-h-12 w-full cursor-not-allowed rounded-xl border border-dark-border bg-dark-bg/60 px-4 text-base text-dark-muted outline-none"
            />
            <p className="mt-2 text-xs leading-5 text-dark-muted">
              O email é apenas de consulta nesta versão.
            </p>
          </div>
        </div>

        {(message || errorMessage) && (
          <div
            role="status"
            className={`mt-5 rounded-xl border p-3 text-sm ${
              errorMessage
                ? "border-red-400/20 bg-red-400/10 text-red-200"
                : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
            }`}
          >
            {errorMessage || message}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-dark-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-dark-muted">
            As alterações aplicam-se à sua conta pessoal.
          </p>
          <button
            type="button"
            disabled={isSaving || isPending}
            onClick={saveProfile}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brandGlow px-5 py-3 text-sm font-semibold text-dark-bg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSaving || isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            Guardar alterações
          </button>
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-dark-border bg-dark-surface/60 p-4">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brandGlow" aria-hidden />
        <p className="text-xs leading-5 text-dark-muted">
          O nome e a fotografia pertencem à sua conta de utilizador, não ao nome do negócio.
        </p>
      </div>
    </div>
  );
}
