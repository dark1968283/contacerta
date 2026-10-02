import Link from "next/link";
import { X } from "lucide-react";
import { NewCustomerForm } from "./NewCustomerForm";
import { CustomersHeader, CustomersShell, GHOST_LINK } from "../_components/CustomersUI";

export default function NovoClientePage() {
  return (
    <CustomersShell narrow>
      <CustomersHeader
        title="Novo cliente"
        subtitle="Adicione os dados do cliente para acompanhar compras e dívidas."
        action={
          <Link href="/dashboard/clientes" className={GHOST_LINK}>
            <X className="h-4 w-4" aria-hidden />
            Cancelar
          </Link>
        }
      />
      <NewCustomerForm />
    </CustomersShell>
  );
}
