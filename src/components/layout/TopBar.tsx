import type { ReactNode } from "react";
import { Logo } from "./Logo";

type TopBarProps = {
  businessName: string;
  /** Slot à direita — o layout passa aqui o <form action={signOut}> existente. */
  children?: ReactNode;
};

/**
 * Barra superior flutuante (mesmo visual da DesktopNav actual). Não renderiza
 * <h1>: cada página já tem o seu próprio título.
 */
export function TopBar({ businessName, children }: TopBarProps) {
  return (
    <div className="sticky top-0 z-20 px-4 pt-4 sm:px-6">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-dark-border bg-dark-surface/95 px-3 py-2.5 shadow-xl shadow-black/30 backdrop-blur sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Logo showText={false} className="md:hidden" />
          <span className="truncate text-sm font-semibold text-dark-text">{businessName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      </div>
    </div>
  );
}
