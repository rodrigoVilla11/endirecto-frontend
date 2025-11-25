// DOCUMENTSVIEW.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetDocumentByIdQuery } from "@/redux/services/documentsApi";
import { useGetPaymentConditionByIdQuery } from "@/redux/services/paymentConditionsApi";
import {
  diffCalendarDays,
  diffFromDateToToday,
  parseDateOnlyLocal,
} from "@/lib/dateUtils";

export interface ExpandableTableProps {
  document_id: string;
  customerInformation: any;
  onRowSelect?: (id: string, checked: boolean) => void;
  selectedRows?: string[];
  setNewPayment?: any;
  paymentType: "pago_anticipado" | "cta_cte";
  graceDays: number;
  annualInterestPct: number;
  setFinalAmount: React.Dispatch<React.SetStateAction<number>>;
  graceDiscount: Record<string, boolean>;
  setGraceDiscount: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
}

export function DocumentsView({
  document_id,
  onRowSelect,
  selectedRows = [],
  customerInformation,
  setNewPayment,
  paymentType,
  graceDays,
  annualInterestPct,
  setFinalAmount,
  graceDiscount,
  setGraceDiscount,
}: ExpandableTableProps) {
  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const { data } = useGetDocumentByIdQuery({ id: document_id });

  const { data: paymentsConditionsData } = useGetPaymentConditionByIdQuery({
    id: data?.payment_condition_id || "",
  });

  const toggleRow = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  /* ===================== Helpers ===================== */

  const getOverdueSurcharge = (docDays: number) => {
    const chargeableDays = Math.max(0, docDays - graceDays);
    if (!Number.isFinite(docDays) || chargeableDays <= 0) {
      return { pct: 0, amount: 0, days: 0 };
    }
    const dailyRate = annualInterestPct / 100 / 365;
    const pct = dailyRate * chargeableDays;
    return { pct, amount: 0, days: chargeableDays };
  };

  function formatDateDDMMYYYY(date?: string) {
    const d = parseDateOnlyLocal(date);
    if (!d) return "—";
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatPriceWithCurrency(price: number): string {
    const formattedNumber = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(price)
      .replace("ARS", "")
      .trim();
    return `${formattedNumber}`;
  }

  /* ===================== Reglas de descuento ===================== */

  const isNoDiscountCondition = (txt?: string) => {
    const v = (txt || "").toLowerCase().trim();
    return (
      v === "segun pliego" ||
      v === "cuenta corriente" ||
      v === "no especificado" ||
      v === "not specified"
    );
  };

  function isPromo1310(txt?: string) {
    const v = (txt || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
    // Busca las palabras clave de forma laxa
    // "promo", "15 dias", "13", "30", "10"
    return (
      /promo/.test(v) &&
      /15\s*dias/.test(v) &&
      /(13(\s*%|.?dto))/i.test(v) &&
      /30\s*d/.test(v) &&
      /10(\s*%|)/.test(v)
    );
  }

  function getDiscountRule(
    docDays: number,
    pt: "pago_anticipado" | "cta_cte",
    docPaymentCondition?: string
  ): { rate: number; note?: string } {
    if (isNoDiscountCondition(docPaymentCondition)) {
      return { rate: 0, note: "Sin descuento por condición de pago" };
    }
    if (pt === "pago_anticipado") {
      return { rate: 0, note: "Pago anticipado sin regla" };
    }
    if (isNaN(docDays)) return { rate: 0, note: "Fecha/estimación inválida" };

    const promo1310 = isPromo1310(docPaymentCondition);

    // ⚠️ Ajuste pedido: si es la promo 15/13% y 30D/10%, para <= 7 días usar 13% en lugar de 20%
    if (docDays <= 7) return { rate: promo1310 ? 0.15 : 0.2 };
    if (docDays <= 15) return { rate: 0.13 };
    if (docDays <= 30) return { rate: 0.1 };
    if (docDays > 45) return { rate: 0, note: "Actualización de precios" };
    return { rate: 0, note: "Precio facturado (0%)" };
  }

  /* ===================== Derivados del documento ===================== */
  const invoiceDateStr = data?.date;
  const expirationDateStr = data?.expiration_date;
  const docNumber = data?.number ?? "";
  const amount = Number(data?.amount ?? 0);

  const days_until_expiration = diffCalendarDays(
    invoiceDateStr,
    expirationDateStr
  );
  const days_since_invoice = diffFromDateToToday(invoiceDateStr);

  // === 10% manual entre 31–37 días (inclusive), solo cta_cte y sin bloqueo por condición ===
  const paymentConditionName =
    paymentsConditionsData?.name || t("document.noEspecificado");

  const noDiscountBlocked = isNoDiscountCondition(paymentConditionName);

  const eligibleManual10 =
    paymentType === "cta_cte" &&
    !noDiscountBlocked &&
    Number.isFinite(days_since_invoice) &&
    days_since_invoice > 30 &&
    days_since_invoice <= 37;

  const manualTenApplied = !!graceDiscount[data?.id || ""];

  const balanceRaw = Number(
    customerInformation?.document_balance ?? amount ?? 0
  );
  const balance = isNaN(balanceRaw) ? 0 : balanceRaw;

  // 🚫 Bloquea TODO tipo de ajuste (desc/recargo/costo financiero)
  // para condiciones: "segun pliego", "cuenta corriente", "no especificado", etc.
  const adjustmentsBlocked = noDiscountBlocked;

  // Regla base
  let { rate, note } = getDiscountRule(
    days_since_invoice,
    paymentType,
    paymentConditionName
  );

  // Si aplica el 10% manual, pisa la regla
  if (eligibleManual10 && manualTenApplied) {
    rate = 0.1;
    note = "Descuento 10% (30–37 días activado)";
  }

  // Si los ajustes están bloqueados, el rate efectivo es 0 (solo para cálculo)
  if (adjustmentsBlocked) {
    rate = 0;
  }

  const isDesc = !adjustmentsBlocked && rate > 0;

  const surcharge = adjustmentsBlocked
    ? { pct: 0, amount: 0, days: 0 }
    : getOverdueSurcharge(days_since_invoice);

  // si hay 10% manual, no aplicamos recargo
  const hasSurcharge =
    !adjustmentsBlocked &&
    !isDesc &&
    surcharge.pct > 0 &&
    !(eligibleManual10 && manualTenApplied);

  const adjPct = (isDesc ? rate : hasSurcharge ? surcharge.pct : 0) * 100;
  const adjAmount =
    balance * Math.abs(isDesc ? rate : hasSurcharge ? surcharge.pct : 0);

  const finalAmount = adjustmentsBlocked
    ? balance
    : isDesc
    ? balance - adjAmount
    : hasSurcharge
    ? balance + adjAmount
    : balance;

  const selected = selectedRows.includes(data?.id ?? "");
  const prevFinalRef = useRef<number>(finalAmount);

  useEffect(() => {
    if (!data?.id) return;
    const prev = prevFinalRef.current ?? 0;
    const curr = Number.isFinite(finalAmount) ? finalAmount : 0;

    if (selected) {
      const delta = curr - prev;
      // evitamos micro-ruido por flotantes
      if (Math.abs(delta) >= 0.01) {
        setFinalAmount(
          (prevTotal) =>
            Math.round((prevTotal + delta + Number.EPSILON) * 100) / 100
        );
      }
    }
    // actualizamos el "último" final para el próximo delta
    prevFinalRef.current = curr;
  }, [finalAmount, selected, data?.id, setFinalAmount]);

  const bannerNote = adjustmentsBlocked
    ? null
    : isDesc
    ? null
    : hasSurcharge
    ? `Costo Financiero por ${surcharge.days} días`
    : eligibleManual10 && manualTenApplied
    ? "Descuento manual 10% aplicado (30–37 días)"
    : note || null;

  /* ===================== Selección: payload consistente ===================== */

  const documentDetails = {
    document_id: data?.id || "",
    number: docNumber,

    date_raw: invoiceDateStr || "",
    date: formatDateDDMMYYYY(invoiceDateStr || ""),

    expiration_date_raw: expirationDateStr || "",
    expiration_date: formatDateDDMMYYYY(expirationDateStr || ""),

    amount: String(amount ?? ""),
    document_balance: String(balance),
    payment_condition: paymentConditionName,
    saldo_a_pagar: String(balance),

    days_until_expiration: Number.isFinite(days_until_expiration)
      ? days_until_expiration
      : NaN,
    days_until_expiration_today: Number.isFinite(days_since_invoice)
      ? days_since_invoice
      : NaN,
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setNewPayment?.((prev: any[]) => [...prev, documentDetails]);
      // como vamos a sumar `finalAmount` al total inmediatamente,
      // seteo el ref al valor actual para que el próximo delta sea correcto
      prevFinalRef.current = finalAmount;
    } else {
      setNewPayment?.((prev: any[]) =>
        prev.filter((doc) => doc.document_id !== id)
      );
      // al deseleccionar, no hace falta mantener el último; lo reseteo por prolijidad
      prevFinalRef.current = finalAmount;
    }

    onRowSelect?.(id, checked);

    setFinalAmount((prevTotal) => {
      const delta = checked ? finalAmount : -finalAmount;
      return Math.round((prevTotal + delta + Number.EPSILON) * 100) / 100;
    });
  };

  /* ===================== Render ===================== */

  return (
    <div className="w-full space-y-3">
      {data && (
        <div
          key={data.id}
          className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
            selected
              ? "ring-2 ring-purple-500 shadow-purple-200"
              : "hover:shadow-xl"
          }`}
        >
          {/* Fila principal */}
          <div
            className={`px-4 py-4 flex items-center gap-3 transition-colors ${
              selected
                ? "bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={selectedRows.includes(data.id)}
              onChange={(e) => handleCheckboxChange(data.id, e.target.checked)}
              className="w-5 h-5 rounded-lg border-2 border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer flex-shrink-0"
            />

            {/* Botón expandir */}
            <button
              onClick={() => toggleRow(data.id)}
              className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                expandedRows.includes(data.id)
                  ? "bg-purple-100 text-purple-600"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              }`}
            >
              {expandedRows.includes(data.id) ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>

            {/* Información del documento */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-gray-900 font-bold text-base truncate">
                    📄 {docNumber}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    {formatDateDDMMYYYY(invoiceDateStr || "")} •{" "}
                    {t("document.vto")}{" "}
                    {formatDateDDMMYYYY(expirationDateStr || "")}
                  </span>
                </div>
                <span className="text-gray-900 font-bold text-base sm:text-lg whitespace-nowrap">
                  {formatPriceWithCurrency(amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Detalle expandido */}
          {expandedRows.includes(data.id) && (
            <div className="px-4 py-5 bg-gradient-to-br from-gray-50 to-gray-100 border-t-2 border-gray-200">
              <div className="space-y-4">
                {/* Información básica en grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-white rounded-xl gap-1">
                    <span className="text-gray-600 font-semibold text-xs sm:text-sm">
                      📋 {t("document.comprobante")}
                    </span>
                    <span className="text-gray-900 font-bold text-sm truncate">
                      {docNumber}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-white rounded-xl gap-1">
                    <span className="text-gray-600 font-semibold text-xs sm:text-sm">
                      💳 {t("document.condicionPago")}
                    </span>
                    <span className="text-gray-900 font-medium text-sm text-left break-words">
                      {paymentConditionName}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-white rounded-xl gap-1">
                    <span className="text-gray-600 font-semibold text-xs sm:text-sm">
                      💰 {t("document.importe")}
                    </span>
                    <span className="text-gray-900 font-bold text-sm">
                      {formatPriceWithCurrency(amount)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-white rounded-xl gap-1">
                    <span className="text-gray-600 font-semibold text-xs sm:text-sm">
                      📊 {t("document.saldo") || "Saldo"}
                    </span>
                    <span className="text-gray-900 font-bold text-sm">
                      {formatPriceWithCurrency(balance)}
                    </span>
                  </div>
                </div>

                {/* Días desde emisión */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200 gap-2">
                  <span className="text-blue-700 font-bold text-sm">
                    📅 {t("document.diasDesdeEmision") || "Días desde emisión"}
                  </span>
                  <span className="text-blue-900 font-bold text-base sm:text-lg">
                    {Number.isFinite(days_since_invoice)
                      ? `${days_since_invoice} días`
                      : "—"}
                  </span>
                </div>

                {/* Checkbox 10% manual */}
                {eligibleManual10 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-yellow-50 rounded-xl border-2 border-yellow-300 gap-3">
                    <label className="text-yellow-700 font-bold text-sm flex items-center gap-2">
                      <span>🎁</span>
                      Aplicar 10% (30–37 días)
                    </label>
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-2 border-yellow-400 text-yellow-600 focus:ring-2 focus:ring-yellow-500 cursor-pointer"
                      checked={manualTenApplied}
                      onChange={(e) =>
                        setGraceDiscount((prev) => ({
                          ...prev,
                          [data.id]: e.target.checked,
                        }))
                      }
                    />
                  </div>
                )}

                {/* Ajustes (Descuento o Recargo) */}
                {!adjustmentsBlocked && (isDesc || hasSurcharge) && (
                  <div className="space-y-3">
                    <div
                      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 rounded-xl border-2 gap-2 ${
                        isDesc
                          ? "bg-green-50 border-green-300"
                          : "bg-red-50 border-red-300"
                      }`}
                    >
                      <span
                        className={`font-bold text-sm ${
                          isDesc ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {isDesc
                          ? "✨ " + t("document.descuento")
                          : "⚠️ " + t("document.recargo")}
                      </span>
                      <span
                        className={`font-bold text-base sm:text-lg ${
                          isDesc ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {adjPct.toFixed(2)}%
                      </span>
                    </div>

                    <div
                      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 rounded-xl gap-2 ${
                        isDesc ? "bg-green-50" : "bg-red-50"
                      }`}
                    >
                      <span
                        className={`font-semibold text-sm ${
                          isDesc ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {isDesc
                          ? t("document.importeDescuento") || "Importe desc."
                          : t("document.importeRecargo") || "Importe rec."}
                      </span>
                      <span
                        className={`font-bold text-sm ${
                          isDesc ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {isDesc ? "-" : "+"}${" "}
                        {formatPriceWithCurrency(adjAmount)}
                      </span>
                    </div>

                    <div
                      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 rounded-xl border-2 gap-2 ${
                        isDesc
                          ? "bg-gradient-to-r from-green-100 to-emerald-100 border-green-400"
                          : "bg-gradient-to-r from-red-100 to-rose-100 border-red-400"
                      }`}
                    >
                      <span
                        className={`font-bold text-sm ${
                          isDesc ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        💵{" "}
                        {isDesc
                          ? t("document.finalConDescuento") ||
                            "Final c/desc."
                          : t("document.finalConRecargo") || "Final c/rec."}
                      </span>
                      <span
                        className={`font-bold text-lg sm:text-xl ${
                          isDesc ? "text-green-900" : "text-red-900"
                        }`}
                      >
                        $ {formatPriceWithCurrency(finalAmount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Banner de nota */}
                {!adjustmentsBlocked && bannerNote && (
                  <div className="p-3 bg-yellow-100 border-2 border-yellow-300 rounded-xl">
                    <p className="text-xs sm:text-sm text-yellow-800 font-medium text-center break-words">
                      ℹ️ {bannerNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
