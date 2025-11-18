// hooks/usePaymentValidation.ts

import { useMemo, useEffect } from "react";
import { ValueItem, RowErrors, PaymentMethod } from "../types/types";

export interface UsePaymentValidationProps {
  values: ValueItem[];
  onValidityChange?: (isValid: boolean) => void;
}

export function usePaymentValidation({
  values,
  onValidityChange,
}: UsePaymentValidationProps) {
  /**
   * Verifica si un método requiere banco
   */
  const needsBank = (m: PaymentMethod): boolean => {
    return m === "cheque" || m === "transferencia";
  };

  /**
   * Valida cada fila y retorna array de errores
   */
  const rowErrors = useMemo<RowErrors[]>(() => {
    return values.map((v) => {
      const bankErr = needsBank(v.method) && !(v.bank || "").trim();
      const chequeNumErr =
        v.method === "cheque" && !(v.chequeNumber || "").trim();
      const chequeDateErr = v.method === "cheque" && !(v.chequeDate || "").trim();

      // Validar monto (para cheques se valida raw_amount)
      const amountStr =
        v.method === "cheque" 
          ? v.raw_amount ?? v.amount ?? "" 
          : v.amount ?? "";
      const amountNum = parseFloat((amountStr || "").replace(",", "."));
      const amountErr = !Number.isFinite(amountNum) || amountNum <= 0;

      return {
        bank: bankErr,
        chequeNumber: chequeNumErr,
        chequeDate: chequeDateErr,
        amount: amountErr,
      };
    });
  }, [values]);

  /**
   * Verifica si hay algún error en el formulario
   */
  const hasErrors = useMemo(
    () =>
      rowErrors.some(
        (e) => e.bank || e.chequeNumber || e.chequeDate || e.amount
      ),
    [rowErrors]
  );

  /**
   * Notifica cambios de validez al padre
   */
  useEffect(() => {
    onValidityChange?.(!hasErrors);
  }, [hasErrors, onValidityChange]);

  return {
    rowErrors,
    hasErrors,
    needsBank,
  };
}