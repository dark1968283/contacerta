import { createPrivateKey, sign } from "node:crypto";

/**
 * Envio de Web Push sem bibliotecas externas.
 *
 * Enviamos um "toque" sem conteúdo (corpo vazio): o celular acorda o
 * service worker, que vai buscar a mensagem certa a /api/push/mensagem com
 * a sessão da pessoa. Assim não é preciso cifrar dados no servidor e a
 * mensagem é sempre a mais actual.
 *
 * Variáveis necessárias (Vercel → Settings → Environment Variables):
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  chave pública (base64url, 65 bytes)
 *   VAPID_PRIVATE_KEY             chave privada (base64url, 32 bytes) — segredo
 *   VAPID_SUBJECT                 ex.: mailto:suporte@contacertamz.site
 */

function b64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function fromB64url(value: string) {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function pushConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function vapidHeader(endpoint: string) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const privateKey = process.env.VAPID_PRIVATE_KEY!;
  const subject = process.env.VAPID_SUBJECT || "mailto:fernandoorlandobanda@gmail.com";

  const pub = fromB64url(publicKey);
  const key = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      x: b64url(pub.subarray(1, 33)),
      y: b64url(pub.subarray(33, 65)),
      d: privateKey,
    },
    format: "jwk",
  });

  const header = b64url(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const payload = b64url(
    JSON.stringify({
      aud: new URL(endpoint).origin,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
      sub: subject,
    }),
  );
  const data = `${header}.${payload}`;
  const signature = sign("sha256", Buffer.from(data), { key, dsaEncoding: "ieee-p1363" });
  return `vapid t=${data}.${b64url(signature)}, k=${publicKey}`;
}

/**
 * Envia um toque a uma subscrição. Devolve "gone" quando o celular já
 * não aceita notificações (app desinstalada / permissão retirada), para a
 * apagarmos da base de dados.
 */
export async function sendPushTick(endpoint: string): Promise<"ok" | "gone" | "error"> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: vapidHeader(endpoint),
        TTL: String(12 * 60 * 60),
        Urgency: "normal",
        "Content-Length": "0",
      },
    });
    if (res.status === 404 || res.status === 410) return "gone";
    return res.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}
