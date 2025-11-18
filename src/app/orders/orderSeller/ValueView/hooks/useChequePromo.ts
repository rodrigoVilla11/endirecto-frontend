// hooks/useChequePromo.ts

import { useMemo } from "react";
import { ChequePromoItem, ValueItem } from "../types/types";
import { getChequePromoRate, nominalOf, promoBaseOf } from "../utils/chequeRules";
export interface UseChequePromoProps {
  values: ValueItem[];
  /** Mínimo de días de factura al momento del recibo */
  docsDaysMin?: number;
  /** Fecha aproximada de emisión de factura */
  invoiceIssueDateApprox?: Date;
  /** Fecha del recibo */
  receiptDate: Date;
  /** Bloquear interés de cheques */
  blockChequeInterest?: boolean;
  /** Ajuste de documentos (desc/rec) */
  docAdjustmentSigned?: number;
  /** Neto a pagar */
  netToPay?: number;
}

export function useChequePromo({
  values,
  docsDaysMin,
  invoiceIssueDateApprox,
  receiptDate,
  blockChequeInterest = false,
  docAdjustmentSigned = 0,
  netToPay = 0,
}: UseChequePromoProps) {
  // Calcular total nominal internamente
  const totalNominalValues = useMemo(
    () => values.reduce((acc, v) => acc + nominalOf(v), 0),
    [values]
  );
  // Detectar si hay cheques
  const hasCheques = useMemo(
    () => values.some((v) => v.method === "cheque"),
    [values]
  );

  // Verifica si el pago alcanza el neto a pagar (con tolerancia de $1)
  const EPS = 1;
  const reachesNetToPay = useMemo(
    () => Math.abs(totalNominalValues - netToPay) <= EPS,
    [totalNominalValues, netToPay]
  );

  // Decidir si aplicar promo
  // REGLA: Solo aplicar promo si:
  // 1. HAY descuento en documentos (docAdjustmentSigned > 0)
  // 2. HAY cheques
  // 3. El pago alcanza el neto a pagar completo (totalNominalValues ≈ netToPay)
  const shouldApplyChequePromo = useMemo(() => {
    // Solo aplicar si cumple las 3 condiciones
    return docAdjustmentSigned > 0 && hasCheques && reachesNetToPay;
  }, [docAdjustmentSigned, hasCheques, reachesNetToPay]);

  // Calcular items de promo por cheque
  const chequePromoItems = useMemo<ChequePromoItem[]>(() => {
    if (!shouldApplyChequePromo) {
      return values.map(() => ({ rate: 0, amount: 0 }));
    }

    return values.map((v) => {
      if (v.method !== "cheque") return { rate: 0, amount: 0 };

      const rate = getChequePromoRate({
        invoiceAgeAtReceiptDaysMin: docsDaysMin,
        invoiceIssueDateApprox,
        receiptDate,
        chequeDateISO: v.chequeDate,
        blockChequeInterest,
      });

      const base = promoBaseOf(v);
      const amount = +(base * rate).toFixed(2);
      return { rate, amount };
    });
  }, [
    values,
    docsDaysMin,
    invoiceIssueDateApprox,
    receiptDate,
    shouldApplyChequePromo,
    blockChequeInterest,
  ]);

  // Total de promo en pesos
  const totalChequePromo = useMemo(
    () =>
      chequePromoItems.reduce(
        (acc, x) => acc + (x.amount > 0 ? x.amount : 0),
        0
      ),
    [chequePromoItems]
  );

  // Hay promo significativa (> 0.5 centavos)
  const hasChequePromo = totalChequePromo > 0.005;

  return {
    chequePromoItems,
    totalChequePromo,
    hasChequePromo,
    shouldApplyChequePromo,
    hasCheques,
  };
}