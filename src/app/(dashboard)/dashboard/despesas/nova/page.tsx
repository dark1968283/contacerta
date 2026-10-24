import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExpenseForm } from "./ExpenseForm";

export const metadata = { title: "Gastei dinheiro · ContaCerta" };

export default function NovaDespesaPage() {
  return (
    <div className="mx-auto max-w-md space-y-5 pb-10 text-dark-text">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-dark-muted hover:text-dark-text">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Início
      </Link>
      <h1 className="text-2xl font-semibold">Gastei dinheiro</h1>
      <ExpenseForm />
    </div>
  );
}
