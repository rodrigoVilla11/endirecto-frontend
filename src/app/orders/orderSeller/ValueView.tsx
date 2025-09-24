"use client";

import { diffFromTodayToDate } from "@/lib/dateUtils";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type PaymentMethod = "efectivo" | "transferencia" | "cheque";

export type ValueItem = {
  /** Monto imputable. Para cheques, es el NETO (original - interés). */
  amount: string;
  /** Solo cheques: monto original ingresado por el usuario. */
  rawAmount?: string;
  selectedReason: string;
  method: PaymentMethod;
  bank?: string;
  /** Solo cheques: fecha de cobro (YYYY-MM-DD) */
  chequeDate?: string;
  chequeNumber?: string;
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
  /** gracia para cheques (por defecto 45) */
  chequeGraceDays,
  onValidityChange,
}: {
  newValues: ValueItem[];
  setNewValues: React.Dispatch<React.SetStateAction<ValueItem[]>>;
  annualInterestPct: number;
  docAdjustmentSigned?: number;
  netToPay?: number;
  chequeGraceDays?: number;
  onValidityChange?: (isValid: boolean) => void;
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

  const needsBank = (m: PaymentMethod) =>
    m === "cheque" || m === "transferencia";

  // ===== Validación por fila =====
  const rowErrors = newValues.map((v) => {
    const bankErr = needsBank(v.method) && !(v.bank || "").trim();
    const chequeNumErr =
      v.method === "cheque" && !(v.chequeNumber || "").trim();
    // Monto requerido (> 0). En cheque se valida el ORIGINAL (rawAmount)
    const amountStr =
      v.method === "cheque" ? v.rawAmount ?? v.amount ?? "" : v.amount ?? "";
    const amountNum = parseFloat((amountStr || "").replace(",", "."));
    const amountErr = !Number.isFinite(amountNum) || amountNum <= 0;
    return { bank: bankErr, chequeNumber: chequeNumErr, amount: amountErr };
  });

  const hasErrors = rowErrors.some((e) => e.bank || e.chequeNumber || e.amount);
  useEffect(() => {
    onValidityChange?.(!hasErrors);
  }, [hasErrors, onValidityChange]);

  const toNum = (s?: string) =>
    Number.parseFloat((s ?? "").replace(",", ".")) || 0;

  // ===== Cálculo interés simple cheques =====
  const dailyRate = useMemo(
    () => annualInterestPct / 100 / 365,
    [annualInterestPct]
  );
  const daysBetweenToday = (iso?: string) => diffFromTodayToDate(iso);

  /** Días gravados (aplica gracia; default 45) */
  const chargeableDays = (iso?: string) => {
    const days = daysBetweenToday(iso);
    const grace = chequeGraceDays ?? 45;
    return Math.max(0, days - grace);
  };

  /** Interés $ sobre monto ORIGINAL del cheque */
  const chequeInterest = (v: ValueItem) => {
    if (v.method !== "cheque") return 0;
    const base = toNum(v.rawAmount ?? v.amount);
    if (!base) return 0;
    const pct = dailyRate * chargeableDays(v.chequeDate);
    return +(base * pct).toFixed(2);
  };

  /** Neto imputable desde monto ORIGINAL (rawAmount) */
  const computeChequeNeto = (raw: string, iso?: string) => {
    const base = toNum(raw);
    const int$ = +(base * (dailyRate * chargeableDays(iso))).toFixed(2);
    const neto = Math.max(0, +(base - int$).toFixed(2));
    return { neto, int$ };
  };

  // ===== Normalización: en cheques, amount = neto =====
  useEffect(() => {
    let changed = false;
    const next = newValues.map((v) => {
      if (v.method !== "cheque") return v;
      const raw = v.rawAmount ?? v.amount ?? "0";
      const { neto } = computeChequeNeto(raw, v.chequeDate);
      const current = toNum(v.amount);
      if (Math.abs(current - neto) > 0.009 || v.rawAmount == null) {
        changed = true;
        return { ...v, rawAmount: raw, amount: neto.toFixed(2) };
      }
      return v;
    });
    if (changed) setNewValues(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newValues, dailyRate, chequeGraceDays]);

  // ===== Totales =====
  const totalValues = useMemo(
    () => newValues.reduce((acc, v) => acc + toNum(v.amount), 0),
    [newValues]
  );

  const saldo = useMemo(
    () => +(netToPay - totalValues).toFixed(2),
    [netToPay, totalValues]
  );

  // ===== Handlers =====
  const addRow = () => {
    setNewValues((prev) => [
      {
        amount: "",
        rawAmount: "",
        selectedReason: NO_CONCEPTO,
        method: "efectivo",
        bank: "",
        chequeDate: "",
        chequeNumber: "",
      },
      ...prev,
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

  const handleAmountChange = (idx: number, value: string, v: ValueItem) => {
    if (v.method !== "cheque") {
      patchRow(idx, { amount: value, rawAmount: undefined });
      return;
    }
    const { neto } = computeChequeNeto(value, v.chequeDate);
    patchRow(idx, { rawAmount: value, amount: neto.toFixed(2) });
  };

  const handleMethodChange = (
    idx: number,
    method: PaymentMethod,
    v: ValueItem
  ) => {
    if (method !== "cheque") {
      patchRow(idx, { method, rawAmount: undefined });
      return;
    }
    const raw = v.rawAmount ?? v.amount ?? "0";
    const { neto } = computeChequeNeto(raw, v.chequeDate);
    patchRow(idx, { method, rawAmount: raw, amount: neto.toFixed(2) });
  };

  const handleChequeDateChange = (idx: number, iso: string, v: ValueItem) => {
    if (v.method !== "cheque") {
      patchRow(idx, { chequeDate: iso });
      return;
    }
    const raw = v.rawAmount ?? v.amount ?? "0";
    const { neto } = computeChequeNeto(raw, iso);
    patchRow(idx, { chequeDate: iso, rawAmount: raw, amount: neto.toFixed(2) });
  };

  const [openRows, setOpenRows] = useState<Record<number, boolean>>({});
  const isOpen = (i: number) => !!openRows[i];
  const toggleRow = (i: number) =>
    setOpenRows((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-medium">Pagos</h4>
        <button
          onClick={addRow}
          className="px-3 py-2 rounded bg-emerald-500 text-black font-medium hover:brightness-95 active:scale-95"
        >
          + Agregar pago
        </button>
      </div>

      {newValues.length === 0 && (
        <div className="text-zinc-400 text-sm">No hay pagos cargados.</div>
      )}

      <div className="space-y-2">
        {newValues.map((v, idx) => {
          const showBank =
            v.method === "transferencia" || v.method === "cheque";
          const daysTotal = daysBetweenToday(v.chequeDate);
          const daysGrav =
            v.method === "cheque" ? chargeableDays(v.chequeDate) : 0;
          const pctInt = v.method === "cheque" ? dailyRate * daysGrav : 0;
          const interest$ = v.method === "cheque" ? chequeInterest(v) : 0;

          const shownAmountInput =
            v.method === "cheque" ? v.rawAmount ?? v.amount : v.amount;

          const hasRowError =
            rowErrors[idx].amount ||
            rowErrors[idx].bank ||
            rowErrors[idx].chequeNumber;

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

              {/* CONTENIDO EXPANDIBLE */}
              {isOpen(idx) && (
                <div className="mt-3 space-y-3">
                  {/* Fila principal */}
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(10rem,16rem),1fr,minmax(14rem,22rem)] gap-2 items-start">
                    {/* Monto */}
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        <LabelWithTip
                          label={
                            v.method === "cheque" ? "Monto original" : "Monto"
                          }
                          tip={
                            v.method === "cheque"
                              ? EXPLAIN.chequeMontoOriginal
                              : EXPLAIN.totalPagado
                          }
                        />
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        placeholder="0.00"
                        value={shownAmountInput}
                        onChange={(e) =>
                          handleAmountChange(idx, e.target.value, v)
                        }
                        className={`w-full px-2 py-1 rounded text-white outline-none tabular-nums
                    ${
                      rowErrors[idx].amount
                        ? "bg-zinc-700 border border-red-500"
                        : "bg-zinc-700 border border-transparent"
                    }`}
                      />
                    </div>

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
                            selectedReason:
                              val.trim() === "" ? NO_CONCEPTO : val,
                          });
                        }}
                        className="w-full px-2 py-1 rounded bg-zinc-700 text-white outline-none resize-y"
                      />
                    </div>

                    <div className="hidden md:block" />
                  </div>

                  {/* Campos condicionales */}
                  {showBank && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                      {/* Banco */}
                      <div className="md:col-span-4">
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

                      {/* Solo cheques: fecha + nro */}
                      {v.method === "cheque" && (
                        <>
                          <div className="md:col-span-3">
                            <label className="block text-[11px] text-zinc-400 mb-1">
                              <LabelWithTip
                                label={
                                  t("document.fechaCobro") || "Fecha de cobro"
                                }
                                tip={EXPLAIN.fechaCobro}
                              />
                            </label>
                            <input
                              type="date"
                              value={v.chequeDate || ""}
                              onChange={(e) =>
                                handleChequeDateChange(idx, e.target.value, v)
                              }
                              className="w-full px-2 py-1 rounded bg-zinc-700 text-white outline-none"
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

                          <div className="md:col-span-5">
                            <label className="block text-[11px] text-zinc-400 mb-1">
                              <LabelWithTip
                                label={
                                  t("document.numeroCheque") || "N° de cheque"
                                }
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
                        </>
                      )}
                    </div>
                  )}

                  {/* Resumen por ítem */}
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-300">Valor</span>
                        <span className="text-white tabular-nums">
                          {currencyFmt.format(
                            v.method === "cheque"
                              ? toNum(v.rawAmount || v.amount)
                              : toNum(v.amount)
                          )}
                        </span>
                      </div>

                      {v.method === "cheque" && (
                        <>
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
                        </>
                      )}

                      <div className="flex justify-between sm:col-span-2">
                        <span className="text-zinc-300 font-medium">
                          Valor Neto
                        </span>
                        <span className="text-white font-medium tabular-nums">
                          {currencyFmt.format(toNum(v.amount))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== Resumen inferior ===== */}
      {newValues.length > 0 && (
        <div className="mt-4 space-y-1 text-sm">
          <RowSummary
            label={
              <LabelWithTip label="TOTAL PAGADO" tip={EXPLAIN.totalPagado} />
            }
            value={currencyFmt.format(totalValues)}
            bold
          />

          {/* ÚNICO ajuste mostrado: el de documentos (igual que en PaymentModal) */}
          <RowSummary
            label={
              <LabelWithTip label="DTO/REC s/FACT" tip={EXPLAIN.dtoRecFact} />
            }
            value={`${docAdjustmentSigned >= 0 ? "-" : "+"}${currencyFmt.format(
              Math.abs(docAdjustmentSigned)
            )}`}
          />

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
  `${p >= 0 ? "+" : ""}${(p * 100).toFixed(1)}%`;

/* ================== UI helpers ================== */
function RadioPill({
  label,
  selected,
  onClick,
  className = "",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 px-3 rounded text-center text-sm leading-snug shrink-0
        ${selected ? "bg-emerald-500 text-black" : "bg-zinc-700 text-white"}
        ${className}`}
    >
      {label}
    </button>
  );
}

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
function labelMedio(m: PaymentMethod) {
  if (m === "efectivo") return "EFECTIVO";
  if (m === "transferencia") return "TRANSFERENCIA";
  return "CHEQUE";
}

function ResumenKV({
  k,
  v,
  strong,
  warn,
  muted,
  error,
}: {
  k: React.ReactNode;
  v: string;
  strong?: boolean;
  warn?: boolean;
  muted?: boolean;
  error?: boolean;
}) {
  const vColor = error
    ? "text-red-400"
    : warn
    ? "text-rose-400"
    : muted
    ? "text-zinc-500"
    : "text-white";
  return (
    <div className="flex justify-between gap-2">
      <span className="text-zinc-400">{k}</span>
      <span className={`tabular-nums ${vColor} ${strong ? "font-medium" : ""}`}>
        {v}
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
          ${side === "left" || side === "right" ? "-translate-y-1/2" : "-translate-x-1/2"}
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
    "Suma de los pagos imputables cargados. Para cheques se toma el neto (monto original menos interés).",
  dtoRecFact:
    "Ajuste por comprobantes según días y condición de pago: descuento (signo -) o recargo (signo +).",
  saldo:
    "Diferencia entre el total a pagar de documentos (neto) y los pagos imputados. Si es 0, el pago queda cubierto.",
  chequeMontoOriginal:
    "Importe original del cheque ingresado por el usuario (antes del costo financiero).",
  chequeDiasTotales:
    "Días calendario desde hoy hasta la fecha de cobro del cheque.",
  chequeGracia:
    "Días de gracia durante los cuales no se cobra interés. Pasado ese umbral, los días generan interés.",
  chequePorcentaje:
    "Porcentaje de interés simple acumulado: tasa diaria x días gravados.",
  chequeCostoFinanciero:
    "Interés en pesos aplicado al monto original del cheque (original x porcentaje).",
  chequeNeto: "Monto imputable del cheque: original menos costo financiero.",
  medioPago:
    "Seleccioná el medio de pago. Cheque y transferencia pueden requerir banco y otros datos.",
  banco: "Banco/Sucursal del valor. Requerido para cheque y transferencia.",
  fechaCobro:
    "Fecha de cobro del cheque. Define los días totales y el interés.",
  numeroCheque: "Número del cheque para trazabilidad.",
  concepto: "Detalle o referencia del pago (se usa para notas/comunicaciones).",
};
