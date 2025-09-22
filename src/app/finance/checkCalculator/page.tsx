"use client";

import React from "react";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useTranslation } from "react-i18next";
import {
  useGetCalculatorChequeGraceDaysQuery,
  useGetInterestRateQuery,
} from "@/redux/services/settingsApi";
import ChequeCalculator from "../checkCalculator";

export default function ChequeCalculatorPage() {
  const { t } = useTranslation();
  const { data: interestSetting } = useGetInterestRateQuery();
  const { data: calcGrace } = useGetCalculatorChequeGraceDaysQuery();

  const annual = (() => {
    const v = (interestSetting as any)?.value;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 96; // fallback
  })();

  const grace = (() => {
    const v = (calcGrace as any)?.value;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 45; // fallback para simulador
  })();

  return (
    <PrivateRoute
      requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"]}
    >
      <div className="mx-auto max-w-4xl p-4 space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <h2 className="text-xl font-semibold text-slate-100">
            {t("Calculadora de Cheques")}
          </h2>
          <div className="text-xs text-slate-300">
            {t("Predeterminada actual")}{" "}
            <span className="font-medium text-white">{annual.toFixed(2)}%</span>
          </div>
        </div>

        <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm">
          {/* 👇 ahora se lo pasás por props; adentro hay fallback a 45 si viniera undefined */}
          <ChequeCalculator annualInterestPct={annual} graceDays={grace} />
        </section>
      </div>
    </PrivateRoute>
  );
}
