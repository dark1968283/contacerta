import { NextResponse, type NextRequest } from "next/server";
import { getPaysuitePayment, settlePaysuitePayment, verifyPaysuiteSignature } from "@/lib/paysuite";

export const dynamic = "force-dynamic";

/**
 * Webhook da PaySuite: "payment.success" activa o plano automaticamente.
 * 1. Verifica a assinatura X-Signature (HMAC-SHA256 com o segredo do webhook).
 * 2. Volta a perguntar à PaySuite o estado real do pagamento (não confia só
 *    no corpo recebido) e confere o valor antes de activar.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verifyPaysuiteSignature(raw, request.headers.get("x-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { id?: string } } = {};
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const id = event.data?.id;
  if (!id || !event.event?.startsWith("payment.")) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const remote = await getPaysuitePayment(id);
    const settled = await settlePaysuitePayment(remote);
    return NextResponse.json({ ok: true, ...settled });
  } catch (e) {
    // 500 faz a PaySuite tentar de novo mais tarde.
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
