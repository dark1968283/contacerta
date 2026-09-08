import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  icon?: ReactNode;
  description?: string;
  trend?: string;
  trendPositive?: boolean;
};

export function StatCard({
  label,
  value,
  icon,
  description,
  trend,
  trendPositive = true,
}: StatCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="metric-label">{label}</p>
          <p className="metric-value mt-1">{value}</p>
        </div>

        {icon && (
          <div className="rounded-xl bg-brand-soft p-2.5 text-brand">
            {icon}
          </div>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={
                trendPositive ? "text-brand font-medium" : "text-alert font-medium"
              }
            >
              {trend}
            </span>
          )}

          {description && (
            <span className="text-muted">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}