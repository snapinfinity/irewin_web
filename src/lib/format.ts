export function formatMoney(value: number, currency = "EUR", decimals = 0): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatSalaryRange(min: number | null, max: number | null, currency: string): string {
  if (min != null && max != null) return `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`;
  if (min != null) return `From ${formatMoney(min, currency)}`;
  if (max != null) return `Up to ${formatMoney(max, currency)}`;
  return "Salary not disclosed";
}

/**
 * Date in Irish time. A fixed time zone keeps server and client output identical,
 * and Irish (not UTC) time avoids showing yesterday's date just after midnight in summer.
 */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Dublin" }).format(
    new Date(iso),
  );
}

export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
