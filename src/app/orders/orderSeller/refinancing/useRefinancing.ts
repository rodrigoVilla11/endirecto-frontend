import { useState, useCallback, useMemo } from "react";
import { generateRefinancingCheques } from "./calculator";
import { calculateRefinancingTarget } from "./utils";
import { ComputedDiscount } from "./types";

export function useRefinancing(
  computedDiscounts: ComputedDiscount[],
  totalDocsFinal: number,
  totalBase: number,
  docAdjustmentSigned: number,
  totalValuesNominal: number, // <-- CAMBIO: Debe recibir nominal
  annualInterestPct: number,
  blockChequeInterest: boolean
) {
  const [isVisible, setIsVisible] = useState(false);

  const hasInvoiceToday = useMemo(
    () =>
      computedDiscounts.some(
        (d) => typeof d.days === "number" && Math.round(d.days) === 0
      ),
    [computedDiscounts]
  );

  const { remaining: remainingAmount } = useMemo(
    () =>
      calculateRefinancingTarget(
        totalDocsFinal,
        totalBase,
        docAdjustmentSigned,
        totalValuesNominal // <-- Pasamos nominal
      ),
    [totalDocsFinal, totalBase, docAdjustmentSigned, totalValuesNominal]
  );

  const toggleVisibility = useCallback(() => {
    if (hasInvoiceToday) {
      alert("No se puede refinanciar saldo cuando hay una factura de hoy.");
      return;
    }
    setIsVisible((prev) => !prev);
  }, [hasInvoiceToday]);

  const generateCheques = useCallback(
    (daysList: number[]) => {
      if (computedDiscounts.length === 0) {
        alert("No se puede refinanciar sin documentos seleccionados.");
        return [];
      }
      if (daysList.length === 0) {
        alert("Debes elegir al menos un plazo para los cheques.");
        return [];
      }
      if (remainingAmount <= 0) {
        alert("No hay saldo pendiente para refinanciar.");
        return [];
      }

      const grace = blockChequeInterest ? 100000 : 0;

      return generateRefinancingCheques({
        targetAmount: remainingAmount,
        daysList,
        annualInterestPct,
        graceDays: grace,
      });
    },
    [
      computedDiscounts.length,
      remainingAmount,
      annualInterestPct,
      blockChequeInterest,
    ]
  );

  return {
    isVisible,
    remainingAmount,
    hasInvoiceToday,
    toggleVisibility,
    generateCheques,
  };
}