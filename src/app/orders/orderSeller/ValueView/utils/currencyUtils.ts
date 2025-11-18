
/**
 * Formateador de moneda AR (ARS)
 */
export const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Convierte string a número, manejando formato AR (coma decimal, punto miles)
 * Ej: "1.234,56" -> 1234.56
 */
export const toNum = (s?: string): number => {
  return Number.parseFloat((s ?? "").replace(",", ".")) || 0;
};

/**
 * Convierte cualquier input del usuario a un número en pesos con 2 decimales.
 * Ej: "1234" -> 12.34 ; "1.234,5" -> 1234.50 ; "12,34" -> 12.34
 */
export const parseMaskedCurrencyToNumber = (raw: string): number => {
  const digits = (raw || "").replace(/\D/g, ""); // solo dígitos
  if (!digits) return 0;
  const cents = digits.slice(-2).padStart(2, "0"); // siempre 2 decimales
  const int = digits.slice(0, -2) || "0";
  return Number(`${int}.${cents}`);
};

/**
 * Formatea número a moneda AR con 2 decimales
 * Ej: 1234.56 -> "$ 1.234,56"
 */
export const formatCurrencyAR = (n: number): string => {
  return n === 0 ? "$ 0,00" : currencyFormatter.format(n);
};

/**
 * Formatea un string numérico interno (ej "1234.56") a moneda AR
 */
export const formatInternalString = (s: string | undefined): string => {
  return formatCurrencyAR(Number(s || 0));
};

/**
 * Formatea dígitos puros como moneda AR para input enmascarado
 * Ej: "123456" -> "1.234,56"
 */
export const formatDigitsAsCurrencyAR = (digits: string): string => {
  if (!digits) return "";
  const cents = digits.slice(-2).padStart(2, "0");
  let int = digits.slice(0, -2) || "0";
  int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${int},${cents}`;
};

/**
 * Convierte número a string de dígitos (centavos)
 * Ej: 12.34 -> "1234"
 */
export const numberToDigitsStr = (n: number): string => {
  return String(Math.round((n || 0) * 100));
};

/**
 * Convierte string interno a formato editable AR
 * Ej: "1234.50" -> "1.234,50"
 */
export const toEditable = (s?: string): string => {
  const n = parseMaskedCurrencyToNumber(s ?? "");
  if (!n) return "";
  return n.toFixed(2).replace(".", ",");
};

/**
 * Solo dígitos
 */
export const onlyDigits = (s: string): string => {
  return (s || "").replace(/\D/g, "");
};

/**
 * Redondea a 2 decimales sin drift
 */
export const round2 = (n: number): number => {
  return Math.round(n * 100) / 100;
};

/**
 * Formatea porcentaje con signo
 * Ej: 0.13 -> "+13.00%"
 */
export const fmtPctSigned = (p: number): string => {
  return `${p >= 0 ? "+" : ""}${(p * 100).toFixed(2)}%`;
};