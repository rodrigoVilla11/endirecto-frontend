"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { diffFromTodayToDate } from "@/lib/dateUtils";
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import { ComputedDiscount } from "./refinancing/types";
import { useRefinancing } from "./refinancing/useRefinancing";
import { RefinancingPanel } from "./refinancing/RefinancingPanel";

// Tipos
import { ValueItem, PaymentMethod } from "./ValueView/types/types";

// Hooks
import { useChequeCalculations } from "./ValueView/hooks/useChequeCalculations";
import { useChequePromo } from "./ValueView/hooks/useChequePromo";
import { usePaymentValidation } from "./ValueView/hooks/usePaymentValidation";
import { usePaymentTotals } from "./ValueView/hooks/usePaymentTotals";

// Componentes
import { PaymentRow } from "./ValueView/PaymentRow";
import { PaymentSummary } from "./ValueView/PaymentSummary";

// Utils
import {
  currencyFormatter,
  parseMaskedCurrencyToNumber,
  round2,
} from "./ValueView/utils/currencyUtils";
import { inferInvoiceIssueDate } from "./ValueView/utils/dateUtils";
import { nominalOf } from "./ValueView/utils/chequeRules";

export interface ValueViewProps {
  newValues: ValueItem[];
  setNewValues: React.Dispatch<React.SetStateAction<ValueItem[]>>;
  annualInterestPct: number;
  docAdjustmentSigned?: number;
  netToPay?: number;
  gross?: number;
  chequeGraceDays?: number;
  onValidityChange?: (isValid: boolean) => void;
  docsDaysMin?: number;
  receiptDate?: Date;
  blockChequeInterest?: boolean;
  computedDiscounts?: ComputedDiscount[];
  totalDocsFinal?: number;
  totalBase?: number;
  onOpenCalculator?: () => void;
  showCalculatorButton?: boolean;
  onSaldoChange?: (saldo: number) => void;
}

