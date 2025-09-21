// src/lib/dateUtils.ts

/** Milisegundos por día (24h exactas). */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Normaliza a "día calendario" retornando el timestamp de la medianoche **UTC**
 * del día LOCAL de `d`. Útil para aritmética (diffs) estable ante DST.
 *
 * ⚠️ No uses el valor retornado para mostrar con `new Date(...)` en zona local,
 * porque se verá como 21:00 del día anterior en -03:00. Para UI usá
 * `toLocalMidnightDate(d)` o `formatLocalDateOnly(d)`.
 */
export function toCalendarDayUTC(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Devuelve un Date a **medianoche LOCAL** del mismo día que `d`.
 * Usalo para **renderizar/mostrar** en UI (etiquetas, inputs, etc.).
 */
export function toLocalMidnightDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Parseo “date-only” ROBUSTO:
 * - "dd/MM/yyyy"  -> medianoche LOCAL
 * - "yyyy-MM-dd"  -> medianoche LOCAL
 * - ISO con hora/offset (p.ej. "2025-07-30T00:00:00.000Z" o con +hh:mm):
 *     toma SOLO la parte de fecha ("2025-07-30") para evitar corrimientos.
 * - Fallback: cualquier string que Date entienda -> se reduce a date-only LOCAL.
 */
export function parseDateOnlyLocal(dateStr?: string): Date | null {
  if (!dateStr) return null;

  // dd/MM/yyyy
  const dmy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) {
    const [, dd, mm, yyyy] = dmy;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(d.getTime()) ? null : d;
  }

  // yyyy-MM-dd
  const ymd = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return isNaN(dt.getTime()) ? null : dt;
  }

  // ISO con hora/zona -> tomar SOLO "yyyy-MM-dd"
  if (dateStr.includes("T")) {
    const onlyDate = dateStr.split("T")[0]; // "2025-07-30"
    const ymd2 = onlyDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymd2) {
      const [, y, m, d] = ymd2;
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      return isNaN(dt.getTime()) ? null : dt;
    }
  }

  // Fallback: lo que Date entienda, luego llevar a date-only LOCAL
  const any = new Date(dateStr);
  if (isNaN(any.getTime())) return null;
  return new Date(any.getFullYear(), any.getMonth(), any.getDate());
}

/** Diff de días calendario (b - a), ignorando horas, estable ante DST. */
export function diffCalendarDays(a?: string, b?: string): number {
  const da = parseDateOnlyLocal(a);
  const db = parseDateOnlyLocal(b);
  if (!da || !db) return NaN;
  return Math.round((toCalendarDayUTC(db) - toCalendarDayUTC(da)) / MS_PER_DAY);
}

/** Días calendario desde una fecha (start) hasta HOY (local). Nunca negativo. */
export function diffFromDateToToday(
  start?: string,
  { inclusive = false }: { inclusive?: boolean } = {}
): number {
  const d = parseDateOnlyLocal(start);
  if (!d) return NaN;

  // Usamos medianoche LOCAL para hoy, y UTC para la aritmética (estable ante DST)
  const todayLocalMidnight = toLocalMidnightDate(new Date());

  const diffDays =
    (toCalendarDayUTC(todayLocalMidnight) - toCalendarDayUTC(d)) / MS_PER_DAY;

  // diffDays ya es entero (medias noches exactas), pero por robustez:
  const whole = Math.trunc(diffDays);

  if (whole < 0) return 0; // si start es futuro, nunca negativo
  return inclusive ? whole + 1 : whole;
}
/**
 * Días calendario desde HOY (local) hasta una fecha (end).
 * 18→18 = 0, 18→19 = 1. Nunca negativo.
 */
export function diffFromTodayToDate(endISO?: string): number {
  const end = parseDateOnlyLocal(endISO);
  if (!end) return 0;

  const today = new Date();
  const diffDays =
    (toCalendarDayUTC(end) - toCalendarDayUTC(toLocalMidnightDate(today))) /
    MS_PER_DAY;

  return Math.max(0, Math.round(diffDays));
}

/**
 * (Opcional) Timestamp de medianoche **LOCAL** del día de `d`.
 * Útil si querés guardar/mostrar sin “corrimiento” al crear `new Date(ms)`.
 * ⚠️ Para aritmética de días, preferí `toCalendarDayUTC`.
 */
export function toCalendarDayLocalMS(d: Date): number {
  return toLocalMidnightDate(d).getTime();
}

/** Formatea una fecha (Date) como dd/MM/yyyy usando valores **LOCALes**. */
export function formatLocalDateOnly(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/* ============================
   Ejemplos de uso (referencia)
   ============================
const d = new Date("Thu Sep 18 2025 13:58:11 GMT-0300");

// 1) Mostrar en UI el mismo día (sin corrimiento):
formatLocalDateOnly(toLocalMidnightDate(d)); // "18/09/2025"

// 2) Diffs de días estables:
diffFromTodayToDate("2025-09-30"); // ej.: 12

// 3) ¡Evitar esto para UI!:
new Date(toCalendarDayUTC(d)); // se verá como 21:00 del 17/09 en -03:00
*/
