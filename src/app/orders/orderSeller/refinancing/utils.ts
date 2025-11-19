export const round2 = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;

export function dailyRateFromAnnual(annualPct: number): number {
  const normalized = annualPct > 1 ? annualPct / 100 : annualPct;
  return normalized / 365;
}

export function isoInDays(days: number): string {
  const base = new Date();
  const dt = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + days
  );
  return dt.toISOString().slice(0, 10);
}
export function calculateRefinancingTarget(
  totalDocsFinal: number, // neto a pagar HOY (con desc/rec aplicado)
  totalBase: number, // bruto SIN ajuste (monto original)
  docAdjustmentSigned: number, // +desc / -rec (positivo=descuento, negativo=recargo)
  totalValuesNominal: number, // pagos previos nominales
  netEffectivePayment: number // 👈 NUEVO: pago efectivo neto ya realizado
) {
  const hasPriorPayments = totalValuesNominal > 0.01;
  const EPS = 0.01;

  let base: number;

  if (!hasPriorPayments) {
    // 🔹 REFINANCIACIÓN COMPLETA

    if (docAdjustmentSigned > EPS) {
      // ✅ Hay DESCUENTO → usar totalBase (monto original sin descuento)
      // Razón: al refinanciar, el descuento se pierde
      base = round2(totalBase);
    } else if (docAdjustmentSigned < -EPS) {
      // ✅ Hay RECARGO → usar totalDocsFinal (incluye el recargo)
      // Razón: el recargo es parte del costo real
      base = round2(totalDocsFinal);
    } else {
      // ✅ Sin ajuste → usar totalBase
      base = round2(totalBase);
    }
  } else {
    // 🔹 REFINANCIACIÓN DE SALDO
    // Usar el neto restante actual (con desc/rec aplicado)
    base = round2(totalDocsFinal);
  }

  // 🔹 CAMBIO CRÍTICO: restar el NETO EFECTIVO, no el nominal
  const remaining = Math.max(0, round2(base - netEffectivePayment));

  return { remaining };
}
