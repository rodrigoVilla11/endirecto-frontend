import { ValueItem } from "./types";
import { dailyRateFromAnnual, isoInDays, round2 } from "./utils";
export type RefinancingParams = {
  targetAmount: number;
  daysList: number[];
  annualInterestPct: number;
  graceDays: number;
};

export type ChequeCalculation = {
  days: number;
  daysCharged: number;
  interestPct: number;
  safeDen: number;
};

export function calculateChequesDenominators(
  daysList: number[],
  grace: number,
  daily: number
): ChequeCalculation[] {
  return daysList.map((d) => {
    const daysTotal = d;
    const daysCharged = Math.max(0, daysTotal - grace);
    const interestPct = daily * daysCharged;
    const safeDen = 1 - interestPct <= 0 ? 1 : 1 - interestPct;
    
    return { days: daysTotal, daysCharged, interestPct, safeDen };
  });
}

export function generateRefinancingCheques({
  targetAmount,
  daysList,
  annualInterestPct,
  graceDays,
}: RefinancingParams): ValueItem[] {
  if (daysList.length === 0 || targetAmount <= 0) {
    return [];
  }

  const daily = dailyRateFromAnnual(annualInterestPct);
  const denoms = calculateChequesDenominators(daysList, graceDays, daily);
  
  const sumSafeDen = denoms.reduce((a, x) => a + x.safeDen, 0);
  const Rraw = sumSafeDen > 0 ? targetAmount / sumSafeDen : targetAmount;

  const cheques: ValueItem[] = [];
  let accNet = 0;

  for (let i = 0; i < denoms.length; i++) {
    const { days: d, safeDen } = denoms[i];

    let raw = round2(Rraw);
    let net = round2(raw * (safeDen <= 0 ? 1 : safeDen));

    // Ajuste final para cerrar exacto
    if (i === denoms.length - 1) {
      const neededNet = round2(targetAmount - accNet);
      const safeDenLast = safeDen <= 0 ? 1 : safeDen;
      raw = round2(neededNet / safeDenLast);
      net = round2(raw * safeDenLast);
    }

    accNet += net;

    cheques.push({
      method: "cheque",
      selectedReason: "Refinanciación",
      amount: net.toFixed(2),
      raw_amount: raw.toFixed(2),
      chequeDate: isoInDays(d),
      overrideGraceDays: graceDays,
      cf: raw - net,
    });
  }

  // Ajuste final si queda delta mínimo
  const sumNet = cheques.reduce((a, c) => a + parseFloat(c.amount), 0);
  const delta = round2(targetAmount - sumNet);
  
  if (Math.abs(delta) >= 0.01) {
    const lastIdx = cheques.length - 1;
    const last = cheques[lastIdx];
    const safeDenLast = denoms[lastIdx].safeDen <= 0 ? 1 : denoms[lastIdx].safeDen;

    const newNet = round2(parseFloat(last.amount) + delta);
    const newRaw = round2(newNet / safeDenLast);

    last.amount = newNet.toFixed(2);
    last.raw_amount = newRaw.toFixed(2);
  }

  return cheques;
}
