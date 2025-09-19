"use client";
import React, { useEffect, useState } from "react";
import PrivateRoute from "../context/PrivateRoutes";
import { useTranslation } from "react-i18next";
import ChequeCalculator from "./checkCalculator";
import {
  useGetInterestRateQuery,
  useUpdateInterestRateMutation,
} from "@/redux/services/settingsApi";
import { useAuth } from "../context/AuthContext";
import { FaCheck, FaSpinner } from "react-icons/fa";
import PlanCalculator from "./planCaluculator";

const Page = () => {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const [showTick, setShowTick] = useState(false);

  const { data: interestSetting, isFetching: isLoadingRate } =
    useGetInterestRateQuery();

  const isAdmin = userData?.role === "ADMINISTRADOR";

  // tasa anual local (default 96 hasta que llegue del backend)
  const [interestPct, setInterestPct] = useState<number>(96);

  const [updateInterestRate, { isLoading: isSavingRate, isError, error }] =
    useUpdateInterestRateMutation();

  function getRtqErrorMessage(e: unknown): string {
    if (e && typeof e === "object" && "status" in e) {
      const err = e as { status: number | string; data?: any };
      if (typeof err.data === "string") return `${err.status}: ${err.data}`;
      if (err.data?.message) return `${err.status}: ${err.data.message}`;
      if (err.data?.error) return `${err.status}: ${err.data.error}`;
      return `Error ${err.status}`;
    }
    if (e && typeof e === "object" && "message" in e) {
      return String((e as any).message);
    }
    return "Error desconocido al actualizar la tasa.";
  }

  // aplicar la tasa que venga del backend
  useEffect(() => {
    const incoming = (interestSetting as any)?.value;
    if (typeof incoming === "number") setInterestPct(incoming);
    else if (typeof incoming === "string" && incoming.trim() !== "") {
      const parsed = Number(incoming);
      if (!Number.isNaN(parsed)) setInterestPct(parsed);
    }
  }, [interestSetting]);

  const handleSave = async () => {
    try {
      await updateInterestRate({ value: Number(interestPct) }).unwrap();
      setShowTick(true);
      const t = setTimeout(() => setShowTick(false), 1500);
      // cleanup por si el usuario navega rápido
      return () => clearTimeout(t);
    } catch (e) {
      console.error("updateInterestRate error:", e);
      alert(getRtqErrorMessage(e));
    }
  };

  const savingOrLoading = isSavingRate || isLoadingRate;

  return (
    <PrivateRoute
      requiredRoles={[
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ]}
    >
      {/* Toast de confirmación */}
      <div
        className={`fixed right-4 top-4 z-50 transition-all duration-300 ${
          showTick
            ? "opacity-100 translate-y-0"
            : "opacity-0 pointer-events-none -translate-y-2"
        }`}
      >
        <div
          className={`fixed right-4 top-4 z-50 transition-all duration-300 ${
            showTick
              ? "opacity-100 translate-y-0"
              : "opacity-0 pointer-events-none -translate-y-2"
          }`}
        >
          <div className="flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-3 py-2 shadow-lg ring-1 ring-emerald-400/40">
            <FaCheck />
            <span className="text-sm font-medium">Guardado correctamente</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl p-4 space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <h2 className="text-xl font-semibold text-slate-100">
            {t("Calculadora de Cheques")}
          </h2>
          {typeof interestSetting?.value !== "undefined" && (
            <div className="text-xs text-black">
              Predeterminada actual:{" "}
              <span className="text-black font-medium">
                {Number((interestSetting as any).value ?? interestPct).toFixed(
                  2
                )}
                %
              </span>
            </div>
          )}
        </div>

        {isAdmin && (
          <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tasa anual predeterminada
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
                className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
              >
                Guardar
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Esta tasa queda guardada como predeterminada hasta que la cambies.
            </p>
          </section>
        )}

        {/* Calculadora (usa la tasa persistida si está, si no, la local) */}
        <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm">
          <ChequeCalculator
            annualInterestPct={
              typeof (interestSetting as any)?.value !== "undefined" &&
              (interestSetting as any)?.value !== null
                ? Number((interestSetting as any).value)
                : interestPct
            }
            graceDays={45}
          />
        </section>

         <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm">
         <PlanCalculator />
        </section>
      </div>
    </PrivateRoute>
  );
};

export default Page;
