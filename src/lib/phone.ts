/**
 * Números de telefone de Moçambique.
 *  - Telemóvel: 9 dígitos começados por 82–87 → "84 123 4567"
 *  - Fixo: 8 dígitos começados por 2 → "21 123 456"
 * Aceita o indicativo 258 / +258 / 00258 e ignora espaços e traços.
 */
export type PhoneCheck =
  | { ok: true; formatted: string; empty: false }
  | { ok: true; formatted: ""; empty: true }
  | { ok: false; reason: string; empty: false };

export function onlyLocalDigits(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00258")) digits = digits.slice(5);
  else if (digits.startsWith("258") && digits.length > 9) digits = digits.slice(3);
  return digits;
}

export function formatMzPhone(digits: string) {
  // Dígitos a mais ficam visíveis no fim (para o erro ser claro, nunca cortamos).
  if (digits.startsWith("8")) {
    return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 9), digits.slice(9)].filter(Boolean).join(" ");
  }
  return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 8), digits.slice(8)].filter(Boolean).join(" ");
}

export function checkMzPhone(input: string | null | undefined): PhoneCheck {
  const raw = (input ?? "").trim();
  if (!raw) return { ok: true, formatted: "", empty: true };

  const digits = onlyLocalDigits(raw);

  if (digits.startsWith("8")) {
    if (!/^8[2-7]/.test(digits)) {
      return { ok: false, reason: "Os números de telemóvel começam por 82, 83, 84, 85, 86 ou 87.", empty: false };
    }
    if (digits.length < 9) return { ok: false, reason: `Faltam ${9 - digits.length} dígito(s).`, empty: false };
    if (digits.length > 9) return { ok: false, reason: `Tem ${digits.length - 9} dígito(s) a mais.`, empty: false };
    return { ok: true, formatted: formatMzPhone(digits), empty: false };
  }

  if (digits.startsWith("2")) {
    if (digits.length !== 8) return { ok: false, reason: "Os números fixos têm 8 dígitos (ex.: 21 123 456).", empty: false };
    return { ok: true, formatted: formatMzPhone(digits), empty: false };
  }

  return { ok: false, reason: "Use um número de Moçambique, por exemplo 84 123 4567.", empty: false };
}
