"use client";

import React, { useEffect, useState } from "react";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useTranslation } from "react-i18next";
import { FaCheck } from "react-icons/fa";
import {
  useGetInterestRateQuery,
  useUpdateInterestRateMutation,
} from "@/redux/services/settingsApi";

export default function InterestSettingsPage() {
  const { t } = useTranslation();
  const [showTick, setShowTick] = useState(false);
  const { data: interestSetting, isFetching } = useGetInterestRateQuery();
  const [updateInterestRate, { isLoading }] = useUpdateInterestRateMutation();

  const [interestPct, setInterestPct] = useState<number>(96);

  useEffect(() => {
    const incoming = (interestSetting as any)?.value;
    if (typeof incoming === "number") setInterestPct(incoming);
    else if (typeof incoming === "string" && incoming.trim() !== "") {
      const parsed = Number(incoming);
      if (!Number.isNaN(parsed)) setInterestPct(parsed);
    }
  }, [interestSetting]);

  const handleSave = async () => {
    await updateInterestRate({ value: Number(interestPct) }).unwrap();
    setShowTick(true);
    setTimeout(() => setShowTick(false), 1500);
  };

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

      <div className="mx-auto max-w-2xl p-4 space-y-6">
        <h2 className="text-xl font-semibold text-slate-100">{t("Settings de Interés")}</h2>

        <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("Tasa anual predeterminada")}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min={0}
              value={interestPct}
              onChange={(e) => setInterestPct(Number(e.target.value) || 0)}
              className="w-24 border-gray-300 rounded-md shadow-sm px-2 py-1 text-gray-900 bg-gray-50 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
            />
            <span className="text-gray-700">%</span>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || isFetching}
              className={`px-3 py-2 rounded-md text-white font-medium shadow-sm ${
                isLoading || isFetching
                  ? "bg-zinc-500 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {t("Guardar")}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t("Esta tasa queda guardada como predeterminada hasta que la cambies.")}
          </p>
        </section>
      </div>
    </PrivateRoute>
  );
}
