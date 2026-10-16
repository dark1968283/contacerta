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
      "id,name,slug,description,monthly_price,yearly_price,currency,limits,features"
    )
    .eq("active", true)
    .neq("slug", "basico")
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
    <div className="-mx-4 -mt-5 -mb-6 min-h-[calc(100dvh-5rem)] bg-dark-bg px-4 pb-16 pt-5 shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-100vmax_-100vmax)] sm:-mx-6 sm:px-6"><div className="space-y-5">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-dark-muted transition-colors hover:text-brandGlow"
        >
          ← Início
        </Link>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-dark-text sm:text-[28px]">
          Planos
        </h1>

        <p className="mt-1 text-sm text-dark-muted">
          Escolha o plano ideal para o seu negócio.
        </p>
      </div>

      <PlanPicker
        plans={plans}
        error={searchParams.erro}
      />
      </div>
    </div>
  );
}
