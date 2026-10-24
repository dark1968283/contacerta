import { Bus, Home, Lightbulb, MoreHorizontal, Smartphone, Users, type LucideIcon } from "lucide-react";

/** Em que se gastou o dinheiro. As mesmas chaves que a tabela expenses (migração 0025). */
export const EXPENSE_CATEGORIES: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: "renda", label: "Renda", Icon: Home },
  { key: "luz_agua", label: "Luz e água", Icon: Lightbulb },
  { key: "transporte", label: "Transporte", Icon: Bus },
  { key: "salarios", label: "Salários", Icon: Users },
  { key: "credito_megas", label: "Crédito e megas", Icon: Smartphone },
  { key: "outro", label: "Outro", Icon: MoreHorizontal },
];

export function expenseCategory(key: string) {
  return EXPENSE_CATEGORIES.find((c) => c.key === key) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]!;
}

export type ExpenseRow = {
  id: string;
  category: string;
  amount: number | string;
  note: string | null;
  spent_at: string;
  created_by: string;
};
