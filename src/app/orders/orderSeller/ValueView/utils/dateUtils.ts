
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Convierte fecha a YMD local (sin desplazamiento de timezone)
 */
export function toYMD(dOrStr: string | Date): Date {
  if (typeof dOrStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dOrStr)) {
    const [y, m, d] = dOrStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(dOrStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Clamp a entero no negativo
 */
export function clampNonNegInt(x: number): number {
  return Math.max(0, Math.round(Number.isFinite(x) ? x : 0));
}

/**
 * Clamp a entero (puede ser negativo)
 */
export function clampInt(n?: number): number | undefined {
  return typeof n === "number" && isFinite(n)
    ? Math.max(0, Math.round(n))
    : undefined;
}

/**
 * Suma días a una fecha (devuelve nueva fecha)
 */
export function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Estima fecha de emisión de factura tomando el mínimo days de los docs
 */
export function inferInvoiceIssueDate(
  receiptDate: Date,
  minDays?: number
): Date | undefined {
  if (typeof minDays !== "number" || !isFinite(minDays)) return undefined;
  return toYMD(new Date(receiptDate.getTime() - minDays * MS_PER_DAY));
}

/**
 * Calcula días entre dos fechas
 */
export function daysBetween(from: Date, to: Date): number {
  return clampNonNegInt((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/**
 * Verifica si dos fechas son el mismo día (con tolerancia de ±1 día)
 */
export function isSameDayLoose(d1: Date, d2: Date): boolean {
  return Math.abs(d1.getTime() - d2.getTime()) <= MS_PER_DAY;
}