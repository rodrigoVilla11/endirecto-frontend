// src/app/(tus-rutas)/settings/interest/page.tsx  (o donde la tengas)
"use client";

import React, { useEffect, useMemo, useState } from "react";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useTranslation } from "react-i18next";
import { FaCheck } from "react-icons/fa";
import {
  useGetInterestRateQuery,
  useUpdateInterestRateMutation,
  useGetDocumentsGraceDaysQuery,
  useUpdateDocumentsGraceDaysMutation,
  useGetChequeGraceDaysQuery,
  useUpdateChequeGraceDaysMutation,
  useGetCalculatorChequeGraceDaysQuery,
  useUpdateCalculatorChequeGraceDaysMutation,
} from "@/redux/services/settingsApi";

/** Normaliza cualquier entrada para convertirla en número válido >= 0 */
const coerceNonNegative = (v: unknown, fallback = 0) => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export default function InterestSettingsPage() {
  const { t } = useTranslation();

  // Toast global de guardado OK
  const [showTick, setShowTick] = useState(false);
  const fireTick = () => {
    setShowTick(true);
    setTimeout(() => setShowTick(false), 1500);
  };

  // ===== Queries
  const { data: interestSetting, isFetching: loadingInterest } = useGetInterestRateQuery();
  const { data: docsGrace, isFetching: loadingDocsGrace } = useGetDocumentsGraceDaysQuery();
  const { data: chequeGrace, isFetching: loadingChequeGrace } = useGetChequeGraceDaysQuery();
  const { data: calcChequeGrace, isFetching: loadingCalcChequeGrace } =
    useGetCalculatorChequeGraceDaysQuery();

  // ===== Mutations
  const [updateInterestRate, { isLoading: savingInterest }] = useUpdateInterestRateMutation();
  const [updateDocumentsGraceDays, { isLoading: savingDocsGrace }] =
    useUpdateDocumentsGraceDaysMutation();
  const [updateChequeGraceDays, { isLoading: savingChequeGrace }] =
    useUpdateChequeGraceDaysMutation();
  const [updateCalculatorChequeGraceDays, { isLoading: savingCalcChequeGrace }] =
    useUpdateCalculatorChequeGraceDaysMutation();

  // ===== Local state
  const [interestPct, setInterestPct] = useState<number>(96);
  const [documentsGraceDays, setDocumentsGraceDays] = useState<number>(0);
  const [chequeGraceDays, setChequeGraceDays] = useState<number>(45);
  const [calculatorChequeGraceDays, setCalculatorChequeGraceDays] = useState<number>(45);

  // Carga inicial en inputs
  useEffect(() => {
    const v = (interestSetting as any)?.value;
    if (typeof v === "number") setInterestPct(v);
    else if (typeof v === "string") setInterestPct(coerceNonNegative(v, 96));
  }, [interestSetting]);

  useEffect(() => {
    const v = (docsGrace as any)?.value;
    if (typeof v === "number") setDocumentsGraceDays(v);
    else if (typeof v === "string") setDocumentsGraceDays(coerceNonNegative(v, 0));
  }, [docsGrace]);

  useEffect(() => {
    const v = (chequeGrace as any)?.value;
    if (typeof v === "number") setChequeGraceDays(v);
    else if (typeof v === "string") setChequeGraceDays(coerceNonNegative(v, 45));
  }, [chequeGrace]);

  useEffect(() => {
    const v = (calcChequeGrace as any)?.value;
    if (typeof v === "number") setCalculatorChequeGraceDays(v);
    else if (typeof v === "string")
      setCalculatorChequeGraceDays(coerceNonNegative(v, 45));
  }, [calcChequeGrace]);

  const anyGlobalLoading =
    loadingInterest ||
    loadingDocsGrace ||
    loadingChequeGrace ||
    loadingCalcChequeGrace;

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      {/* Toast */}
      <div
        className={`fixed right-4 top-4 z-50 transition-all duration-300 ${
          showTick ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-3 py-2 shadow-lg ring-1 ring-emerald-400/40">
          <FaCheck />
          <span className="text-sm font-medium">{t("Guardado correctamente")}</span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl p-4 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {t("Settings de Interés y Gracia")}
        </h2>

        {/* Tasa anual */}
        <SettingCard
          title={t("Tasa anual predeterminada")}
          description={t("Esta tasa queda guardada como predeterminada hasta que la cambies.")}
        >
          <NumberInput
            value={interestPct}
            onChange={(n) => setInterestPct(coerceNonNegative(n))}
            suffix="%"
            step={0.1}
            min={0}
            disabled={anyGlobalLoading || savingInterest}
          />
          <SaveButton
            onClick={async () => {
              await updateInterestRate({ value: Number(interestPct) }).unwrap();
              fireTick();
            }}
            disabled={anyGlobalLoading || savingInterest}
            loading={savingInterest}
            label={t("Guardar")}
          />
        </SettingCard>

        {/* Documents grace days */}
        <SettingCard
          title="Documents grace days"
          description="Días de gracia aplicados al cálculo de documentos (descuentos/recargos)."
        >
          <NumberInput
            value={documentsGraceDays}
            onChange={(n) => setDocumentsGraceDays(coerceNonNegative(n))}
            suffix="días"
            step={1}
            min={0}
            disabled={anyGlobalLoading || savingDocsGrace}
          />
          <SaveButton
            onClick={async () => {
              await updateDocumentsGraceDays({ value: Number(documentsGraceDays) }).unwrap();
              fireTick();
            }}
            disabled={anyGlobalLoading || savingDocsGrace}
            loading={savingDocsGrace}
            label={t("Guardar")}
          />
        </SettingCard>

        {/* Cheque grace days (operativa real) */}
        <SettingCard
          title="Cheque grace days"
          description="Días de gracia para cheques en la operativa (cálculo neto/recargo)."
        >
          <NumberInput
            value={chequeGraceDays}
            onChange={(n) => setChequeGraceDays(coerceNonNegative(n))}
            suffix="días"
            step={1}
            min={0}
            disabled={anyGlobalLoading || savingChequeGrace}
          />
          <SaveButton
            onClick={async () => {
              await updateChequeGraceDays({ value: Number(chequeGraceDays) }).unwrap();
              fireTick();
            }}
            disabled={anyGlobalLoading || savingChequeGrace}
            loading={savingChequeGrace}
            label={t("Guardar")}
          />
        </SettingCard>

        {/* Calculator cheque grace days (simulador) */}
        <SettingCard
          title="Calculator cheque grace days"
          description="Días de gracia que usa el simulador/calculadora de cheques."
        >
          <NumberInput
            value={calculatorChequeGraceDays}
            onChange={(n) => setCalculatorChequeGraceDays(coerceNonNegative(n))}
            suffix="días"
            step={1}
            min={0}
            disabled={anyGlobalLoading || savingCalcChequeGrace}
          />
          <SaveButton
            onClick={async () => {
              await updateCalculatorChequeGraceDays({
                value: Number(calculatorChequeGraceDays),
              }).unwrap();
              fireTick();
            }}
            disabled={anyGlobalLoading || savingCalcChequeGrace}
            loading={savingCalcChequeGrace}
            label={t("Guardar")}
          />
        </SettingCard>
      </div>
    </PrivateRoute>
  );
}

/* ===================== UI helpers ===================== */

function SettingCard({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="text-xs text-gray-500 mt-1 mb-3">{description}</p>
      )}
      <div className="flex items-center gap-3 flex-wrap">{children}</div>
    </section>
  );
}

function NumberInput({
  value,
  onChange,
  suffix,
  step = 1,
  min = 0,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
  disabled?: boolean;
}) {
  const [text, setText] = useState<string>(() => String(value ?? 0));
  useEffect(() => setText(String(value ?? 0)), [value]);

  const commit = () => onChange(coerceNonNegative(text, min));

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        step={step}
        min={min}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-28 border-gray-300 rounded-md shadow-sm px-2 py-1 text-gray-900 bg-gray-50 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
        disabled={!!disabled}
      />
      {suffix && <span className="text-gray-700">{suffix}</span>}
    </div>
  );
}

function SaveButton({
  onClick,
  disabled,
  loading,
  label,
}: {
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-md text-white font-medium shadow-sm ${
        disabled
          ? "bg-zinc-500 cursor-not-allowed"
          : loading
          ? "bg-amber-500 cursor-wait"
          : "bg-emerald-600 hover:bg-emerald-700"
      }`}
    >
      {loading ? "..." : label}
    </button>
  );
}
