"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Início" },
  { href: "/dashboard/vendas", label: "Vendas" },
  { href: "/dashboard/produtos", label: "Produtos" },
  { href: "/dashboard/clientes", label: "Clientes" },
  { href: "/dashboard/mais", label: "Mais" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-white">
      <div className="mx-auto flex max-w-app">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 py-3 text-center text-xs font-medium ${
                active ? "text-brand" : "text-ink/50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
