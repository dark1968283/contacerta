"use client";

import { useState } from "react";
import Link from "next/link";
import { formatMT } from "@/lib/format";

export function normalizeMozambiquePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("258")) return digits;
  if (digits.length === 9) return `258${digits}`;
  return null;
}

export function DebtReminder({ customerId, customerName, phone, remaining }: { customerId: string; customerName: string; phone: string | null; remaining: number }) {
  const normalizedPhone = phone ? normalizeMozambiquePhone(phone) : null;
  const initialMessage = `Olá ${customerName} 👋\n\nEste é um lembrete sobre o valor de ${formatMT(remaining)} que está pendente na sua conta.\n\nQuando puder, por favor entre em contacto connosco para regularizar o pagamento.\n\nObrigado!`;
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [openedWhatsapp, setOpenedWhatsapp] = useState(false);

  if (!normalizedPhone) return <section className="rounded-xl border border-warn bg-warn-soft p-4"><h2 className="font-semibold text-ink">Lembrete por WhatsApp</h2><p className="mt-1 text-sm text-ink/70">Este cliente não tem um telefone de Moçambique válido.</p><Link href={`/dashboard/clientes/${customerId}`} className="mt-3 inline-block text-sm font-medium text-brand">Editar telefone do cliente →</Link></section>;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="w-full rounded-xl border border-brand bg-brand/5 p-4 text-left"><span className="font-semibold text-brand">💬 Enviar lembrete</span><span className="mt-1 block text-sm text-ink/60">Prepare uma mensagem para o WhatsApp.</span></button>;
  const href = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  return <section className="space-y-3 rounded-xl border border-line bg-white p-4"><div><h2 className="font-semibold text-ink">Lembrete por WhatsApp</h2><p className="mt-1 text-sm text-ink/60">Revise ou edite antes de abrir o WhatsApp.</p></div><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={7} className="input-field resize-y" aria-label="Mensagem de lembrete"/><div className="flex gap-3"><button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-line py-3 text-sm font-medium text-ink">Cancelar</button><a href={href} target="_blank" rel="noreferrer" onClick={() => setOpenedWhatsapp(true)} className="flex-1 rounded-xl bg-brand py-3 text-center text-sm font-medium text-white">Abrir WhatsApp</a></div>{openedWhatsapp && <p className="rounded-lg bg-brand/10 p-3 text-sm text-brand">WhatsApp aberto. Reveja a mensagem e envie quando estiver pronto.</p>}</section>;
}