export default function ValueView({
  newValues,
  setNewValues,
  annualInterestPct,
  docAdjustmentSigned = 0,
  netToPay = 0,
  gross = 0,
  chequeGraceDays = 45,
  onValidityChange,
  docsDaysMin,
  receiptDate = new Date(),
  blockChequeInterest = false,
  computedDiscounts = [],
  totalDocsFinal = 0,
  totalBase = 0,
  onOpenCalculator,
  showCalculatorButton = false,
  onSaldoChange,
}: ValueViewProps) {
  const { t } = useTranslation();
  const NO_CONCEPTO = t("document.noConcepto") || "Sin Concepto";
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();

  // Estado UI
  const [openRows, setOpenRows] = useState<Record<number, boolean>>({});
  const [summaryOpenRows, setSummaryOpenRows] = useState<
    Record<number, boolean>
  >({});

  // Fecha de emisión estimada
  const invoiceIssueDateApprox = useMemo(
    () => inferInvoiceIssueDate(receiptDate, docsDaysMin),
    [receiptDate, docsDaysMin]
  );

  // Hook: Cálculos de cheques
  const chequeCalcs = useChequeCalculations({
    annualInterestPct,
    receiptDate,
    invoiceIssueDateApprox,
    blockChequeInterest,
  });

  // Hook: Validación
  const validation = usePaymentValidation({
    values: newValues,
    onValidityChange,
  });

  // Total nominal (necesario para promo)
  const totalNominalValues = useMemo(
    () => newValues.reduce((acc, v) => acc + nominalOf(v), 0),
    [newValues]
  );

  // Hook: Promociones de cheques (ya no necesita totalNominalValues como parámetro)
  const chequePromo = useChequePromo({
    values: newValues,
    docsDaysMin,
    invoiceIssueDateApprox,
    receiptDate,
    blockChequeInterest,
    docAdjustmentSigned,
    netToPay,
  });

  // Hook: Totales
  const totals = usePaymentTotals({
    values: newValues,
    chequeInterest: chequeCalcs.chequeInterest,
    totalChequePromo: chequePromo.totalChequePromo,
    docAdjustmentSigned,
    netToPay,
    gross,
    totalBase, // <-- CRÍTICO: Debe estar pasándose
    hasChequePromo: chequePromo.hasChequePromo,
    hasCheques: chequePromo.hasCheques,
  });

  // Refinanciación (debe recibir totalNominalValues, no totalValues)
  const refinancing = useRefinancing(
    computedDiscounts,
    totalDocsFinal,
    totalBase,
    docAdjustmentSigned,
    totalNominalValues, // <-- CAMBIO: Pasar nominal en lugar de neto
    totals.netEffectivePayment,
    annualInterestPct,
    blockChequeInterest
  );

  // Auto-ajuste de saldo menor a $1
  const autoFixAppliedRef = useRef(false);

  useEffect(() => {
    const abs = Math.abs(totals.saldoUI);

    if (abs >= 1 || totals.saldoUI === 0) {
      autoFixAppliedRef.current = false;
      return;
    }

    if (
      abs > 0 &&
      abs < 1 &&
      !autoFixAppliedRef.current &&
      newValues.length > 0
    ) {
      autoFixAppliedRef.current = true;

      const delta = round2(totals.saldoUI);

      setNewValues((prev) => {
        const clone = [...prev];
        const i = clone.length - 1;
        const v = clone[i];

        const newAmount = Math.max(0, round2((Number(v.amount) || 0) + delta));

        const concept = (v.selectedReason || NO_CONCEPTO).includes(
          "(ajuste redondeo)"
        )
          ? v.selectedReason
          : `${v.selectedReason || NO_CONCEPTO} (ajuste redondeo)`;

        clone[i] = {
          ...v,
          amount: newAmount.toFixed(2),
          selectedReason: concept,
        };

        return clone;
      });
    }
  }, [totals.saldoUI, newValues.length, setNewValues, NO_CONCEPTO]);

  // ===== Handlers =====

  const addRow = () => {
    setNewValues((prev) => [
      ...prev,
      {
        amount: "",
        raw_amount: "",
        selectedReason: NO_CONCEPTO,
        method: "efectivo" as PaymentMethod,
        bank: "",
        chequeDate: "",
        chequeNumber: "",
      },
    ]);
  };

  const removeRow = (idx: number) => {
    setNewValues((prev) => prev.filter((_, i) => i !== idx));
  };

  const patchRow = (idx: number, patch: Partial<ValueItem>) => {
    setNewValues((prev) => {
      const clone = [...prev];
      const merged = { ...clone[idx], ...patch };
      if (!merged.selectedReason?.trim()) merged.selectedReason = NO_CONCEPTO;
      clone[idx] = merged;
      return clone;
    });
  };

  const handleMethodChange = (idx: number, method: PaymentMethod) => {
    const v = newValues[idx];

    if (method !== "cheque") {
      patchRow(idx, { method, raw_amount: undefined });
      return;
    }

    const raw = v.raw_amount ?? v.amount ?? "0";
    const { neto } = chequeCalcs.computeChequeNeto(
      raw,
      v.chequeDate ? v : { ...v, chequeDate: "" }
    );
    patchRow(idx, { method, raw_amount: raw, amount: neto.toFixed(2) });
  };

  const handleChequeDateChange = (idx: number, iso: string) => {
    const v = newValues[idx];

    if (v.method === "cheque") {
      const raw = v.raw_amount ?? v.amount ?? "0";
      const { neto } = chequeCalcs.computeChequeNeto(raw, {
        ...v,
        chequeDate: iso,
      });
      patchRow(idx, {
        chequeDate: iso,
        raw_amount: raw,
        amount: neto.toFixed(2),
      });
    }
  };

  const handleAmountChange = (idx: number, input: string) => {
    const v = newValues[idx];
    const n = parseMaskedCurrencyToNumber(input);

    if (v.method !== "cheque") {
      patchRow(idx, { amount: n.toFixed(2), raw_amount: undefined });
      return;
    }

    const { neto } = chequeCalcs.computeChequeNeto(
      n.toFixed(2),
      v.chequeDate ? v : { ...v, chequeDate: "" }
    );
    patchRow(idx, {
      raw_amount: n.toFixed(2),
      amount: neto.toFixed(2),
    });
  };

  const handleUploadReceipt = async (idx: number, file: File) => {
    try {
      const res = await uploadImage(file).unwrap();
      const url =
        (res as any)?.secure_url ??
        (res as any)?.url ??
        (res as any)?.data?.secure_url ??
        (res as any)?.data?.url;

      if (!url) throw new Error("No se recibió URL del servidor.");

      patchRow(idx, {
        receiptUrl: url,
        receiptOriginalName: file.name,
      });
    } catch (err) {
      console.error("Falló la subida del comprobante:", err);
      alert("No se pudo subir el comprobante.");
    }
  };

  const handleClearReceipt = (idx: number) => {
    patchRow(idx, {
      receiptUrl: undefined,
      receiptOriginalName: undefined,
    });
  };

  const handleGenerateCheques = (daysList: number[]) => {
    const cheques = refinancing.generateCheques(daysList);
    if (cheques.length > 0) {
      setNewValues((prev) => {
        const keepNonCheques = prev.filter((v) => v.method !== "cheque");
        return [...keepNonCheques, ...cheques];
      });
    }
  };

  useEffect(() => {
    if (onSaldoChange) {
      onSaldoChange(totals.saldoUI);
    }
  }, [totals.saldoUI, onSaldoChange]);

  const toggleRow = (i: number) =>
    setOpenRows((prev) => ({ ...prev, [i]: !prev[i] }));

  const toggleSummary = (i: number) =>
    setSummaryOpenRows((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-medium">Pagos</h4>
      </div>

      <RefinancingPanel
        isVisible={refinancing.isVisible}
        remainingAmount={refinancing.remainingAmount}
        hasInvoiceToday={refinancing.hasInvoiceToday}
        computedDiscounts={computedDiscounts}
        onToggle={refinancing.toggleVisibility}
        onGenerateCheques={handleGenerateCheques}
        currencyFormatter={currencyFormatter}
        onOpenCalculator={onOpenCalculator}
        hasValues={newValues.length > 0}
      />

      {newValues.length === 0 && (
        <div className="text-zinc-400 text-sm">No hay pagos cargados.</div>
      )}

      <div className="space-y-2">
        {newValues.map((v, idx) => {
          const daysTotal = diffFromTodayToDate(v.chequeDate);
          const daysGrav =
            v.method === "cheque"
              ? blockChequeInterest
                ? 0
                : chequeCalcs.getChargeableDays(v)
              : 0;
          const pctInt =
            v.method === "cheque"
              ? blockChequeInterest
                ? 0
                : chequeCalcs.getChequeInterestPct(v)
              : 0;
          const interest$ =
            v.method === "cheque" ? chequeCalcs.chequeInterest(v) : 0;

          return (
            <PaymentRow
              key={idx}
              index={idx}
              value={v}
              rowError={validation.rowErrors[idx]}
              isOpen={!!openRows[idx]}
              isSummaryOpen={!!summaryOpenRows[idx]}
              needsBank={validation.needsBank(v.method)}
              currencyFormatter={currencyFormatter}
              isUploading={isUploading}
              NO_CONCEPTO={NO_CONCEPTO}
              daysTotal={daysTotal}
              daysGrav={daysGrav}
              pctInt={pctInt}
              interest$={interest$}
              chequePromoRate={chequePromo.chequePromoItems[idx]?.rate}
              chequePromoAmount={chequePromo.chequePromoItems[idx]?.amount}
              onToggle={() => toggleRow(idx)}
              onToggleSummary={() => toggleSummary(idx)}
              onRemove={() => removeRow(idx)}
              onPatch={(patch) => patchRow(idx, patch)}
              onMethodChange={(method) => handleMethodChange(idx, method)}
              onChequeDateChange={(iso) => handleChequeDateChange(idx, iso)}
              onAmountChange={(input) => handleAmountChange(idx, input)}
              onUploadReceipt={(file) => handleUploadReceipt(idx, file)}
              onClearReceipt={() => handleClearReceipt(idx)}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-end">
        <button
          onClick={addRow}
          className="px-3 py-2 rounded bg-emerald-500 text-black font-medium hover:brightness-95 active:scale-95"
        >
          + Agregar pago
        </button>
      </div>

      {newValues.length > 0 && (
        <PaymentSummary
          totals={totals}
          docAdjustmentSigned={docAdjustmentSigned}
          hasCheques={chequePromo.hasCheques}
          hasChequePromo={chequePromo.hasChequePromo}
          currencyFormatter={currencyFormatter}
        />
      )}

      {validation.hasErrors && (
        <div className="mt-3 text-sm text-red-400">
          {t("document.hayErroresEnValores") ||
            "Hay errores en los pagos cargados"}
        </div>
      )}
    </div>
  );
}
