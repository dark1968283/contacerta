import { NewCustomerForm } from "./NewCustomerForm";

export default function NovoClientePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">Novo cliente</h1>
      <NewCustomerForm />
    </div>
  );
}
