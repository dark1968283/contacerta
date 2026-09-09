/**
 * Helper de timezone para o Dashboard. Moçambique usa UTC+2 o ano inteiro
 * (sem horário de verão), mas calculamos o offset via Intl em vez de
 * assumir "+2" fixo — mais correto e não exige nenhuma dependência nova.
 */
export const BUSINESS_TIMEZONE = "Africa/Maputo";

function getOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(instant)
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});

  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUTC - instant.getTime()) / 60000;
}

/** Meia-noite local (Maputo) do dia em que `instant` cai, devolvida como instante UTC real. */
export function zonedStartOfDay(instant: Date, timeZone: string = BUSINESS_TIMEZONE): Date {
  const offsetMin = getOffsetMinutes(instant, timeZone);
  const shifted = new Date(instant.getTime() + offsetMin * 60000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - offsetMin * 60000);
}

/** Hora local (0-23) de `instant` no timezone do negócio. */
export function zonedHour(instant: Date, timeZone: string = BUSINESS_TIMEZONE): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(
      instant
    )
  );
}

/** Chave "YYYY-MM-DD" estável (ordenável) do dia local de `instant`. */
export function zonedDayKey(instant: Date, timeZone: string = BUSINESS_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Rótulo curto "07 set" para exibição. */
export function zonedDayLabel(instant: Date, timeZone: string = BUSINESS_TIMEZONE): string {
  return new Intl.DateTimeFormat("pt-MZ", { timeZone, day: "2-digit", month: "short" }).format(
    instant
  );
}

/** Rótulo "14h" para o gráfico horário. */
export function zonedHourLabel(instant: Date, timeZone: string = BUSINESS_TIMEZONE): string {
  return `${zonedHour(instant, timeZone).toString().padStart(2, "0")}h`;
}

/** Hora curta "14:32" para exibição, no timezone do negócio. */
export function zonedTime(instant: Date, timeZone: string = BUSINESS_TIMEZONE): string {
  return new Intl.DateTimeFormat("pt-MZ", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    instant
  );
}

/** Data curta "07/09/2026" para listas (últimas vendas), no timezone do negócio. */
export function zonedShortDate(instant: Date, timeZone: string = BUSINESS_TIMEZONE): string {
  return new Intl.DateTimeFormat("pt-MZ", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(instant);
}