import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";

/** True when a value should be displayed (not null/undefined/empty string/empty array). */
export function hasValue<T>(value: T | null | undefined): value is T {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
function toDate(value?: string | null): Date | null {
  if (!hasValue(value)) return null;
  const str = String(value).trim();
  
  // Prise en charge si la date est déjà au format JJ/MM/AAAA
  const frMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (frMatch) {
    const [, d, m, y] = frMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return isValid(date) ? date : null;
  }

  const date = parseISO(str);
  return isValid(date) ? date : null;
}

export function formatDate(value?: string | null): string | undefined {
  const date = toDate(value);
  return date ? format(date, "dd/MM/yyyy") : undefined;
}

export function formatDateLong(value?: string | null): string | undefined {
  const date = toDate(value);
  return date ? format(date, "EEEE d MMMM yyyy", { locale: fr }) : undefined;
}

export function formatDateTime(value?: string | null): string | undefined {
  const date = toDate(value);
  return date ? format(date, "d MMM yyyy 'à' HH:mm", { locale: fr }) : undefined;
}

export function formatTime(value?: string | null): string | undefined {
  if (!hasValue(value)) return undefined;
  const str = String(value).trim();

  // Gestion des dates ISO / epoch 1899 issues de Google Sheets
  if (str.includes("T") || str.startsWith("1899-")) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      try {
        return new Intl.DateTimeFormat("fr-FR", {
          timeZone: "Europe/Paris",
          hour: "2-digit",
          minute: "2-digit",
        }).format(d);
      } catch {
        /* fallback si échec */
      }
    }
  }

  return str;
}

export function formatDateRange(start?: string | null, end?: string | null): string | undefined {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s && e) return `${s} → ${e}`;
  return s ?? e;
}

export function formatMoney(amount?: number | null, currency?: string | null): string | undefined {
  if (!hasValue(amount) || typeof amount !== "number") return undefined;
  const code = hasValue(currency) ? currency : undefined;
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: code ? "currency" : "decimal",
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("fr-FR").format(amount)}${code ? ` ${code}` : ""}`;
  }
}

/** Prix avec unité normalisée (ex: "30 € / personne") */
export function formatPrice(
  amount?: number | null,
  currency?: string | null,
  unit?: string | null,
): string | undefined {
  const money = formatMoney(amount, currency);
  if (!money) return undefined;
  if (!hasValue(unit)) return money;

  const trimmed = unit.trim();
  const formattedUnit = trimmed.startsWith("par ")
    ? `/ ${trimmed.slice(4)}`
    : trimmed.startsWith("/")
      ? trimmed
      : `/ ${trimmed}`;

  return `${money} ${formattedUnit}`;
}

export function formatNumber(value?: number | null): string | undefined {
  if (!hasValue(value) || typeof value !== "number") return undefined;
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${new Intl.NumberFormat("fr-FR").format(count)} ${count > 1 ? plural : singular}`;
}
export function formatDevisDateTime(value?: string | null): string | undefined {
  if (!hasValue(value)) return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) return undefined;
  try {
    const parts = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return `${get("day")}/${get("month")}/${get("year")} à ${get("hour")}:${get("minute")}`;
  } catch {
    return formatDate(value);
  }
}
