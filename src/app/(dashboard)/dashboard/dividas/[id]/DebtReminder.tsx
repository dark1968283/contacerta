"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Phone, Send, X } from "lucide-react";
import { formatMT } from "@/lib/format";

export function normalizeMozambiquePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("258")) return digits;
  if (digits.length === 9) return `258${digits}`;
  return null;
}

export function DebtReminder({
  customerId,
  customerName,
  phone,
  remaining,
}: {
  customerId: string;
  customerName: string;
  phone: string | null;
  remaining: number;
}) {
  const normalizedPhone = phone ? normalizeMozambiquePhone(phone) : null;

  const initialMessage = `Olá ${customerName} 👋\n\nEste é um lembrete sobre o valor de ${formatMT(remaining)} que está pendente na sua conta.\n\nQuando puder, por favor entre em contacto connosco para regularizar o pagamento.\n\nObrigado!`;

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [openedWhatsapp, setOpenedWhatsapp] = useState(false);

  if (!normalizedPhone) {
    return (
      <section className="rounded-2xl border border-warning/20 bg-dark-surface p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <Phone className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-dark-text">
              Lembrete por WhatsApp
            </h2>
            <p className="mt-1 text-sm text-dark-muted">
              Este cliente não tem um número de telefone moçambicano válido.
            </p>
            <Link
              href={`/dashboard/clientes/${customerId}`}
              className="mt-3 inline-flex text-sm font-medium text-brandGlow hover:underline"
            >
              Editar telefone do cliente →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-brandGlow/20 bg-brandGlow/[0.06] p-4 text-left transition-colors hover:bg-brandGlow/10 sm:p-5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brandGlow/10 text-brandGlow">
          <MessageCircle className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-dark-text">
            Enviar lembrete
          </span>
          <span className="mt-1 block text-sm text-dark-muted">
            Preparar uma mensagem para {customerName} no WhatsApp.
          </span>
        </span>
        <Send className="h-4 w-4 shrink-0 text-brandGlow" aria-hidden />
      </button>
    );
  }

  const href = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;

  return (
    <section className="space-y-4 rounded-2xl border border-dark-border bg-dark-surface p-4 shadow-xl shadow-black/10 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brandGlow/10 text-brandGlow">
          <MessageCircle className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-dark-text">
            Lembrete por WhatsApp
          </h2>
          <p className="mt-1 text-sm text-dark-muted">
            Reveja ou edite a mensagem antes de abrir o WhatsApp.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar lembrete"
          className="rounded-lg p-2 text-dark-muted transition-colors hover:bg-white/[0.05] hover:text-dark-text"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div>
        <label
          htmlFor="debt-reminder-message"
          className="mb-1.5 block text-sm font-medium text-dark-muted"
        >
          Mensagem
        </label>
        <textarea
          id="debt-reminder-message"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setOpenedWhatsapp(false);
          }}
          rows={7}
          className="w-full resize-y rounded-xl border border-dark-border bg-dark-bg/60 px-4 py-3 text-sm leading-relaxed text-dark-text outline-none transition-all focus:border-brandGlow/50 focus:ring-2 focus:ring-brandGlow/15"
          aria-label="Mensagem de lembrete"
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-dark-border bg-white/[0.03] px-4 py-3 text-sm font-medium text-dark-muted transition-colors hover:text-dark-text sm:flex-1"
        >
          Cancelar
        </button>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          onClick={() => setOpenedWhatsapp(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-onbrand shadow-lg shadow-brand/20 transition-colors hover:bg-brand/90 sm:flex-1"
        >
          <Send className="h-4 w-4" aria-hidden />
          Abrir WhatsApp
        </a>
      </div>

      {openedWhatsapp && (
        <p
          role="status"
          className="rounded-xl border border-brandGlow/20 bg-brandGlow/10 p-3 text-sm text-brandGlow"
        >
          WhatsApp aberto. Reveja a mensagem e envie quando estiver pronto.
        </p>
      )}
    </section>
  );
}
