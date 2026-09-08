import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-10 text-center">
      {icon && (
        <div className="mb-4 rounded-2xl bg-brand-soft p-4 text-brand">
          {icon}
        </div>
      )}

      <h3 className="text-base font-semibold text-ink">{title}</h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}