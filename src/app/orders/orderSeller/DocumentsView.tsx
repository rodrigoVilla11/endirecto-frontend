//DOCUMENTSVIEW.tsx
"use client";

import { useState } from "react";
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

  // const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  // ======= Recargo por vencido =======

  const getOverdueSurcharge = (docDays: number) => {
    // días que generan recargo
    const chargeableDays = Math.max(0, docDays - graceDays);
    if (!Number.isFinite(docDays) || chargeableDays <= 0) {
      return { pct: 0, amount: 0, days: 0 };
    }
    const dailyRate = annualInterestPct / 100 / 365;
    const pct = dailyRate * chargeableDays; // ej: 0.01578 = 1.578%

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

  // días calendario exactos usando utilidades compartidas
  const days_until_expiration = diffCalendarDays(
    invoiceDateStr,
    expirationDateStr
  );
  const days_since_invoice = diffFromDateToToday(invoiceDateStr);
  // ===== Gracia manual por ventana 30–37 días al vencimiento =====
  const [forceGrace, setForceGrace] = useState(false);

  // días restantes al vencimiento desde HOY
  const days_to_due = diffFromDateToToday(expirationDateStr);

  // elegible solo si el vencimiento cae entre 30 y 37 días (incluidos)
  const isGraceEligible =
    Number.isFinite(days_to_due) && days_to_due >= 30 && days_to_due <= 37;
  const manualGraceApplied = isGraceEligible && forceGrace;

  const balanceRaw = Number(
    customerInformation?.document_balance ?? amount ?? 0
  );
  const balance = isNaN(balanceRaw) ? 0 : balanceRaw;

  const paymentConditionName =
    paymentsConditionsData?.name || t("document.noEspecificado");
  const { rate, note } = getDiscountRule(
    days_since_invoice,
    paymentType,
    paymentConditionName
  );
  const isDesc = rate > 0;

  const surcharge = getOverdueSurcharge(days_since_invoice);

  // ⬇️ Antes: const hasSurcharge = !isDesc && surcharge.pct > 0;
  // ⬇️ Ahora: si aplicás gracia manual, no hay recargo
  const hasSurcharge = !isDesc && surcharge.pct > 0 && !manualGraceApplied;

  const adjPct = (isDesc ? rate : hasSurcharge ? surcharge.pct : 0) * 100;
  const adjAmount =
    balance * Math.abs(isDesc ? rate : hasSurcharge ? surcharge.pct : 0);

  const finalAmount = isDesc
    ? balance - adjAmount
    : hasSurcharge
    ? balance + adjAmount
    : balance;

  const bannerNote = isDesc
    ? null
    : hasSurcharge
    ? `Costo Financiero por ${surcharge.days} días`
    : manualGraceApplied
    ? "Gracia manual aplicada (vencimiento 30–37 días)"
    : note || null;

  /* ===================== Selección: payload consistente ===================== */
  // 🔎 Debug útil para verificar consistencia

  const documentDetails = {
    document_id: data?.id || "",
    number: docNumber,

    // guardamos crudo + formateado (para futuros recálculos correctos)
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
    // 1) Actualiza lista de pagos seleccionados (como ya hacías)
    if (checked) {
      setNewPayment?.((prev: any[]) => [...prev, documentDetails]);
    } else {
      setNewPayment?.((prev: any[]) =>
        prev.filter((doc) => doc.document_id !== id)
      );
    }

    // 2) Avisa al padre si querés mantener el array de IDs
    onRowSelect?.(id, checked);

    // 3) Actualiza el total acumulado con el finalAmount de ESTA factura
    setFinalAmount((prevTotal) => {
      const delta = checked ? finalAmount : -finalAmount;
      // redondeo a 2 decimales para evitar ruido de coma flotante
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
                  {/* Checkbox de gracia manual — solo visible si está entre 30 y 37 días */}
                  {isGraceEligible && (
                    <div className="flex items-center justify-between">
                      <label className="text-gray-400 flex-1">
                        Dar gracia (vencimiento entre 30 y 37 días)
                      </label>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        checked={forceGrace}
                        onChange={(e) => setForceGrace(e.target.checked)}
                      />
                    </div>
                  )}

                  {/* Mostrar ajuste si hay descuento o recargo */}
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

                  {/* Nota (descuento 0%, recargo, etc.) */}
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