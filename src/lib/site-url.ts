import { headers } from "next/headers";

/**
 * Deduz a origem (protocolo + host) do pedido atual, para usar em
 * emailRedirectTo e noutros sítios que precisem de uma URL absoluta.
 * Nunca hardcoda localhost — funciona em dev e produção da mesma forma.
 */
export function getSiteURL(): string {
  const h = headers();

  const origin = h.get("origin");
  if (origin) return origin;

  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;

  // Último recurso, só se nenhum header estiver disponível (não deveria
  // acontecer num pedido real de browser). Opcional em .env.local.
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
