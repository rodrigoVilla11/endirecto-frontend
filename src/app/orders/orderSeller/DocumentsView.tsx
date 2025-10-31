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
      v === "según pliego" ||
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
    if (docDays <= 7) return { rate: promo1310 ? 0.13 : 0.2 };
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

  const isDesc = rate > 0;

  const surcharge = getOverdueSurcharge(days_since_invoice);
  // si hay 10% manual, no aplicamos recargo
  const hasSurcharge =
    !isDesc && surcharge.pct > 0 && !(eligibleManual10 && manualTenApplied);

  const adjPct = (isDesc ? rate : hasSurcharge ? surcharge.pct : 0) * 100;
  const adjAmount =
    balance * Math.abs(isDesc ? rate : hasSurcharge ? surcharge.pct : 0);

  const finalAmount = isDesc
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
  const bannerNote = isDesc
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
    <div className="w-full space-y-2">
      {data && (
        <div key={data.id} className="bg-gray-900 rounded-lg overflow-hidden">
          {/* Fila principal */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedRows.includes(data.id)}
                onChange={(e) =>
                  handleCheckboxChange(data.id, e.target.checked)
                }
                className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <button
                onClick={() => toggleRow(data.id)}
                className="text-gray-400 hover:text-gray-300"
              >
                {expandedRows.includes(data.id) ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
              <div className="flex flex-col">
                <span className="text-gray-200 font-medium">{docNumber}</span>
                <span className="text-sm text-gray-400">
                  {formatDateDDMMYYYY(invoiceDateStr || "")} -{" "}
                  {t("document.vto")}{" "}
                  {formatDateDDMMYYYY(expirationDateStr || "")}
                </span>
              </div>
            </div>
            <span className="text-gray-200 font-medium">
              {formatPriceWithCurrency(amount)}
            </span>
          </div>

          {/* Detalle expandido */}
          {expandedRows.includes(data.id) && (
            <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
              <div className="flex flex-col gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {t("document.comprobante")}
                    </span>
                    <span className="text-gray-200">{docNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {t("document.condicionPago")}
                    </span>
                    <span className="text-gray-200">
                      {paymentConditionName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {t("document.importe")}
                    </span>
                    <span className="text-gray-200">
                      {formatPriceWithCurrency(amount)}
                    </span>
                  </div>
                </div>

                {/* Saldo actual */}
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    {t("document.saldo") || "Saldo"}
                  </span>
                  <span className="text-gray-200">
                    {formatPriceWithCurrency(balance)}
                  </span>
                </div>

                {/* Días / Ajuste / Final */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {t("document.diasDesdeEmision") || "Días desde emisión"}
                    </span>
                    <span className="text-gray-200">
                      {Number.isFinite(days_since_invoice)
                        ? days_since_invoice
                        : "—"}
                    </span>
                  </div>

                  {/* Checkbox 10% manual — solo visible si es elegible */}
                  {eligibleManual10 && (
                    <div className="flex items-center justify-between">
                      <label className="text-gray-400 flex-1">
                        Aplicar 10% (30–37 días)
                      </label>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
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

                  {(isDesc || hasSurcharge) && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          {isDesc
                            ? t("document.descuento")
                            : t("document.recargo")}
                        </span>
                        <span
                          className={`font-medium ${
                            isDesc ? "text-emerald-500" : "text-rose-400"
                          }`}
                        >
                          {adjPct.toFixed(2)}%
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          {isDesc
                            ? t("document.importeDescuento") || "Importe desc."
                            : t("document.importeRecargo") || "Importe rec."}
                        </span>
                        <span
                          className={`text-gray-200 ${
                            isDesc ? "text-emerald-500" : "text-rose-400"
                          }`}
                        >
                          {isDesc ? "-" : "+"}
                          {formatPriceWithCurrency(adjAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between font-medium">
                        <span className="text-gray-400">
                          {isDesc
                            ? t("document.finalConDescuento") || "Final c/desc."
                            : t("document.finalConRecargo") || "Final c/rec."}
                        </span>
                        <span className="text-gray-200">
                          {formatPriceWithCurrency(finalAmount)}
                        </span>
                      </div>
                    </>
                  )}

                  {bannerNote ? (
                    <div className="text-xs text-amber-400 mt-1">
                      {bannerNote}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
