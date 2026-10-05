export function money(cents: number | null | undefined, currency = "usd") {
  const n = (cents ?? 0) / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(n);
}

export function date(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function appUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return base + path;
}

/** Parse a dollar string like "1,250.00" into integer cents. */
export function toCents(input: FormDataEntryValue | null): number | null {
  if (input === null) return null;
  const s = String(input).replace(/[^0-9.]/g, "");
  if (!s) return null;
  return Math.round(parseFloat(s) * 100);
}
