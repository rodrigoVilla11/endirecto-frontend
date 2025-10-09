"use client";

import React from "react";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useTranslation } from "react-i18next";
import {
  useGetCalculatorChequeGraceDaysQuery,
  useGetInterestRateQuery,
} from "@/redux/services/settingsApi";
import PlanCalculator from "../planCaluculator";

export default function PlanCalculatorPage() {
  const { t } = useTranslation();
  const { data: interestSetting } = useGetInterestRateQuery();
  const { data: calcGrace } = useGetCalculatorChequeGraceDaysQuery();

  const annual = (() => {
    const v = (interestSetting as any)?.value;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 96;
  })();

  const grace = (() => {
    const v = (calcGrace as any)?.value;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0; // ⚠️ si querés sin gracia por default
  })();

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"]}>
      <div className="mx-auto max-w-4xl p-4 space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <h2 className="text-xl font-semibold text-black">
            {t("Plan 30/60/90")}
          </h2>
        </div>

        <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm">
          <PlanCalculator title="Cálculo de pagos a plazo" graceDays={grace} annualInterestPct={interestSetting?.value || 96}/>
        </section>
      </div>
    </PrivateRoute>
  );
}
