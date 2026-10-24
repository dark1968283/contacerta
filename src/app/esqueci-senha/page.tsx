import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "Recuperar palavra-passe · ContaCerta" };

export default function EsqueciSenhaPage({ searchParams }: { searchParams: { expirado?: string } }) {
  return (
    <AuthCard title="Esqueceu a palavra-passe?" subtitle="Escreva o email da sua conta. Enviamos um link para criar uma nova.">
      <ResetForm expired={searchParams.expirado === "1"} />
    </AuthCard>
  );
}
