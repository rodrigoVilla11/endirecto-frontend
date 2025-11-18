export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

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
  totalDocsFinal: number,
  totalBase: number,
  docAdjustmentSigned: number,
  totalValuesNominal: number // <-- CAMBIO: Debe ser nominal, no neto
): { target: number; remaining: number } {
  // Si hay descuento (positivo), usar totalBase (bruto)
  // Si hay recargo (negativo), usar totalDocsFinal (con recargo)
  const targetForRefi =
    docAdjustmentSigned > 0 
      ? round2(totalBase)      // Descuento: usar bruto
      : round2(totalDocsFinal); // Recargo: usar con recargo
  
  // Restar el NOMINAL pagado (no el neto)
  const diff = round2(targetForRefi - totalValuesNominal);
  const remaining = Math.max(0, diff);
  
  return { target: targetForRefi, remaining };
}