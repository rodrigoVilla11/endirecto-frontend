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
};

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
}: {
  newValues: ValueItem[];
  setNewValues: React.Dispatch<React.SetStateAction<ValueItem[]>>;
  annualInterestPct: number;
  docAdjustmentSigned?: number;
  netToPay?: number;
  gross?: number;
  chequeGraceDays?: number;
  onValidityChange?: (isValid: boolean) => void;
}) {

  console.log(newValues)
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
    const { neto } = computeChequeNeto(n.toFixed(2), v.chequeDate ? v : { ...v, chequeDate: "" }); // 👈
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

  const graceFor = (v: ValueItem) =>
    v.selectedReason === "Refinanciación"
      ? (v.overrideGraceDays ?? chequeGraceDays ?? 45)
      : (chequeGraceDays ?? 45);

  const chargeableDaysFor = (v: ValueItem) => {
    const days = diffFromTodayToDate(v.chequeDate);
    const daysNum = typeof days === "number" && Number.isFinite(days) ? days : 0;
    const grace = graceFor(v) ?? 0;
    return Math.max(0, daysNum - grace);
  };

  const chequeInterest = (v: ValueItem) => {
    if (v.method !== "cheque") return 0;
    const base = toNum(v.raw_amount ?? v.amount);
    if (!base) return 0;
    const pct = dailyRate * chargeableDaysFor(v); // 👈 antes usaba la global
    return +(base * pct).toFixed(2);
  };

  const computeChequeNeto = (raw: string, v: ValueItem) => {
    const base = toNum(raw);
    const int$ = +(base * (dailyRate * chargeableDaysFor(v))).toFixed(2); // 👈
    const neto = Math.max(0, +(base - int$).toFixed(2));
    return { neto, int$ };
  };

  const [isEditing, setIsEditing] = useState<Record<number, boolean>>({});
  const [draftText, setDraftText] = useState<Record<number, string>>({});

  const toEditable = (s?: string) => {
    // Convierte "1234.50" a "1.234,50" amigable para AR, o deja vacío si es 0
    const n = parseMaskedCurrencyToNumber(s ?? "");
    if (!n) return "";
    // Usamos coma para decimales al editar
    return n.toFixed(2).replace(".", ",");
  };

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
        return acc + chequeInterest(v);
      }, 0),
    [newValues]
  );

  // Total combinado de ajustes: documentos (+/-) + costo financiero de cheques
  const totalDescCostF = useMemo(
    () => totalChequeInterest + -docAdjustmentSigned,
    [docAdjustmentSigned, totalChequeInterest]
  );

  const hasCheques = useMemo(
    () => newValues.some((v) => v.method === "cheque"),
    [newValues]
  );

  const netToApply = useMemo(
    () => +(totalValues - -docAdjustmentSigned).toFixed(2),
    [totalValues, totalDescCostF]
  );
  const saldo = useMemo(
    () => +(gross - netToApply).toFixed(2),
    [gross, netToApply]
  );

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
      setOpenRows((o) => ({ ...o, [next.length - 1]: true }));
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
  const round2 = (n: number) => Math.round(n * 100) / 100;

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-medium">Pagos</h4>
      </div>

      {newValues.length === 0 && (
        <div className="text-zinc-400 text-sm">No hay pagos cargados.</div>
      )}

      <div className="space-y-2">
        {newValues.map((v, idx) => {
          const showBank =
            v.method === "transferencia" || v.method === "cheque";
          const daysTotal = daysBetweenToday(v.chequeDate);
          const daysGrav = v.method === "cheque" ? chargeableDaysFor(v) : 0; // 👈
          const pctInt = v.method === "cheque" ? dailyRate * daysGrav : 0;
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
              className={`rounded-lg bg-zinc-800/50 p-2 md:p-3 transition-colors
          ${hasRowError ? "border border-red-500" : "border border-zinc-700"}`}
            >
              {/* CABECERA */}
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                {/* Medio de pago */}
                <div className="w-full md:w-72">
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    <LabelWithTip
                      label="Medio de pago"
                      tip={EXPLAIN.medioPago}
                    />
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
                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm px-2 py-1"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                {/* errores / expandir / eliminar */}
                <div className="flex items-center gap-2 md:ml-auto">
                  {hasRowError && (
                    <span className="text-[12px] text-red-400">
                      Faltan datos en este pago
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleRow(idx)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded
                ${
                  isOpen(idx)
                    ? "bg-zinc-700 text-white"
                    : "bg-zinc-700/60 text-zinc-200"
                }
                hover:bg-zinc-600 transition`}
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className={`w-4 h-4 transition-transform ${
                        isOpen(idx) ? "rotate-180" : ""
                      }`}
                      fill="currentColor"
                    >
                      <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 0 1 .94 1.17l-4.24 3.36a.75.75 0 0 1-.94 0L5.21 8.4a.75.75 0 0 1 .02-1.19z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => removeRow(idx)}
                    className="px-3 py-1.5 rounded bg-zinc-700 text-white hover:bg-zinc-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {isOpen(idx) && (
                <div className="mt-3 space-y-3">
                  {/* Monto */}
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      <LabelWithTip
                        label={v.method === "cheque" ? "Monto Bruto" : "Monto"}
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
                        // Llevar cursor al final del texto enmascarado
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

                        // Mientras edito, manejo todo yo
                        if (!isEditing[idx]) return;

                        if (key === "Enter") {
                          e.preventDefault();
                          el?.blur();
                          return;
                        }
                        if (key === "Escape") {
                          e.preventDefault();
                          // cancelar edición
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

                        // Backspace: borro el último dígito
                        if (key === "Backspace") {
                          e.preventDefault();
                          const prev = digitsByRow[idx] ?? "";
                          const next = prev.slice(0, -1);
                          applyMaskedEdit(idx, next, v, el);
                          return;
                        }

                        // Aceptar solo dígitos
                        if (/^\d$/.test(key)) {
                          e.preventDefault();
                          const prev = digitsByRow[idx] ?? "";
                          const next = prev + key;
                          applyMaskedEdit(idx, next, v, el);
                          return;
                        }

                        // Bloqueo todo lo demás (., , , flechas siguen funcionando)
                        if (
                          key.length === 1 && // caracteres imprimibles
                          !/^\d$/.test(key)
                        ) {
                          e.preventDefault();
                        }
                      }}
                      onChange={() => {
                        // No dejamos que el navegador cambie el texto por su cuenta;
                        // todo lo manejamos en onKeyDown + applyMaskedEdit.
                      }}
                      onBlur={() => endEdit(idx, v)}
                      className={`w-full px-2 py-1 rounded text-white outline-none tabular-nums
    ${
      rowErrors[idx].amount
        ? "bg-zinc-700 border border-red-500"
        : "bg-zinc-700 border border-transparent"
    }`}
                    />
                  </div>

                  {/* Solo cheques: N° de cheque */}
                  {v.method === "cheque" && (
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        <LabelWithTip
                          label={t("document.numeroCheque") || "N° de cheque"}
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
                        className={`w-full px-2 py-1 rounded text-white outline-none tabular-nums
            ${
              rowErrors[idx].chequeNumber
                ? "bg-zinc-700 border border-red-500"
                : "bg-zinc-700 border border-transparent"
            }`}
                      />
                    </div>
                  )}

                  {/* Solo cheques: Fecha de cobro */}
                  {v.method === "cheque" && (
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        <LabelWithTip
                          label={t("document.fechaCobro") || "Fecha de cobro"}
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
                        className={`w-full px-2 py-1 rounded text-white outline-none
    ${
      rowErrors[idx].chequeDate
        ? "bg-zinc-700 border border-red-500"
        : "bg-zinc-700 border border-transparent"
    }`}
                      />

                      <div className="mt-1 text-[10px] text-zinc-500">
                        <Tip
                          text={`${EXPLAIN.chequeDiasTotales} • ${EXPLAIN.chequeGracia}`}
                        >
                          Días totales: {daysTotal} · Gracia:{" "}
                          {chequeGraceDays ?? 45}
                        </Tip>
                      </div>
                    </div>
                  )}

                  {/* Solo cheques: Valor neto (read-only) */}
                  {v.method === "cheque" && (
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        <LabelWithTip
                          label="Monto neto"
                          tip="Monto que se imputa después de descontar el costo financiero (se recalcula al cambiar monto/fecha)."
                        />
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={currencyFmt.format(toNum(v.amount))}
                        className="w-full px-2 py-1 rounded bg-zinc-800 text-white outline-none tabular-nums border border-zinc-700"
                        title={currencyFmt.format(toNum(v.amount))}
                      />
                      <div className="mt-1 text-[10px] text-zinc-500">
                        Neto = Monto Bruto − Costo Financiero (%) •{" "}
                        {currencyFmt.format(toNum(v.raw_amount ?? v.amount))} −{" "}
                        {currencyFmt.format(interest$)}
                      </div>
                    </div>
                  )}

                  {/* Banco (si corresponde) */}
                  {showBank && (
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        <LabelWithTip
                          label={t("document.banco") || "Banco"}
                          tip={EXPLAIN.banco}
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Banco Galicia"
                        value={v.bank || ""}
                        onChange={(e) =>
                          patchRow(idx, { bank: e.target.value })
                        }
                        className={`w-full px-2 py-1 rounded text-white outline-none
            ${
              rowErrors[idx].bank
                ? "bg-zinc-700 border border-red-500"
                : "bg-zinc-700 border border-transparent"
            }`}
                      />
                    </div>
                  )}

                  {/* Comprobante (si corresponde) */}
                  {showBank && (
                    <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-800/40">
                      <div className="flex items-center justify-between">
                        <LabelWithTip
                          label="Comprobante"
                          tip="Adjuntá el comprobante de este pago (imagen o PDF). Máx. 15 MB."
                        />
                        <div className="text-xs text-zinc-500">
                          {v.receiptOriginalName
                            ? v.receiptOriginalName
                            : "Sin adjuntar"}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-col sm:flex-row gap-3 sm:items-center">
                        <label className="inline-flex w-max cursor-pointer rounded px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-sm">
                          {v.receiptUrl
                            ? isUploading
                              ? "Subiendo..."
                              : "Reemplazar"
                            : isUploading
                            ? "Subiendo..."
                            : "Adjuntar"}
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
                            className="inline-flex w-max rounded px-3 py-1.5 border border-red-500 text-red-400 hover:bg-red-500/10 text-sm"
                            disabled={isUploading}
                          >
                            Quitar
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
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      <LabelWithTip label="Concepto" tip={EXPLAIN.concepto} />
                    </label>
                    <textarea
                      rows={1}
                      placeholder="Ej: Pago factura 001-0000123"
                      value={v.selectedReason}
                      onChange={(e) => {
                        const val = e.target.value;
                        patchRow(idx, {
                          selectedReason: val.trim() === "" ? NO_CONCEPTO : val,
                        });
                      }}
                      className="w-full px-2 py-1 rounded bg-zinc-700 text-white outline-none resize-y"
                    />
                  </div>

                  {/* Resumen por ítem (una fila por item, expandible) */}
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-3">
                    {/* encabezado con valor neto + toggle */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex justify-between text-sm">
                        <span className="text-zinc-300 font-medium">
                          Valor Neto
                        </span>
                        <span className="text-white font-medium tabular-nums">
                          {currencyFmt.format(toNum(v.amount))}
                        </span>
                      </div>

                      {/* botón toggle detalle (solo tiene sentido para cheques) */}
                      {v.method === "cheque" && (
                        <button
                          type="button"
                          onClick={() => toggleSummary(idx)}
                          className={`inline-flex items-center gap-1 text-xs rounded px-2 py-1 border 
          ${
            isSummaryOpen(idx)
              ? "border-zinc-500 text-zinc-200 bg-zinc-700"
              : "border-zinc-700 text-zinc-300 bg-zinc-800 hover:bg-zinc-700/60"
          }`}
                        >
                          {isSummaryOpen(idx) ? "Ocultar" : "Ver detalle"}
                          <svg
                            viewBox="0 0 20 20"
                            className={`w-3.5 h-3.5 transition-transform ${
                              isSummaryOpen(idx) ? "rotate-180" : ""
                            }`}
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 0 1 .94 1.17l-4.24 3.36a.75.75 0 0 1-.94 0L5.21 8.4a.75.75 0 0 1 .02-1.19z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* detalle expandible (una fila por item) */}
                    {v.method === "cheque" && isSummaryOpen(idx) && (
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-300">Valor Bruto</span>
                          <span className="text-white tabular-nums">
                            {currencyFmt.format(
                              toNum(v.raw_amount || v.amount)
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-zinc-300">Días</span>
                          <span className="text-white tabular-nums">
                            {Number.isFinite(daysTotal) ? daysTotal : "—"}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-zinc-300">%</span>
                          <span className="text-rose-400 tabular-nums">
                            {fmtPctSigned(pctInt)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-zinc-300">
                            Costo financiero
                          </span>
                          <span className="text-rose-400 tabular-nums">
                            {currencyFmt.format(interest$)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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

      {/* ===== Resumen inferior ===== */}
      {newValues.length > 0 && (
        <div className="mt-4 space-y-1 text-sm">
          <RowSummary
            label={
              <LabelWithTip
                label="TOTAL PAGADO (NOMINAL)"
                tip="Suma de importes originales: para cheques se toma el monto bruto, para otros métodos el monto ingresado."
              />
            }
            value={currencyFmt.format(totalNominalValues)}
          />

          {/* ÚNICO ajuste mostrado: el de documentos (igual que en PaymentModal) */}
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
                    label="TOTAL DESC/COST F."
                    tip={EXPLAIN.totalDescCostF}
                  />
                }
                value={currencyFmt.format(totalDescCostF)}
                bold
              />

              {/* 👉 Detalle por cheque con gracia real */}
              <div className="mt-2 rounded-lg border border-zinc-700 bg-zinc-800/40 p-2">
                <div className="text-[11px] text-zinc-400 mb-1">
                  Detalle cheques (gracia aplicada)
                </div>
                <ul className="space-y-1">
                  {newValues.map((v, i) =>
                    v.method === "cheque" ? (
                      <li
                        key={`sum-chq-${i}`}
                        className="flex flex-wrap gap-x-2 text-[12px]"
                      >
                        <span className="text-zinc-300">
                          Cheque {v.chequeDate || "—"}
                        </span>
                        <span className="text-zinc-400">
                          · Gracia: {graceFor(v)}d
                        </span>
                        <span className="text-zinc-400">
                          · Gravados: {chargeableDaysFor(v)}d
                        </span>
                        <span className="text-zinc-400">
                          · %: {fmtPctSigned(dailyRate * chargeableDaysFor(v))}
                        </span>
                        <span className="text-zinc-300">
                          · CF:{" "}
                          {currencyFmt.format(
                            // mismo cálculo que arriba, pero inline para coherencia visual
                            (() => {
                              const base =
                                Number(
                                  (v.raw_amount ?? v.amount ?? "0").replace(
                                    ",",
                                    "."
                                  )
                                ) || 0;
                              const pct = dailyRate * chargeableDaysFor(v);
                              return +(base * pct).toFixed(2);
                            })()
                          )}
                        </span>
                      </li>
                    ) : null
                  )}
                </ul>
              </div>
            </>
          )}

          <RowSummary
            label={<LabelWithTip label="SALDO" tip={EXPLAIN.saldo} />}
            value={currencyFmt.format(saldo)}
            highlight={saldo === 0 ? "ok" : saldo < 0 ? "bad" : "warn"}
          />
        </div>
      )}

      {hasErrors && (
        <div className="mt-3 text-sm text-red-400">
          {t("document.hayErroresEnValores") ||
            "Hay errores en los pagos cargados"}
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
}: {
  label: React.ReactNode;
  value: string;
  bold?: boolean;
  highlight?: "ok" | "bad" | "warn";
}) {
  const color =
    highlight === "ok"
      ? "text-emerald-500"
      : highlight === "bad"
      ? "text-red-500"
      : highlight === "warn"
      ? "text-amber-400"
      : "text-white";
  return (
    <div className="flex justify-between">
      <span className={`text-zinc-300 ${bold ? "font-semibold" : ""}`}>
        {label}
      </span>
      <span className={`${color} tabular-nums ${bold ? "font-semibold" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function InfoIcon({ className = "w-3.5 h-3.5" }) {
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

/** Tooltip simple, accesible y sin dependencias */
/** Tooltip simple, accesible y sin dependencias (con clamp a viewport) */
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
      ? "bottom-full mb-1 left-1/2"
      : side === "bottom"
      ? "top-full mt-1 left-1/2"
      : side === "left"
      ? "right-full mr-1 top-1/2"
      : "left-full ml-1 top-1/2";

  const tipRef = React.useRef<HTMLSpanElement>(null);
  const wrapRef = React.useRef<HTMLSpanElement>(null);

  const clampToViewport = () => {
    const tip = tipRef.current;
    if (!tip) return;

    // Reset al estado centrado antes de medir
    tip.style.transform =
      side === "left" || side === "right"
        ? "translateY(-50%)"
        : "translateX(-50%)";

    const r = tip.getBoundingClientRect();
    const vw = window.innerWidth;
    const margin = 8; // px

    if (side === "top" || side === "bottom") {
      // Si se sale por izquierda, empujamos a la derecha (valores +)
      // Si se sale por derecha, empujamos a la izquierda (valores -)
      let push = 0;
      if (r.left < margin) push = margin - r.left;
      if (r.right > vw - margin) push = -(r.right - (vw - margin));

      if (push !== 0) {
        // Ajustamos el translateX (-50% + push px)
        tip.style.transform = `translateX(calc(-50% + ${push}px))`;
      }
    } else {
      // Para left/right, clamp vertical si hace falta (opcional)
      // Aquí suele no ser problema, pero lo dejamos por simetría
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
          pointer-events-none absolute ${pos} z-10
          min-w-[16rem] max-w-[min(32rem,calc(100vw-1rem))]
          rounded-md border border-zinc-700 bg-zinc-900
          px-3 py-1.5 text-sm text-zinc-200
          text-left whitespace-normal break-words
          opacity-0 shadow-lg transition-opacity duration-150
          group-hover:opacity-100 group-focus-within:opacity-100
          ${
            side === "left" || side === "right"
              ? "-translate-y-1/2"
              : "-translate-x-1/2"
          }
        `}
        title={text} // fallback nativo
      >
        {text}
      </span>
    </span>
  );
}

/** Etiqueta con ícono + tooltip */
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
        className={`inline-flex items-center gap-1 cursor-help ${className}`}
        tabIndex={0} // 👈 permite mostrar tooltip al focus (teclado)
      >
        <span>{label}</span>
        <InfoIcon className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
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
    "Días de gracia durante los cuales no se cobra costo financiero. Pasado ese umbral, los días generan interés.",
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
