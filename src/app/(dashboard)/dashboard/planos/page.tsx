import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PlanPicker } from "./PlanPicker";

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const { data } = await supabase
    .from("plans")
    .select(
      "id,name,description,monthly_price,yearly_price,currency,limits,features"
    )
    .eq("active", true)
    .order("display_order");

  const plans = (data ?? []).map((p) => ({
    ...p,
    limits:
      p.limits &&
      typeof p.limits === "object" &&
      !Array.isArray(p.limits)
        ? (p.limits as Record<string, unknown>)
        : {},
    features: Array.isArray(p.features)
      ? p.features.filter(
          (f): f is string => typeof f === "string"
        )
      : [],
  }));

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-ink/60"
        >
          ← Início
        </Link>

        <h1 className="mt-2 text-xl font-semibold text-ink">
          Planos
        </h1>

        <p className="mt-1 text-sm text-ink/60">
          Escolha o plano ideal para o seu negócio.
        </p>
      </div>

      <PlanPicker
        plans={plans}
        error={searchParams.erro}
      />
    </div>
  );
}
