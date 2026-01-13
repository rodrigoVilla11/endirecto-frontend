"use client";

import { diffFromTodayToDate } from "@/lib/dateUtils";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";

type PaymentMethod = "efectivo" | "transferencia" | "cheque";

export type ValueItem = {
  /** Monto imputable. Para cheques, es el NETO (original - interés). */
  amount: string;
  /** Solo cheques: monto original ingresado por el usuario. */
  raw_amount?: string;
  selectedReason: string;
  method: PaymentMethod;
  bank?: string;
  /** Solo cheques: fecha de cobro (YYYY-MM-DD) */
  chequeDate?: string;
  chequeNumber?: string;
  receiptUrl?: string;
  receiptOriginalName?: string;
  overrideGraceDays?: number; // solo cheques
  cf?: number;
};
export type PaymentTypeUI = "cta_cte" | "pago_anticipado";

export default function ValueView({
  newValues,
  setNewValues,
  /** tasa anual (ej: 96) */
  annualInterestPct,
  /** ajuste de documentos (+desc / -rec) que ves en PaymentModal */
  docAdjustmentSigned = 0,
  /** neto que ves en PaymentModal (usá totalNetForUI) */
  netToPay = 0,
  gross = 0,
  /** gracia para cheques (por defecto 45) */
  chequeGraceDays,
  onValidityChange,
  /** mínimo de días de factura al momento del recibo (p.ej., el menor d.days de los docs seleccionados) */
  docsDaysMin,
  /** fecha del recibo (default: hoy) */
  receiptDate = new Date(),
  applyManualTenToCheques,
  blockChequeInterest = false,
  paymentTypeUI,
}: {
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
  applyManualTenToCheques?: boolean;
  paymentTypeUI: PaymentTypeUI;
}) {
  const currencyFmt = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );
  const { t } = useTranslation();
  const NO_CONCEPTO = t("document.noConcepto") || "Sin Concepto";
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();

  const needsBank = (m: PaymentMethod) =>
    m === "cheque" || m === "transferencia";

  // ===== Validación por fila =====
  // ===== Validación por fila =====
  const rowErrors = newValues.map((v) => {
    const bankErr = needsBank(v.method) && !(v.bank || "").trim();
    const chequeNumErr =
      v.method === "cheque" && !(v.chequeNumber || "").trim();
    const chequeDateErr = v.method === "cheque" && !(v.chequeDate || "").trim();

    // Monto requerido (> 0). En cheque se valida el ORIGINAL (rawAmount)
    const amountStr =
      v.method === "cheque" ? v.raw_amount ?? v.amount ?? "" : v.amount ?? "";
    const amountNum = parseFloat((amountStr || "").replace(",", "."));
    const amountErr = !Number.isFinite(amountNum) || amountNum <= 0;

    return {
      bank: bankErr,
      chequeNumber: chequeNumErr,
      chequeDate: chequeDateErr,
      amount: amountErr,
    };
  });

  const [digitsByRow, setDigitsByRow] = useState<Record<number, string>>({});
  // Solo dígitos
  const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

  // ===== Helpers promo cheques =====
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  function toYMD(dOrStr: string | Date): Date {
    if (typeof dOrStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dOrStr)) {
      const [y, m, d] = dOrStr.split("-").map(Number);
      return new Date(y, m - 1, d); // <-- crea fecha local sin TZ shift
    }
    const d = new Date(dOrStr);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  /** Estima fecha de emisión tomando el mínimo days de los docs seleccionados */
  function inferInvoiceIssueDate(receipt: Date, minDays?: number) {
    if (typeof minDays !== "number" || !isFinite(minDays)) return undefined;
    return toYMD(new Date(receipt.getTime() - minDays * MS_PER_DAY));
  }

  /** Reglas:
   * A) 0–7 días la factura (al recibo) Y cheque ≤30 días desde emisión → 13%
   * B) 7–15 días la factura (al recibo) Y cheque al día (mismo día recibo) → 13%
   * C) 15–30 días la factura (al recibo) Y cheque al día → 10%
   */
  const clampInt = (n?: number) =>
    typeof n === "number" && isFinite(n)
      ? Math.max(0, Math.round(n))
      : undefined;

  function toYMDLocal(x: Date | string) {
    // ✅ evita problemas de UTC con strings "YYYY-MM-DD"
    const d =
      typeof x === "string"
        ? new Date(`${x}T00:00:00`)
        : x instanceof Date
        ? x
        : new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function dayDiffCalendar(a: Date, b: Date) {
    const A = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
    const B = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
    return Math.round((A - B) / MS_PER_DAY);
  }

  function isSameDayLooseCheque(
    chequeISO?: string,
    receipt: Date = new Date()
  ) {
    if (!chequeISO) return false;
    const cd = toYMDLocal(chequeISO);
    const rd = toYMDLocal(receipt);
    // ±1 día calendario
    return Math.abs(dayDiffCalendar(cd, rd)) <= 1;
  }

  const nominalOfValue = (v: ValueItem) => {
    if (v.method === "cheque") {
      const raw = (v.raw_amount ?? "").trim();
      return raw !== "" ? toNum(raw) : toNum(v.amount);
    }
    return toNum(v.amount);
  };

  function getChequePromoRate({
    paymentType,
    invoiceAgeAtReceiptDaysMin,
    invoiceIssueDateApprox,
    receiptDate,
    chequeDateISO,
    promoWindowDays = 30,
  }: {
    paymentType: PaymentTypeUI;
    invoiceAgeAtReceiptDaysMin?: number;
    invoiceIssueDateApprox?: Date;
    receiptDate: Date;
    chequeDateISO?: string;
    promoWindowDays?: number;
  }) {
    // ✅ Solo aplica a Cuenta Corriente
    if (paymentType !== "cta_cte") return 0;
    if (!chequeDateISO) return 0;

    const cd = toYMDLocal(chequeDateISO);
    const rd = toYMDLocal(receiptDate);
    const age = clampInt(invoiceAgeAtReceiptDaysMin);

    // ✅ “cheque al día” = hoy o mañana (±1 día calendario)
    const isSameDayLoose = Math.abs(dayDiffCalendar(cd, rd)) <= 1;

    // ✅ Ventana de 30 días desde emisión (aprox)
    const daysFromIssueToCheque =
      invoiceIssueDateApprox instanceof Date
        ? dayDiffCalendar(cd, toYMDLocal(invoiceIssueDateApprox))
        : undefined;

    // si no hay issueDateApprox no podemos aplicar “antes de 30 días desde factura”
    if (typeof daysFromIssueToCheque !== "number") return 0;

    // debe ser entre 0 y promoWindowDays días desde emisión
    if (daysFromIssueToCheque > promoWindowDays) return 0;

    // si no hay age, no se puede decidir el tramo por reglas
    if (typeof age !== "number") return 0;

    // =========================
    // REGLAS NUEVAS (CTA CTE)
    // =========================

    // 1) Factura <= 7 días:
    //    cualquier cheque dentro de 30 días desde emisión => 13%
    if (age >= 0 && age <= 7) {
      return 0.13;
    }

    // 2) Factura 8–15 días:
    //    - al día => 13%
    //    - NO al día => 10%
    if (age > 7 && age <= 15) {
      return isSameDayLoose ? 0.13 : 0.1;
    }
    console.log(promoWindowDays);
    // 3) Factura 16–30 días:
    //    - al día => 10%
    //    - NO al día => 10% (igual)
    if (age > 15 && age <= promoWindowDays) {
      return 0.1;
    }

    return 0;
  }

  /** Base nominal para promo: raw_amount si existe (>0), si no, neto */
  const promoBaseOf = (v: ValueItem) => {
    const raw = Number((v.raw_amount ?? "").replace(",", ".")) || 0;
    if (raw > 0) return raw;
    return Number((v.amount ?? "").replace(",", ".")) || 0;
  };

  const formatDigitsAsCurrencyAR = (digits: string) => {
    if (!digits) return ""; // << vacío hasta que escribís
    const cents = digits.slice(-2).padStart(2, "0");
    let int = digits.slice(0, -2) || "0";
    int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${int},${cents}`;
  };

  const numberToDigitsStr = (n: number) => String(Math.round((n || 0) * 100));

  const hasErrors = rowErrors.some(
    (e) => e.bank || e.chequeNumber || e.chequeDate || e.amount
  );

  useEffect(() => {
    onValidityChange?.(!hasErrors);
  }, [hasErrors, onValidityChange]);

  const toNum = (s?: string) =>
    Number.parseFloat((s ?? "").replace(",", ".")) || 0;

  /** Convierte cualquier input del usuario a un número en pesos con 2 decimales.
   *  Ej: "1234" -> 12.34 ; "1.234,5" -> 1234.50 ; "12,34" -> 12.34
   */
  const parseMaskedCurrencyToNumber = (raw: string): number => {
    const digits = (raw || "").replace(/\D/g, ""); // solo dígitos
    if (!digits) return 0;
    const cents = digits.slice(-2).padStart(2, "0"); // siempre 2 decimales
    const int = digits.slice(0, -2) || "0";
    return Number(`${int}.${cents}`);
  };

  /** Formatea número a moneda AR con 2 decimales, p.ej. "$ 1.232.312,00" */
  const formatCurrencyAR = (n: number, fmt: Intl.NumberFormat) =>
    n === 0 ? "$ 0,00" : fmt.format(n);

  /** Dado un string numérico interno (ej "1234.56") devuelve el texto formateado */
  const formatInternalString = (
    s: string | undefined,
    fmt: Intl.NumberFormat
  ) => formatCurrencyAR(Number(s || 0), fmt);

  const handleAmountChangeMasked = (
    idx: number,
    input: string,
    v: ValueItem
  ) => {
    const n = parseMaskedCurrencyToNumber(input); // número en pesos

    if (v.method !== "cheque") {
      // Guardamos internamente con punto decimal y 2 decimales
      patchRow(idx, { amount: n.toFixed(2), raw_amount: undefined });
      return;
    }

    // Para cheques, el input controla el "monto original" (rawAmount)
    const { neto } = computeChequeNeto(
      n.toFixed(2),
      v.chequeDate ? v : { ...v, chequeDate: "" }
    ); // 👈
    patchRow(idx, {
      raw_amount: n.toFixed(2),
      amount: neto.toFixed(2),
    });
  };

  // ===== Cálculo interés simple cheques =====

  function normalizeAnnualPct(x: number) {
    // Si viene como fracción diaria (0 < x < 1), convierto a % anual
    if (x > 0 && x < 1) return x * 365 * 100;
    return x; // ya es % anual
  }

  const dailyRateFromAnnual = (annualInterestPct: number) => {
    const annualPct = normalizeAnnualPct(annualInterestPct); // % anual
    return annualPct / 100 / 365; // fracción diaria
  };
  const dailyRate = dailyRateFromAnnual(annualInterestPct);

  const daysBetweenToday = (iso?: string) => diffFromTodayToDate(iso);

  // Fecha de emisión estimada
  const invoiceIssueDateApprox = useMemo(
    () => inferInvoiceIssueDate(receiptDate, docsDaysMin),
    [receiptDate, docsDaysMin]
  );

  /**
   * Nueva regla:
   * - Si NO tenemos fecha aproximada de emisión (invoiceIssueDateApprox) o NO hay chequeDate,
   *   caemos a 0 días gravados (o si querés, podés caer a la lógica anterior).
   * - Si la fecha de cobro (cd) es <= (emisión + 45 días), NO cobra CF (0 días).
   * - Si la fecha de cobro (cd) es  > (emisión + 45 días), cobra CF por TODOS los días del cheque:
   *     días_cheque = diff(receiptDate -> chequeDate)
   */

  const isRefinanciacion = (v: ValueItem) =>
    (v.selectedReason || "").trim().toLowerCase() ===
    "refinanciación".toLowerCase();

  const addDays = (d: Date, n: number) => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() + n);
    return x;
  };
  const clampNonNegInt = (x: number) =>
    Math.max(0, Math.round(Number.isFinite(x) ? x : 0));

  function chargeableDaysFor(v: ValueItem) {
    if (v.method !== "cheque") return 0;
    if (!v.chequeDate) return 0;

    const cd = toYMD(v.chequeDate); // fecha cobro del cheque
    const rd = toYMD(receiptDate); // fecha del recibo (hoy)
    const daysCheque = clampNonNegInt(
      (cd.getTime() - rd.getTime()) / MS_PER_DAY
    );

    // Refinanciación: siempre cobrar los días del cheque (si es al día, será 0)
    if (isRefinanciacion(v)) return daysCheque;

    const issue = invoiceIssueDateApprox;
    if (!issue) return daysCheque; // si no sabemos emisión, política conservadora

    const threshold45 = addDays(issue, 45);

    // 1) Si el cobro es en/antes del día 45 desde emisión → 0
    if (cd.getTime() <= threshold45.getTime()) return 0;

    // 2) Si ya pasamos el umbral al momento del recibo → cobrar SOLO días del cheque
    if (rd.getTime() >= threshold45.getTime()) return daysCheque;

    // 3) El umbral cae entre recibo y cheque → cobrar desde el umbral hasta el cheque
    return clampNonNegInt((cd.getTime() - threshold45.getTime()) / MS_PER_DAY);
  }

  const chequeInterest = (v: ValueItem) => {
    if (v.method !== "cheque") return 0;
    if (blockChequeInterest) return 0;
    const base = toNum(v.raw_amount ?? v.amount);
    if (!base) return 0;
    const pct = dailyRate * chargeableDaysFor(v); // 👈 antes usaba la global
    return +(base * pct).toFixed(2);
  };

  const computeChequeNeto = (raw: string, v: ValueItem) => {
    const base = toNum(raw);
    if (blockChequeInterest) {
      // NEW: sin recargo → neto = bruto
      return { neto: base, int$: 0 };
    }
    const int$ = +(base * (dailyRate * chargeableDaysFor(v))).toFixed(2); // 👈
    const neto = Math.max(0, +(base - int$).toFixed(2));
    return { neto, int$ };
  };

  const [isEditing, setIsEditing] = useState<Record<number, boolean>>({});
  const [draftText, setDraftText] = useState<Record<number, string>>({});

  const startEdit = (i: number, v: ValueItem) => {
    const current = v.method === "cheque" ? v.raw_amount ?? v.amount : v.amount;
    const n = parseMaskedCurrencyToNumber(current ?? "");
    const digits = n === 0 ? "" : numberToDigitsStr(n);
    setDigitsByRow((d) => ({ ...d, [i]: digits }));
    setDraftText((d) => ({ ...d, [i]: formatDigitsAsCurrencyAR(digits) }));
    setIsEditing((e) => ({ ...e, [i]: true }));
  };

  const endEdit = (i: number, v: ValueItem) => {
    const masked = draftText[i] ?? "";
    handleAmountChangeMasked(i, masked, v);
    setIsEditing((e) => ({ ...e, [i]: false }));
    setDraftText((d) => {
      const c = { ...d };
      delete c[i];
      return c;
    });
    setDigitsByRow((d) => {
      const c = { ...d };
      delete c[i];
      return c;
    });
  };
  const round2 = (n: number) => Math.round(n * 100) / 100;

  const applyMaskedEdit = (
    rowIndex: number,
    nextDigits: string,
    v: ValueItem,
    inputEl?: HTMLInputElement | null
  ) => {
    const masked = formatDigitsAsCurrencyAR(nextDigits);
    setDigitsByRow((m) => ({ ...m, [rowIndex]: nextDigits }));
    setDraftText((d) => ({ ...d, [rowIndex]: masked }));
    handleAmountChangeMasked(rowIndex, masked, v);

    // Forzar caret al final
    if (inputEl) {
      requestAnimationFrame(() => {
        const len = masked.length;
        inputEl.setSelectionRange(len, len);
      });
    }
  };
  const inputRef = useRef<HTMLInputElement | null>(null);
  // ===== Totales =====
  const totalValues = useMemo(
    () => newValues.reduce((acc, v) => acc + toNum(v.amount), 0),
    [newValues]
  );
  const nominalOf = (v: ValueItem) => {
    if (v.method === "cheque") {
      const raw = (v.raw_amount ?? "").trim();
      return raw !== "" ? toNum(raw) : toNum(v.amount);
    }
    return toNum(v.amount);
  };

  // Total NOMINAL solo para mostrar (cheques por raw_amount)
  const totalNominalValues = useMemo(
    () => newValues.reduce((acc, v) => acc + nominalOf(v), 0),
    [newValues]
  );

  const totalChequeInterest = useMemo(
    () =>
      newValues.reduce((acc, v) => {
        if (v.method !== "cheque") return acc;
        return acc + chequeInterest(v); // devolverá 0 si blockChequeInterest
      }, 0),
    [newValues, blockChequeInterest] // NEW: depende del flag
  );

  // Promo por cheque (suma)

  const hasCheques = useMemo(
    () => newValues.some((v) => v.method === "cheque"),
    [newValues]
  );

  // ===== Descuento/recargo aplicado a valores (igual lógica que handleCreatePayment) =====
  const valuesNominal = useMemo(
    () => round2(totalNominalValues),
    [totalNominalValues]
  );

  const valuesNetTotal = useMemo(
    () =>
      round2(
        newValues.reduce(
          (acc, v) => acc + (parseFloat(v.amount || "0") || 0),
          0
        )
      ),
    [newValues]
  );

  const valuesNetNonCheque = useMemo(
    () =>
      round2(
        newValues.reduce(
          (acc, v) =>
            acc +
            (v.method !== "cheque" ? parseFloat(v.amount || "0") || 0 : 0),
          0
        )
      ),
    [newValues]
  );

  // ✅ Nominal SOLO de cheques al día (±1)
  const valuesNominalSameDayCheques = useMemo(() => {
    return round2(
      newValues.reduce((acc, v) => {
        if (v.method !== "cheque") return acc;
        if (!isSameDayLooseCheque(v.chequeDate, receiptDate)) return acc;
        return acc + nominalOfValue(v);
      }, 0)
    );
  }, [newValues, receiptDate]);

  // ✅ Base para manual10: efectivo/transfer (neto) + cheques al día (nominal)
  const valuesBaseForManual10 = useMemo(() => {
    return round2(valuesNetNonCheque + valuesNominalSameDayCheques);
  }, [valuesNetNonCheque, valuesNominalSameDayCheques]);

  // Neto aportado por valores (nominal - interés cheques)
  const netFromValues = useMemo(
    () => round2(valuesNominal - Math.abs(totalChequeInterest || 0)),
    [valuesNominal, totalChequeInterest]
  );

  const isDiscountContext = docAdjustmentSigned > 0;
  const isSurchargeContext = docAdjustmentSigned < 0;

  const rate = gross > 0 ? docAdjustmentSigned / gross : 0;

  // Total a pagar (docsFinal) para comparar cuando hay DESCUENTO sin cheques
  const totalToPay = round2(netToPay || 0);

  // Umbral: si hay DESCUENTO y NO hay cheques → comparar contra docsFinal, si no → gross
  const threshold =
    isDiscountContext && !hasCheques ? totalToPay : round2(gross);

  // comparación en centavos
  const valuesDoNotReachTotal =
    Math.round(netFromValues * 100) < Math.round(threshold * 100);

  const discountAppliedToValues = useMemo(() => {
    let discountAmt = 0;

    if (isDiscountContext) {
      const discountOnCashOnly = -round2(valuesNetNonCheque * rate);

      if (hasCheques) {
        // ✅ MIXTO (hay cheques)
        if (applyManualTenToCheques) {
          // ✅ aplicar manual10 SOLO a cheques al día (±1) + efectivo/transfer
          discountAmt = -round2(valuesBaseForManual10 * rate);
        } else {
          // ✅ default: solo efectivo/transfer
          discountAmt = discountOnCashOnly;
        }
      } else {
        // ✅ SIN cheques
        discountAmt = valuesDoNotReachTotal
          ? discountOnCashOnly
          : -round2(docAdjustmentSigned);
      }
    } else if (isSurchargeContext) {
      // recargo (mantengo tu lógica)
      const recargoSobreValores = -1 * (valuesNetTotal * rate);
      discountAmt = valuesDoNotReachTotal
        ? recargoSobreValores
        : -round2(docAdjustmentSigned);
    }

    return round2(discountAmt);
  }, [
    isDiscountContext,
    isSurchargeContext,
    hasCheques,
    applyManualTenToCheques,
    valuesNominal,
    valuesNetNonCheque,
    valuesNetTotal,
    valuesBaseForManual10,
    rate,
    valuesDoNotReachTotal,
    docAdjustmentSigned,
  ]);

  const EPS = 1; // tolerancia de $1
  const reachesNetToPay = Math.abs(totalNominalValues - (netToPay || 0)) <= EPS;
  const shouldApplyChequePromo = !(
    docAdjustmentSigned > 0 &&
    hasCheques &&
    reachesNetToPay
  );
  const chequePromoItems = useMemo(() => {
    if (!shouldApplyChequePromo) {
      // mismo shape, pero todo en 0 para no romper la UI
      return newValues.map(() => ({ rate: 0, amount: 0 }));
    }
    return newValues.map((v) => {
      if (v.method !== "cheque") return { rate: 0, amount: 0 };
      const promoWindowDays = applyManualTenToCheques ? 37 : 30;

      const rate = getChequePromoRate({
        paymentType: paymentTypeUI, // <- tenés que recibirlo por props (ver abajo)
        invoiceAgeAtReceiptDaysMin: docsDaysMin,
        invoiceIssueDateApprox,
        receiptDate,
        chequeDateISO: v.chequeDate,
        promoWindowDays,
      });

      const base = promoBaseOf(v);
      const amount = +(base * rate).toFixed(2); // descuento
      return { rate, amount };
    });
  }, [
    newValues,
    docsDaysMin,
    invoiceIssueDateApprox,
    receiptDate,
    shouldApplyChequePromo,
    paymentTypeUI,
    applyManualTenToCheques,
  ]);

  const totalChequePromo = useMemo(
    () =>
      chequePromoItems.reduce(
        (acc, x) => acc + (x.amount > 0 ? x.amount : 0),
        0
      ),
    [chequePromoItems]
  );

  const totalDescCostF = useMemo(
    () => totalChequeInterest + -docAdjustmentSigned - totalChequePromo,
    [docAdjustmentSigned, totalChequeInterest, totalChequePromo]
  );

  const netToApply = useMemo(
    () => +(totalNominalValues - totalDescCostF).toFixed(2),
    [totalNominalValues, totalDescCostF]
  );
  const saldo = useMemo(
    () => +(gross - netToApply).toFixed(2),
    [gross, netToApply]
  );

  const saldoAPagarHoy = useMemo(() => {
    // netToPay = total a pagar según documentos
    // totalValues = total de TODOS los pagos (incluye cheques por neto)
    return round2((netToPay || 0) - totalValues);
  }, [netToPay, totalValues]);

  const isImage = (url?: string) =>
    !!url && !url.toLowerCase().endsWith(".pdf");

  // ===== Handlers =====

  const MAX_FILE_MB = 15;

  const clearReceipt = (idx: number) => {
    patchRow(idx, {
      receiptUrl: undefined,
      receiptOriginalName: undefined,
    });
  };

  const addRow = () => {
    setNewValues((prev) => {
      const next = [
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
      ];
      // abrir la nueva fila (último índice)
      // setOpenRows((o) => ({ ...o, [next.length - 1]: true }));
      return next;
    });
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

  const handleMethodChange = (
    idx: number,
    method: PaymentMethod,
    v: ValueItem
  ) => {
    if (method !== "cheque") {
      patchRow(idx, { method, raw_amount: undefined });
      return;
    }
    const raw = v.raw_amount ?? v.amount ?? "0";
    const { neto } = computeChequeNeto(
      raw,
      v.chequeDate ? v : { ...v, chequeDate: "" }
    ); // 👈
    patchRow(idx, { method, raw_amount: raw, amount: neto.toFixed(2) });
  };

  const handleChequeDateChange = (idx: number, iso: string, v: ValueItem) => {
    if (v.method === "cheque") {
      const raw = v.raw_amount ?? v.amount ?? "0";
      const { neto } = computeChequeNeto(raw, { ...v, chequeDate: iso }); // 👈
      patchRow(idx, {
        chequeDate: iso,
        raw_amount: raw,
        amount: neto.toFixed(2),
      });
      return;
    }
  };

  const [openRows, setOpenRows] = useState<Record<number, boolean>>({});
  const isOpen = (i: number) => !!openRows[i];
  const toggleRow = (i: number) =>
    setOpenRows((prev) => ({ ...prev, [i]: !prev[i] }));

  const [summaryOpenRows, setSummaryOpenRows] = useState<
    Record<number, boolean>
  >({});
  const isSummaryOpen = (i: number) => !!summaryOpenRows[i];
  const toggleSummary = (i: number) =>
    setSummaryOpenRows((prev) => ({ ...prev, [i]: !prev[i] }));

  // --- helper para redondear a 2 decimales sin drift

  // Evitar aplicar el ajuste dos veces con el mismo saldo
  const autoFixAppliedRef = useRef(false);

  useEffect(() => {
    const abs = Math.abs(saldo);

    // reset de la traba si el saldo es grande (no aplicable) o ya quedó en cero
    if (abs >= 1 || saldo === 0) {
      autoFixAppliedRef.current = false;
      return;
    }

    // aplicar solo si hay diferencia menor a $1 y aún no lo hicimos
    if (
      abs > 0 &&
      abs < 1 &&
      !autoFixAppliedRef.current &&
      newValues.length > 0
    ) {
      autoFixAppliedRef.current = true;

      const delta = round2(saldo); // si es >0 falta imputar; si es <0 sobra

      setNewValues((prev) => {
        const clone = [...prev];
        const i = clone.length - 1;
        const v = clone[i];

        // nuevo neto del ítem (clamp a 0 para no dejar montos negativos)
        const newAmount = Math.max(0, round2((Number(v.amount) || 0) + delta));

        // anotamos el concepto para rastrear el ajuste
        const concept = (v.selectedReason || NO_CONCEPTO).includes(
          "(ajuste redondeo)"
        )
          ? v.selectedReason
          : `${v.selectedReason || NO_CONCEPTO} (ajuste redondeo)`;

        // En cheques: ajustamos el neto imputable (amount).
        // (No tocamos rawAmount; el cambio es < $1 y el costo financiero no varía en la práctica)
        clone[i] = {
          ...v,
          amount: newAmount.toFixed(2),
          selectedReason: concept,
        };

        return clone;
      });
    }
  }, [saldo, newValues.length, setNewValues]);

  const getMethodColor = (method: string) => {
    const colors: { [key: string]: string } = {
      efectivo: "from-green-500 to-emerald-600",
      transferencia: "from-blue-500 to-cyan-600",
      cheque: "from-yellow-500 to-orange-600",
    };
    return colors[method] || "from-gray-500 to-gray-600";
  };

  const getMethodIcon = (method: string) => {
    const icons: { [key: string]: string } = {
      efectivo: "💵",
      transferencia: "🏦",
      cheque: "📝",
    };
    return icons[method] || "💳";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-bold bg-[#E10600] bg-clip-text text-transparent">
          Pagos
        </h4>
      </div>

      {newValues.length === 0 && (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
          <div className="text-6xl mb-4">💳</div>
          <p className="text-gray-600 font-medium">No hay pagos cargados.</p>
          <p className="text-sm text-gray-500 mt-2">
            Agrega un pago para continuar
          </p>
        </div>
      )}

      <div className="space-y-4">
        {newValues.map((v, idx) => {
          const showBank =
            v.method === "transferencia" || v.method === "cheque";
          const daysTotal = daysBetweenToday(v.chequeDate);
          const daysGrav =
            v.method === "cheque"
              ? blockChequeInterest
                ? 0
                : chargeableDaysFor(v)
              : 0;
          const pctInt =
            v.method === "cheque"
              ? blockChequeInterest
                ? 0
                : dailyRate * daysGrav
              : 0;
          const interest$ = v.method === "cheque" ? chequeInterest(v) : 0;
          const shownAmountInput =
            v.method === "cheque" ? v.raw_amount ?? v.amount : v.amount;
          const hasRowError =
            rowErrors[idx].amount ||
            rowErrors[idx].bank ||
            rowErrors[idx].chequeNumber ||
            rowErrors[idx].chequeDate;

          return (
            <div
              key={idx}
              className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
                hasRowError
                  ? "ring-2 ring-red-500 ring-offset-2"
                  : "hover:shadow-xl"
              }`}
            >
              {/* CABECERA */}
              <div
                className={`bg-gradient-to-r ${getMethodColor(
                  v.method
                )} px-6 py-4`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  {/* Método de pago */}
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-3xl">{getMethodIcon(v.method)}</span>
                    <div className="flex-1">
                      <label className="block text-xs text-white/80 mb-1 font-semibold">
                        Medio de pago
                      </label>
                      <select
                        value={v.method}
                        onChange={(e) =>
                          handleMethodChange(
                            idx,
                            e.target.value as PaymentMethod,
                            v
                          )
                        }
                        className="w-full rounded-xl border-0 bg-white/20 backdrop-blur-sm text-white font-bold px-4 py-2 focus:ring-2 focus:ring-white/50 focus:outline-none"
                      >
                        <option value="efectivo" className="text-gray-900">
                          💵 Efectivo
                        </option>
                        <option value="transferencia" className="text-gray-900">
                          🏦 Transferencia
                        </option>
                        <option value="cheque" className="text-gray-900">
                          📝 Cheque
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    {hasRowError && (
                      <span className="text-xs bg-red-500 text-white px-3 py-1 rounded-full font-semibold">
                        ⚠️ Datos incompletos
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleRow(idx)}
                      className={`p-2 rounded-full transition-all ${
                        isOpen(idx)
                          ? "bg-white/30 text-white"
                          : "bg-white/10 text-white/80 hover:bg-white/20"
                      }`}
                    >
                      <svg
                        viewBox="0 0 20 20"
                        className={`w-5 h-5 transition-transform duration-300 ${
                          isOpen(idx) ? "rotate-180" : ""
                        }`}
                        fill="currentColor"
                      >
                        <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 0 1 .94 1.17l-4.24 3.36a.75.75 0 0 1-.94 0L5.21 8.4a.75.75 0 0 1 .02-1.19z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => removeRow(idx)}
                      className="px-4 py-2 rounded-full bg-red-500/20 backdrop-blur-sm text-white hover:bg-red-500/30 transition-colors font-semibold"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>

              {isOpen(idx) && (
                <div className="bg-white p-6 space-y-4">
                  {/* Monto */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2 font-bold">
                      <LabelWithTip
                        label={
                          v.method === "cheque" ? "💰 Monto Bruto" : "💰 Monto"
                        }
                        tip={
                          v.method === "cheque"
                            ? EXPLAIN.chequeMontoOriginal
                            : EXPLAIN.totalPagado
                        }
                      />
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="numeric"
                      placeholder="$ 0,00"
                      value={
                        isEditing[idx]
                          ? draftText[idx] ?? ""
                          : shownAmountInput?.trim()
                          ? formatInternalString(shownAmountInput, currencyFmt)
                          : ""
                      }
                      onFocus={() => {
                        startEdit(idx, v);
                        requestAnimationFrame(() => {
                          const masked = formatDigitsAsCurrencyAR(
                            digitsByRow[idx] || ""
                          );
                          const el = inputRef.current;
                          if (el) {
                            const len = masked.length;
                            el.setSelectionRange(len, len);
                          }
                        });
                      }}
                      onKeyDown={(e) => {
                        const el = inputRef.current;
                        const key = e.key;

                        if (!isEditing[idx]) return;

                        if (key === "Enter") {
                          e.preventDefault();
                          el?.blur();
                          return;
                        }
                        if (key === "Escape") {
                          e.preventDefault();
                          setIsEditing((E) => ({ ...E, [idx]: false }));
                          setDraftText((d) => {
                            const c = { ...d };
                            delete c[idx];
                            return c;
                          });
                          setDigitsByRow((d) => {
                            const c = { ...d };
                            delete c[idx];
                            return c;
                          });
                          return;
                        }

                        if (key === "Backspace") {
                          e.preventDefault();
                          const prev = digitsByRow[idx] ?? "";
                          const next = prev.slice(0, -1);
                          applyMaskedEdit(idx, next, v, el);
                          return;
                        }

                        if (/^\d$/.test(key)) {
                          e.preventDefault();
                          const prev = digitsByRow[idx] ?? "";
                          const next = prev + key;
                          applyMaskedEdit(idx, next, v, el);
                          return;
                        }

                        if (key.length === 1 && !/^\d$/.test(key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={() => {}}
                      onBlur={() => endEdit(idx, v)}
                      className={`w-full px-4 py-3 rounded-xl text-gray-900 font-bold text-lg outline-none transition-all ${
                        rowErrors[idx].amount
                          ? "bg-red-50 border-2 border-red-500 focus:ring-2 focus:ring-red-500"
                          : "bg-gray-100 border-2 border-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      }`}
                    />
                  </div>
                  {/* N° de cheque */}
                  {v.method === "cheque" && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-2 font-bold">
                        <LabelWithTip
                          label="🔢 N° de cheque"
                          tip={EXPLAIN.numeroCheque}
                        />
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={v.chequeNumber || ""}
                        onChange={(e) =>
                          patchRow(idx, {
                            chequeNumber: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 20),
                          })
                        }
                        className={`w-full px-4 py-3 rounded-xl text-gray-900 font-medium outline-none transition-all ${
                          rowErrors[idx].chequeNumber
                            ? "bg-red-50 border-2 border-red-500"
                            : "bg-gray-100 border-2 border-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        }`}
                      />
                    </div>
                  )}

                  {/* Fecha de cobro */}
                  {v.method === "cheque" && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-2 font-bold">
                        <LabelWithTip
                          label="📅 Fecha de cobro"
                          tip={EXPLAIN.fechaCobro}
                        />
                      </label>
                      <input
                        type="date"
                        required
                        value={v.chequeDate || ""}
                        onChange={(e) =>
                          handleChequeDateChange(idx, e.target.value, v)
                        }
                        className={`w-full px-4 py-3 rounded-xl text-gray-900 font-medium outline-none transition-all ${
                          rowErrors[idx].chequeDate
                            ? "bg-red-50 border-2 border-red-500"
                            : "bg-gray-100 border-2 border-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        }`}
                      />
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                        <Tip
                          text={`${EXPLAIN.chequeDiasTotales} • ${EXPLAIN.chequeGracia}`}
                        >
                          📊 Días totales:{" "}
                          <span className="font-bold">{daysTotal}</span> ·
                          Gracia:{" "}
                          <span className="font-bold">
                            {chequeGraceDays ?? 45}
                          </span>
                        </Tip>
                      </div>
                    </div>
                  )}

                  {/* Banco */}
                  {showBank && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-2 font-bold">
                        <LabelWithTip label="🏦 Banco" tip={EXPLAIN.banco} />
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Banco Galicia"
                        value={v.bank || ""}
                        onChange={(e) =>
                          patchRow(idx, { bank: e.target.value })
                        }
                        className={`w-full px-4 py-3 rounded-xl text-gray-900 font-medium outline-none transition-all ${
                          rowErrors[idx].bank
                            ? "bg-red-50 border-2 border-red-500"
                            : "bg-gray-100 border-2 border-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        }`}
                      />
                    </div>
                  )}

                  {/* Comprobante (si corresponde) */}
                  {showBank && (
                    <div className="border-2 border-gray-200 rounded-2xl p-5 bg-gradient-to-br from-gray-50 to-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-gray-700">
                          📎 Comprobante
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {v.receiptOriginalName || "Sin adjuntar"}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <label className="inline-flex cursor-pointer rounded-xl px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-sm transition-all">
                          {v.receiptUrl
                            ? isUploading
                              ? "⏳ Subiendo..."
                              : "🔄 Reemplazar"
                            : isUploading
                            ? "⏳ Subiendo..."
                            : "📤 Adjuntar"}
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              e.currentTarget.value = "";
                              if (!file) return;

                              if (file.size > MAX_FILE_MB * 1024 * 1024) {
                                alert(`El archivo supera ${MAX_FILE_MB} MB.`);
                                return;
                              }
                              if (
                                !(
                                  file.type.startsWith("image/") ||
                                  file.type === "application/pdf"
                                )
                              ) {
                                alert(
                                  "Formato no soportado. Usá imagen o PDF."
                                );
                                return;
                              }

                              try {
                                const res = await uploadImage(file).unwrap();
                                const url =
                                  (res as any)?.secure_url ??
                                  (res as any)?.url ??
                                  (res as any)?.data?.secure_url ??
                                  (res as any)?.data?.url;
                                if (!url)
                                  throw new Error(
                                    "No se recibió URL del servidor."
                                  );

                                patchRow(idx, {
                                  receiptUrl: url,
                                  receiptOriginalName: file.name,
                                });
                              } catch (err) {
                                console.error(
                                  "Falló la subida del comprobante:",
                                  err
                                );
                                alert("No se pudo subir el comprobante.");
                              }
                            }}
                          />
                        </label>

                        {v.receiptUrl && (
                          <button
                            type="button"
                            onClick={() => clearReceipt(idx)}
                            className="inline-flex rounded-xl px-4 py-2 bg-red-100 border-2 border-red-500 text-red-600 hover:bg-red-200 font-bold text-sm transition-all"
                            disabled={isUploading}
                          >
                            🗑️ Quitar
                          </button>
                        )}

                        <div className="sm:ml-auto">
                          {v.receiptUrl ? (
                            <div className="flex items-center gap-3">
                              {isImage(v.receiptUrl) ? (
                                <img
                                  src={v.receiptUrl}
                                  alt={v.receiptOriginalName || "Comprobante"}
                                  className="h-14 w-14 object-cover rounded border border-zinc-700"
                                />
                              ) : (
                                <span className="text-xs px-2 py-1 rounded bg-zinc-800 border border-zinc-700">
                                  PDF adjunto
                                </span>
                              )}
                              <a
                                href={v.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-300 underline break-all"
                              >
                                {v.receiptOriginalName || "Ver comprobante"}
                              </a>
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-400">
                              Sin comprobante
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Concepto */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2 font-bold">
                      <LabelWithTip
                        label="📝 Concepto"
                        tip={EXPLAIN.concepto}
                      />
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ej: Pago factura 001-0000123"
                      value={v.selectedReason}
                      onChange={(e) => {
                        const val = e.target.value;
                        patchRow(idx, {
                          selectedReason: val.trim() === "" ? NO_CONCEPTO : val,
                        });
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-gray-100 border-2 border-transparent text-gray-900 font-medium outline-none resize-y focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>

                  {/* Resumen por ítem (una fila por item, expandible) */}
                  {/* Resumen por ítem */}
                  {v.method === "cheque" && (
                    <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-5">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleSummary(idx)}
                          className={`inline-flex items-center gap-2 text-sm rounded-xl px-4 py-2 font-bold transition-all ${
                            isSummaryOpen(idx)
                              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                              : "bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-500"
                          }`}
                        >
                          {isSummaryOpen(idx)
                            ? "👁️ Ocultar detalle"
                            : "👁️‍🗨️ Ver detalle"}
                          <svg
                            viewBox="0 0 20 20"
                            className={`w-4 h-4 transition-transform duration-300 ${
                              isSummaryOpen(idx) ? "rotate-180" : ""
                            }`}
                            fill="currentColor"
                          >
                            <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 0 1 .94 1.17l-4.24 3.36a.75.75 0 0 1-.94 0L5.21 8.4a.75.75 0 0 1 .02-1.19z" />
                          </svg>
                        </button>
                      </div>

                      {/* detalle expandible */}
                      {isSummaryOpen(idx) && (
                        <div className="mt-4 space-y-3 text-sm">
                          <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                            <span className="text-gray-700 font-semibold">
                              💵 Valor Bruto
                            </span>
                            <span className="text-gray-900 font-bold tabular-nums">
                              {currencyFmt.format(
                                toNum(v.raw_amount || v.amount)
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                            <span className="text-gray-700 font-semibold">
                              📅 Días
                            </span>
                            <span className="text-gray-900 font-bold tabular-nums">
                              {Number.isFinite(daysTotal) ? daysTotal : "—"}
                            </span>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                            <span className="text-gray-700 font-semibold">
                              📊 Porcentaje
                            </span>
                            <span className="text-red-600 font-bold tabular-nums">
                              {fmtPctSigned(pctInt)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                            <span className="text-gray-700 font-semibold">
                              💸 Costo financiero
                            </span>
                            <span className="text-red-600 font-bold tabular-nums">
                              {currencyFmt.format(interest$)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                            <span className="text-gray-700 font-semibold">
                              🎁 Promo
                            </span>
                            <span className="text-green-600 font-bold tabular-nums">
                              {(chequePromoItems[idx].rate * 100).toFixed(2)}%
                            </span>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                            <span className="text-gray-700 font-semibold">
                              ✨ Descuento Promo
                            </span>
                            <span className="text-green-600 font-bold tabular-nums">
                              {currencyFmt.format(chequePromoItems[idx].amount)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center">
        <button
          onClick={addRow}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:from-green-600 hover:to-emerald-700 active:scale-95 transition-all shadow-lg text-sm"
        >
          ➕ Agregar pago
        </button>
      </div>

      {/* ===== Resumen inferior ===== */}
      {newValues.length > 0 && (
        <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200 space-y-3">
          <h5 className="text-lg font-bold text-gray-900 mb-4">
            📊 Resumen de Pagos
          </h5>

          <RowSummary
            label={
              <LabelWithTip
                label="TOTAL PAGADO (NOMINAL)"
                tip="Suma de importes originales: para cheques se toma el monto bruto, para otros métodos el monto ingresado."
              />
            }
            value={currencyFmt.format(totalNominalValues)}
          />

          <RowSummary
            label={
              <LabelWithTip
                label="DTO/COSTO FINACIERO"
                tip={EXPLAIN.dtoRecFact}
              />
            }
            value={`${docAdjustmentSigned >= 0 ? "-" : "+"}${currencyFmt.format(
              Math.abs(docAdjustmentSigned)
            )}`}
          />

          {hasCheques && (
            <>
              <RowSummary
                label={
                  <LabelWithTip
                    label="COSTO FINANCIERO (CHEQUES)"
                    tip={EXPLAIN.costFinCheques}
                  />
                }
                value={currencyFmt.format(totalChequeInterest)}
              />

              <RowSummary
                label={
                  <LabelWithTip
                    label="DTO PROMO (CHEQUES)"
                    tip="Descuento promocional aplicado a cheques según reglas de días (0–7/7–15/15–30)."
                  />
                }
                value={`-${currencyFmt.format(totalChequePromo)}`}
              />

              <RowSummary
                label={
                  <LabelWithTip
                    label="TOTAL DESC/COST F."
                    tip={EXPLAIN.totalDescCostF}
                  />
                }
                value={currencyFmt.format(totalDescCostF)}
                bold
              />
            </>
          )}

          <RowSummary
            label={
              <LabelWithTip
                label="SALDO A PAGAR HOY"
                tip="Monto que falta pagar en efectivo o transferencia para cancelar el total a pagar. No incluye cheques (ni al día ni diferidos)."
              />
            }
            value={currencyFmt.format(Math.max(0, saldoAPagarHoy))}
            highlight={saldoAPagarHoy <= 0 ? "ok" : "warn"}
            copy={Math.max(0, saldoAPagarHoy)}
          />
        </div>
      )}

      {hasErrors && (
        <div className="mt-4 bg-red-50 border-2 border-red-500 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <span className="text-sm text-red-700 font-bold">
            {t("document.hayErroresEnValores") ||
              "Hay errores en los pagos cargados"}
          </span>
        </div>
      )}
    </div>
  );
}

const fmtPctSigned = (p: number) =>
  `${p >= 0 ? "+" : ""}${(p * 100).toFixed(2)}%`;

/* ================== UI helpers ================== */

function RowSummary({
  label,
  value,
  bold,
  highlight,
  copy,
}: {
  label: React.ReactNode;
  value: string;
  bold?: boolean;
  highlight?: "ok" | "bad" | "warn";
  copy?: number;
}) {
  const color =
    highlight === "ok"
      ? "text-green-600"
      : highlight === "bad"
      ? "text-red-600"
      : highlight === "warn"
      ? "text-orange-600"
      : "text-gray-900";

  const bgColor =
    highlight === "ok"
      ? "bg-green-50"
      : highlight === "bad"
      ? "bg-red-50"
      : highlight === "warn"
      ? "bg-orange-50"
      : "bg-white";

  return (
    <div
      className={`flex justify-between items-center p-3 rounded-xl ${bgColor} transition-colors`}
    >
      <span
        className={`text-gray-700 ${
          bold ? "font-bold" : "font-semibold"
        } text-sm`}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span
          className={`${color} tabular-nums ${
            bold ? "font-bold" : "font-semibold"
          } text-sm`}
        >
          {value}
        </span>
        {copy !== undefined && copy > 0 && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(copy.toFixed(2));
            }}
            className="p-1 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-all"
            title="Copiar valor"
          >
            📋
          </button>
        )}
      </div>
    </div>
  );
}

function InfoIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.5a.75.75 0 011.5 0v5a.75.75 0 01-1.5 0v-5zM10 6a1 1 0 100-2 1 1 0 000 2z" />
    </svg>
  );
}

/** Tooltip mejorado con diseño moderno */
function Tip({
  text,
  children,
  side = "top",
}: {
  text: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const pos =
    side === "top"
      ? "bottom-full mb-2 left-1/2"
      : side === "bottom"
      ? "top-full mt-2 left-1/2"
      : side === "left"
      ? "right-full mr-2 top-1/2"
      : "left-full ml-2 top-1/2";

  const tipRef = React.useRef<HTMLSpanElement>(null);
  const wrapRef = React.useRef<HTMLSpanElement>(null);

  const clampToViewport = () => {
    const tip = tipRef.current;
    if (!tip) return;

    tip.style.transform =
      side === "left" || side === "right"
        ? "translateY(-50%)"
        : "translateX(-50%)";

    const r = tip.getBoundingClientRect();
    const vw = window.innerWidth;
    const margin = 8;

    if (side === "top" || side === "bottom") {
      let push = 0;
      if (r.left < margin) push = margin - r.left;
      if (r.right > vw - margin) push = -(r.right - (vw - margin));

      if (push !== 0) {
        tip.style.transform = `translateX(calc(-50% + ${push}px))`;
      }
    } else {
      const vh = window.innerHeight;
      let pushY = 0;
      if (r.top < margin) pushY = margin - r.top;
      if (r.bottom > vh - margin) pushY = -(r.bottom - (vh - margin));
      if (pushY !== 0) {
        tip.style.transform = `translateY(calc(-50% + ${pushY}px))`;
      }
    }
  };

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex items-center gap-1 group"
      onMouseEnter={clampToViewport}
      onMouseMove={clampToViewport}
      onFocus={clampToViewport}
    >
      {children}
      <span
        ref={tipRef}
        role="tooltip"
        className={`
          pointer-events-none absolute ${pos} z-50
          min-w-[18rem] max-w-[min(32rem,calc(100vw-1rem))]
          rounded-xl border-2 border-gray-200
          bg-gradient-to-br from-white to-gray-50
          px-4 py-3 text-sm text-gray-700
          text-left whitespace-normal break-words leading-relaxed
          opacity-0 shadow-2xl transition-all duration-200
          group-hover:opacity-100 group-focus-within:opacity-100
          ${
            side === "left" || side === "right"
              ? "-translate-y-1/2"
              : "-translate-x-1/2"
          }
        `}
        title={text}
      >
        <div className="font-medium">{text}</div>
        {/* Flecha decorativa */}
        <span
          className={`absolute w-3 h-3 bg-white border-gray-200 rotate-45 ${
            side === "top"
              ? "bottom-[-7px] left-1/2 -translate-x-1/2 border-b-2 border-r-2"
              : side === "bottom"
              ? "top-[-7px] left-1/2 -translate-x-1/2 border-t-2 border-l-2"
              : side === "left"
              ? "right-[-7px] top-1/2 -translate-y-1/2 border-t-2 border-r-2"
              : "left-[-7px] top-1/2 -translate-y-1/2 border-b-2 border-l-2"
          }`}
        />
      </span>
    </span>
  );
}

/** Etiqueta con ícono + tooltip mejorado */
function LabelWithTip({
  label,
  tip,
  side = "top",
  className = "",
}: {
  label: string;
  tip: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <Tip text={tip} side={side}>
      <span
        className={`inline-flex items-center gap-1.5 cursor-help group ${className}`}
        tabIndex={0}
      >
        <span className="font-semibold">{label}</span>
        <InfoIcon
          className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors"
          aria-hidden="true"
        />
      </span>
    </Tip>
  );
}
/* ===== Textos de ayuda ===== */
const EXPLAIN = {
  totalPagado:
    "Suma de los pagos imputables cargados. Para cheques se toma el monto neto (monto bruto menos costo financiero).",
  dtoRecFact:
    "Ajuste por comprobantes según días y condición de pago: descuento (signo -) o recargo (signo +).",
  saldo:
    "Diferencia entre el total a pagar de documentos (neto) y los pagos imputados. Si es 0, el pago queda cubierto.",
  chequeMontoOriginal:
    "Monto Bruto del cheque ingresado por el usuario (antes del costo financiero).",
  chequeDiasTotales:
    "Días calendario desde hoy hasta la fecha de cobro del cheque.",
  chequeGracia:
    "No se aplica costo financiero si la fecha de cobro del cheque es en o antes del día 45 desde la emisión de la factura. Si se cobra después del día 45, se cobra el costo financiero por todos los días del cheque.",
  chequePorcentaje:
    "Porcentaje de interés simple acumulado: tasa diaria x días gravados.",
  chequeCostoFinanciero:
    "Costo Financiero en pesos aplicado al monto bruto del cheque (monto bruto x porcentaje).",
  chequeNeto: "Monto neto del cheque: monto bruto menos costo financiero.",
  medioPago:
    "Seleccioná el medio de pago. Cheque y transferencia pueden requerir banco y otros datos.",
  banco: "Banco/Sucursal del pago. Requerido para cheque y transferencia.",
  fechaCobro:
    "Fecha de cobro del cheque. Define los días totales y el costo financiero.",
  numeroCheque: "Número del cheque para trazabilidad.",
  concepto: "Detalle o referencia del pago (se usa para notas/comunicaciones).",
  costFinCheques:
    "Suma del costo financiero de todos los cheques (monto bruto x % por días gravados).",
  totalDescCostF:
    "Suma del ajuste por documentos (descuento/recargo) y el costo financiero de cheques.",
};
