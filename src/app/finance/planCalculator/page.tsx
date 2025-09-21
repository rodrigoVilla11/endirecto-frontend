"use client";

import React from "react";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useTranslation } from "react-i18next";
import PlanCalculator from "../planCaluculator";

export default function PlanCalculatorPage() {
  const { t } = useTranslation();

  return (
    <PrivateRoute
      requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"]}
    >
      <div className="mx-auto max-w-4xl p-4 space-y-6">
        <h2 className="text-xl font-semibold text-slate-100">
          {t("Calculadora de Plan")}
        </h2>

        <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm">
          <PlanCalculator />
        </section>
      </div>
    </PrivateRoute>
  );
}
