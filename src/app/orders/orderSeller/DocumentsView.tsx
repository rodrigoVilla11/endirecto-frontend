"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetDocumentByIdQuery } from "@/redux/services/documentsApi";
import { useGetPaymentConditionByIdQuery } from "@/redux/services/paymentConditionsApi";

export interface ExpandableTableProps {
  document_id: string;
  customerInformation: any;
  onRowSelect?: (id: string, checked: boolean) => void;
  selectedRows?: string[];
  setNewPayment?: any;

  // ✅ Nuevo: sólo estos modos
  paymentType: "pago_anticipado" | "cta_cte";
}

export function DocumentsView({
  document_id,
  onRowSelect,
  selectedRows = [],
  customerInformation,
  setNewPayment,
  paymentType,
}: ExpandableTableProps) {
  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const { data, error, isLoading } = useGetDocumentByIdQuery({ id: document_id });

  const { data: paymentsConditionsData } = useGetPaymentConditionByIdQuery({
    id: data?.payment_condition_id || "",
  });

  const toggleRow = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  /* ===================== Helpers de fecha y números ===================== */

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  function parseFlexibleDate(s?: string): Date | null {
    if (!s) return null;
    if (s.includes("/")) {
      const [dd, mm, yyyy] = s.split("/");
      const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatDateDDMMYYYY(date: string) {
    const d = parseFlexibleDate(date);
    if (!d) return "—";
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function daysBetween(a?: string, b?: string): number {
    const da = parseFlexibleDate(a);
    const db = parseFlexibleDate(b);
    if (!da || !db) return NaN;
    const ms = db.getTime() - da.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  function daysFromTo(start?: string, endDate: Date = new Date()) {
    const d = parseFlexibleDate(start);
    if (!d) return NaN;
    const ms = endDate.getTime() - d.getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
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

  /* ===================== Reglas de descuento (nuevo modelo) ===================== */

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
    paymentType: "pago_anticipado" | "cta_cte",
    docPaymentCondition?: string
  ): { rate: number; note?: string } {
    // 1) Condición de pago del documento bloquea descuentos
    if (isNoDiscountCondition(docPaymentCondition)) {
      return { rate: 0, note: "Sin descuento por condición de pago" };
    }

    // 2) Pago anticipado: sin reglas de % (0%)
    if (paymentType === "pago_anticipado") {
      return { rate: 0, note: "Pago anticipado sin regla" };
    }

    // 3) Cuenta corriente: por días
    if (isNaN(docDays)) return { rate: 0, note: "Fecha/estimación inválida" };
    if (docDays <= 15) return { rate: 0.13 };
    if (docDays <= 30) return { rate: 0.10 };
    if (docDays > 45) return { rate: 0, note: "Actualización de precios" };
    return { rate: 0, note: "Precio facturado (0%)" };
  }

  /* ===================== Derivados del documento ===================== */

  const invoiceDateStr = data?.date;
  const expirationDateStr = data?.expiration_date;
  const docNumber = data?.number ?? "";
  const amount = Number(data?.amount ?? 0);

  const days_until_expiration = daysBetween(invoiceDateStr, expirationDateStr);
  const days_since_invoice = daysFromTo(invoiceDateStr);
  const balanceRaw = Number(customerInformation?.document_balance ?? amount ?? 0);
  const balance = isNaN(balanceRaw) ? 0 : balanceRaw;

  const paymentConditionName = paymentsConditionsData?.name || t("document.noEspecificado");
  const { rate, note } = getDiscountRule(
    days_since_invoice,
    paymentType,
    paymentConditionName
  );

  const discountAmount = round2(balance * rate);
  const finalAmount = round2(balance - discountAmount);

  /* ===================== Integración con selección ===================== */

  const documentDetails = {
    document_id: data?.id || "",
    number: docNumber,
    date: formatDateDDMMYYYY(invoiceDateStr || ""),
    expiration_date: formatDateDDMMYYYY(expirationDateStr || ""),
    amount: String(amount ?? ""),
    document_balance: String(balance),
    payment_condition: paymentConditionName,
    saldo_a_pagar: String(balance),
    days_until_expiration: Number.isFinite(days_until_expiration) ? days_until_expiration : NaN,
    days_until_expiration_today: Number.isFinite(days_since_invoice) ? days_since_invoice : NaN,
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setNewPayment?.((prev: any[]) => [...prev, documentDetails]);
    } else {
      setNewPayment?.((prev: any[]) => prev.filter((doc) => doc.document_id !== id));
    }
    onRowSelect?.(id, checked);
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
                onChange={(e) => handleCheckboxChange(data.id, e.target.checked)}
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
                  {formatDateDDMMYYYY(invoiceDateStr || "")} - {t("document.vto")} {formatDateDDMMYYYY(expirationDateStr || "")}
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
                    <span className="text-gray-400">{t("document.comprobante")}</span>
                    <span className="text-gray-200">{docNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t("document.condicionPago")}</span>
                    <span className="text-gray-200">
                      {paymentConditionName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t("document.importe")}</span>
                    <span className="text-gray-200">
                      {formatPriceWithCurrency(amount)}
                    </span>
                  </div>
                </div>

                {/* Saldo actual */}
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("document.saldo") || "Saldo"}</span>
                  <span className="text-gray-200">
                    {formatPriceWithCurrency(balance)}
                  </span>
                </div>

                {/* Días / Descuento / Final */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t("document.diasDesdeEmision") || "Días desde emisión"}</span>
                    <span className={`text-gray-200 ${note ? "text-amber-400" : ""}`}>
                      {Number.isFinite(days_since_invoice) ? days_since_invoice : "—"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">{t("document.descuento")}</span>
                    <span className="text-gray-200">
                      {(rate * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">{t("document.importeDescuento") || "Importe desc."}</span>
                    <span className="text-gray-200">
                      -{formatPriceWithCurrency(discountAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between font-medium">
                    <span className="text-gray-400">{t("document.finalConDescuento") || "Final c/desc."}</span>
                    <span className={`text-gray-200 ${note ? "text-amber-400" : ""}`}>
                      {formatPriceWithCurrency(finalAmount)}
                    </span>
                  </div>

                  {note ? (
                    <div className="text-xs text-amber-400 mt-1">{note}</div>
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
