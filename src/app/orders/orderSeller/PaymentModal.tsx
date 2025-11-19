"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { DocumentsView } from "./DocumentsView";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerInformationByCustomerIdQuery } from "@/redux/services/customersInformations";
import ValueView from "./ValueView";
import { CommentsView } from "./CommentsView";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/app/context/AuthContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import {
  useGetInterestRateQuery,
  useGetChequeGraceDaysQuery,
  useGetDocumentsGraceDaysQuery,
} from "@/redux/services/settingsApi";
import InfoRow from "./PaymentModal/components/InfoRow";
import { LabelWithTip } from "./PaymentModal/components/LabelWithTip";
import ConfirmDialog from "./PaymentModal/components/ConfirmDialog";
import ModalCalculator from "./PaymentModal/components/ModalCalculator";
import { usePaymentComputations } from "./PaymentModal/hooks/usePaymentComputations";
import { useCreatePaymentHandler } from "./PaymentModal/hooks/useCreatePaymentHandler";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { t } = useTranslation();
  // 🔁 Valores primero
  const [activeTab, setActiveTab] = useState<
    "documents" | "values" | "comments"
  >("documents");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const { selectedClientId } = useClient();
  const [comments, setComments] = useState("");
  const [graceDiscount, setGraceDiscount] = useState<Record<string, boolean>>(
    {}
  );
  const [isValuesValid, setIsValuesValid] = useState(true);
  const { data: checkGrace } = useGetChequeGraceDaysQuery();
  const { data: documentsGrace } = useGetDocumentsGraceDaysQuery();
  const [openModalRefi, setOpenModalRefi] = useState(false);

  const openCreateModal = useCallback(() => setOpenModalRefi(true), []);
  const closeCreateModal = useCallback(() => {
    setOpenModalRefi(false);
  }, []);

  type PaymentType = "pago_anticipado" | "cta_cte";

  const { data: interestSetting } = useGetInterestRateQuery();

  useEffect(() => {
    if (typeof interestSetting?.value === "number") {
      setAnnualInterestPct(interestSetting.value);
      localStorage.setItem(
        "interest_annual_pct",
        String(interestSetting.value)
      );
    } else {
      const cached = Number(localStorage.getItem("interest_annual_pct"));
      if (!isNaN(cached)) setAnnualInterestPct(cached);
    }
  }, [interestSetting]);

  const [paymentTypeUI, setPaymentTypeUI] = useState<PaymentType>("cta_cte"); // o "pago_anticipado" si preferís
  // ✅ eliminar: ContraEntregaOption, contraEntregaOpt, contraEntregaMonto
  // Documentos seleccionados (llenados por DocumentsView)
  const [newPayment, setNewPayment] = useState<
    {
      document_id: string;
      number: string;
      date: string;
      expiration_date: string;
      amount: string;
      document_balance: string;
      payment_condition: string;
      saldo_a_pagar: string;
      days_until_expiration: number;
      days_until_expiration_today: number;
    }[]
  >([]);

  const [annualInterestPct, setAnnualInterestPct] = useState<number>(96);

  // Valores ingresados
  type PaymentMethod = "efectivo" | "transferencia" | "cheque";
  type ValueItem = {
    /** Monto imputable (para cheque = neto) */
    amount: string;
    /** Solo cheques: monto original ingresado */
    raw_amount?: string;
    /** Solo cheques: fecha de cobro */
    chequeDate?: string;

    selectedReason: string;
    method: PaymentMethod;
    bank?: string;

    /** adjuntos */
    receiptUrl?: string;
    receiptOriginalName?: string;
    chequeNumber?: string;
    overrideGraceDays?: number;
    cf?: number;
  };

  const [newValues, setNewValues] = useState<ValueItem[]>([]);

  const [submittedPayment, setSubmittedPayment] = useState(false);

  const [grace, setGrace] = useState<number>();

  const currencyFmt = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // ⛔️ Si hay documentos seleccionados, bloquear contra_entrega y forzar cta_cte
  const hasSelectedDocs = newPayment.length > 0;
  useEffect(() => {
    if (hasSelectedDocs && paymentTypeUI === "pago_anticipado") {
      setPaymentTypeUI("cta_cte");
    }
  }, [hasSelectedDocs, paymentTypeUI]);

  const { userData } = useAuth();

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  // TODO: si en tu app la condición de pago es un registro real, poné su ID de DB acá.
  // Por ahora mando un id simbólico según la UI:
  const getPaymentConditionId = () =>
    paymentTypeUI === "cta_cte" ? "cta_cte" : "pago_anticipado";

  const { data: customer } = useGetCustomerByIdQuery(
    { id: selectedClientId ?? "" },
    { skip: !selectedClientId }
  );
  const canSend = isValuesValid && newValues.length > 0;

  const { data } = useGetCustomerInformationByCustomerIdQuery({
    id: selectedClientId ?? undefined,
  });

  const handleRowSelect = (id: string, checked: boolean) => {
    setSelectedRows((prev) =>
      checked ? [...prev, id] : prev.filter((rowId) => rowId !== id)
    );
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // 👇 reordenamos tabs: Valores, Comprobantes, Comentarios
  const tabsOrder: Array<"values" | "documents" | "comments"> = [
    "documents",
    "values",
    "comments",
  ];

  // Neto modelo “dto sobre valores”

  const {
    computedDiscounts,
    totalBase,
    totalDocsFinal,
    docAdjustmentSigned,
    totalValues,
    valuesNetNonChequeUI,
    blockChequeInterest,
    rawAdjustmentOnValues,
    totalAdjustmentSigned,
    docSurchargePending,
    hasPartialPayment,
    totalNetForUI,
    docsDaysMin,
    hasAnyUnder45Days,
    hasInvoiceToday,
  } = usePaymentComputations({
    newPayment,
    newValues,
    paymentTypeUI,
    graceDiscount,
    annualInterestPct,
  });

  const handleAfterSuccess = useCallback(() => {
    setIsConfirmModalOpen(false);
    setSubmittedPayment(true);
    setNewValues([]);
    setNewPayment([]);
    setSelectedRows([]);
    setComments("");
    onClose();
  }, [onClose]);

  const receiptDateRef = useRef<Date>(new Date());

  const { handleCreatePayment, isProcessingPayment } = useCreatePaymentHandler({
    paymentTypeUI,
    selectedClientId,
    customerName: customer?.name || "",
    userId: userData?._id || null,
    sellerId: userData?.seller_id || null,
    comments,
    newValues,
    computedDiscounts,
    totalBase,
    totalNetForUI,
    totalValues,
    docAdjustmentSigned,
    checkGraceValue: checkGrace?.value,
    annualInterestPct,
    receiptDate: receiptDateRef.current,
    blockChequeInterest,
    getPaymentConditionId,
    onSuccess: handleAfterSuccess,
  });
  // Flag para saber si estamos en “pagar total por comprobante”
  const [payTotalDocMode, setPayTotalDocMode] = useState(false);

  // Si el usuario modifica los valores, salimos del modo “pagar total”
  useEffect(() => {
    if (newValues.length !== 1) {
      setPayTotalDocMode(false);
      return;
    }
    const only = parseFloat(newValues[0].amount || "0");
    if (Math.abs(only - round2(totalDocsFinal)) > 0.01)
      setPayTotalDocMode(false);
  }, [newValues, totalDocsFinal]);

  // Razones estandarizadas (evita strings mágicos en varios lugares)
  const PAY_TOTAL_REASON = "Pago total a factura";

  const EPS = 0.01;

  function isPayTotalItem(v: ValueItem) {
    return v.selectedReason === PAY_TOTAL_REASON && v.method === "efectivo";
  }
  // Si el valor generado por "Pagar total" cambia de monto,
  // cambiamos también su concepto a "Sin Concepto" y salimos del modo.
  // Si cambia el monto del item de "Pagar total", renombrá el concepto
  useEffect(() => {
    // debe existir EXACTAMENTE un valor y debe ser el de "pagar total"
    if (newValues.length !== 1) {
      setPayTotalDocMode(false);
      return;
    }

    const v = newValues[0];
    if (!isPayTotalItem(v)) {
      setPayTotalDocMode(false);
      return;
    }

    const amt = round2(parseFloat(v.amount || "0"));
    const docsFinal = round2(totalDocsFinal);

    // si el monto coincide (dentro de la tolerancia), activamos el modo
    setPayTotalDocMode(Math.abs(amt - docsFinal) <= EPS);
  }, [newValues, totalDocsFinal]);

  const hasRefiValues = newValues.some(
    (v) => v.method === "cheque" && v.selectedReason === "Refinanciación"
  );

  const showSobrePago = !payTotalDocMode && hasPartialPayment;

  const formattedTotalGross = currencyFmt.format(totalBase);

  const targetForRefi =
    docAdjustmentSigned < 0 ? round2(totalDocsFinal) : round2(totalBase);

  // Diferencia para refinanciación (contra el objetivo correcto)
  const diff = round2(targetForRefi - totalValues);
  // Cálculo de saldo a refinanciar (debe estar antes del return)
  const { remainingToRefi, remainingToRefiWithSurchage } = useMemo(() => {
    // 1. Separar valores según tipo
    const cashValues = newValues.filter(
      (v) => v.method === "efectivo" || v.method === "transferencia"
    );

    const chequeValues = newValues.filter((v) => v.method === "cheque");

    // 2. Cheques normales (SÍ cuentan como pago previo)
    const normalCheques = chequeValues.filter(
      (v) => !v.selectedReason?.toLowerCase().includes("refinanciación")
    );

    // 3. Calcular poder de pago del EFECTIVO/TRANSFERENCIA
    const cashNominal = cashValues.reduce(
      (acc, v) => acc + parseFloat(v.amount || "0"),
      0
    );

    let cashPower = cashNominal;
    if (docAdjustmentSigned > 0 && totalBase > 0) {
      const discountRate = docAdjustmentSigned / totalBase;
      cashPower = round2(cashNominal * (1 + discountRate));
    }

    // 4. Calcular poder de pago de CHEQUES NORMALES
    const chequeNeto = normalCheques.reduce(
      (acc, v) => acc + parseFloat(v.amount || "0"),
      0
    );

    // 5. Poder de pago total previo
    const totalPreviousPower = round2(cashPower + chequeNeto);

    // 6. Determinar si hay pagos previos
    const hasNonRefiPayments =
      cashValues.length > 0 || normalCheques.length > 0;

    // 7. BASE para calcular saldo
    let baseToRefi: number;

    if (!hasNonRefiPayments) {
      // REFINANCIACIÓN COMPLETA:
      // SIEMPRE contra el total bruto (SIN descuento/recargo)
      baseToRefi = round2(totalBase);
    } else {
      // REFINANCIACIÓN DE SALDO:
      // Contra el neto a pagar a la fecha
      baseToRefi = round2(totalDocsFinal);
    }
    // 8. Saldo a refinanciar
    const remaining = Math.max(0, round2(baseToRefi - totalPreviousPower));

    console.log("💰 Refinanciación:", {
      tipo: hasNonRefiPayments ? "SALDO" : "COMPLETA",
      base: baseToRefi,
      totalBase,
      totalDocsFinal,
      docAdjustmentSigned,
      efectivo: { nominal: cashNominal, poder: cashPower },
      cheques: { neto: chequeNeto },
      totalPreviousPower,
      remaining,
    });

    return {
      remainingToRefi: remaining,
      remainingToRefiWithSurchage: remaining,
    };
  }, [newValues, totalBase, totalDocsFinal, docAdjustmentSigned]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50"
      onClick={!isConfirmModalOpen ? onClose : undefined}
    >
      <div
        className="h-full flex flex-col bg-zinc-900 max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-white">
              ←
            </button>
            <h2 className="text-xl font-semibold text-white">
              {t("paymentModal.headerTitle")}
            </h2>
          </div>
          <span className="text-white">📄</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="border-b border-zinc-800">
            <InfoRow label={t("paymentModal.date")} value={formattedDate} />
            <InfoRow
              label={
                <div className="flex items-center gap-2">
                  {t("paymentModal.gps")}{" "}
                  <span className="text-red-500">📍</span>
                </div>
              }
              value={
                <span className="text-yellow-500">
                  {t("paymentModal.noInsitu")}
                </span>
              }
            />

            {/* SUBTOTAL */}
            <InfoRow label="Total facturas" value={formattedTotalGross} />
            {/* <InfoRow label="Pagos" value={formattedTotalValues} /> */}

            {/* 3) Desc/Rec financiero ($ en pesos con signo) */}
            <InfoRow
              label={
                <LabelWithTip
                  label="Desc/Costo financiero"
                  tip={
                    showSobrePago
                      ? "Ajuste aplicado SOBRE EL PAGO cargado (prorrateado)."
                      : "Ajuste por COMPROBANTES según reglas por días."
                  }
                />
              }
              value={
                <div className="text-right">
                  {(() => {
                    const signedRaw = showSobrePago
                      ? docAdjustmentSigned < 0
                        ? totalAdjustmentSigned // recargo prorrateado
                        : hasRefiValues
                        ? 0
                        : totalAdjustmentSigned // descuento: 0 si refi, si no prorrateado
                      : docAdjustmentSigned;

                    // Normalizamos para UI: "desc" se muestra con signo "−" y en verde
                    const isDiscount = showSobrePago
                      ? signedRaw < 0
                      : signedRaw >= 0;

                    const displayAbs = Math.abs(signedRaw);
                    const text = `${isDiscount ? "−" : "+"}${currencyFmt.format(
                      displayAbs
                    )}`;
                    const cls = isDiscount
                      ? "text-emerald-400"
                      : "text-red-400";

                    return <div className={cls}>{text}</div>;
                  })()}
                </div>
              }
            />

            {/* <InfoRow
              label="Total a pagar a la fecha"
              value={currencyFmt.format(totalFinal)}
            /> */}
            <InfoRow
              label="TOTAL A PAGAR (efect/transf)"
              value={currencyFmt.format(round2(totalDocsFinal))}
            />

            {/* Valores y Diferencia (igual que antes) */}
            {/* <InfoRow
              label="Saldo"
              value={formattedDiff}
              valueClassName={
                diff === 0
                  ? "text-emerald-500"
                  : diff > 0
                  ? "text-amber-400"
                  : "text-red-500"
              }
            /> */}
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-3">
            {tabsOrder.map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`p-4 text-sm font-medium ${
                  activeTab === tabKey
                    ? "bg-white text-black"
                    : "bg-zinc-900 text-white"
                }`}
              >
                {t(`paymentModal.tabs.${tabKey}`)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === "documents" && (
              <div className="text-white">
                {data &&
                  "documents" in data &&
                  (data as any).documents.map((item: any) => (
                    <DocumentsView
                      key={item.id}
                      document_id={item.id}
                      customerInformation={item}
                      onRowSelect={handleRowSelect}
                      selectedRows={selectedRows}
                      setNewPayment={setNewPayment}
                      paymentType={paymentTypeUI}
                      graceDays={
                        documentsGrace?.value ? documentsGrace?.value : 45
                      }
                      annualInterestPct={
                        interestSetting?.value ? interestSetting.value : 0
                      }
                      graceDiscount={graceDiscount}
                      setGraceDiscount={setGraceDiscount}
                    />
                  ))}
              </div>
            )}

            {activeTab === "values" && (
              <div className="text-white space-y-4">
                {/* Selector de condición */}
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-2 rounded ${
                      paymentTypeUI === "cta_cte"
                        ? "bg-white text-black"
                        : "bg-zinc-700 text-white"
                    }`}
                    onClick={() => setPaymentTypeUI("cta_cte")}
                  >
                    Cuenta corriente
                  </button>

                  <button
                    className={`px-3 py-2 rounded ${
                      paymentTypeUI === "pago_anticipado"
                        ? "bg-white text-black"
                        : "bg-zinc-700 text-white"
                    } ${
                      hasSelectedDocs ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => {
                      if (!hasSelectedDocs) setPaymentTypeUI("pago_anticipado");
                    }}
                    disabled={hasSelectedDocs}
                    title={
                      hasSelectedDocs
                        ? "Con comprobantes seleccionados solo se permite Cuenta corriente"
                        : "Pago anticipado"
                    }
                  >
                    Pago anticipado
                  </button>
                </div>

                {/* Botón para PAGAR TOTAL (descuento aplicado al comprobante) */}
                <button
                  className="mt-1 px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-60"
                  onClick={() => {
                    const method: PaymentMethod = "efectivo";
                    const amount = round2(totalDocsFinal);

                    const base: ValueItem = {
                      amount: amount.toString(),
                      selectedReason: PAY_TOTAL_REASON,
                      method,
                    };

                    setPayTotalDocMode(true); // 👈 activamos modo total por doc

                    setNewValues((prev) => {
                      const idx = prev.findIndex(
                        (v) => v.selectedReason === base.selectedReason
                      );
                      if (idx >= 0) {
                        const clone = [...prev];
                        clone[idx] = base;
                        return clone;
                      }
                      return [base, ...prev];
                    });
                  }}
                  disabled={computedDiscounts.length === 0}
                >
                  Pagar total
                </button>

                {/* Valores manuales */}
                <ValueView
                  newValues={newValues}
                  setNewValues={setNewValues}
                  annualInterestPct={annualInterestPct}
                  netToPay={round2(totalDocsFinal)}
                  gross={totalBase}
                  docAdjustmentSigned={
                    showSobrePago
                      ? docAdjustmentSigned < 0
                        ? -totalAdjustmentSigned // recargo → negativo
                        : hasRefiValues
                        ? 0
                        : -totalAdjustmentSigned // descuento → 0 si refi, si no positivo
                      : docAdjustmentSigned
                  }
                  onValidityChange={setIsValuesValid}
                  chequeGraceDays={
                    blockChequeInterest
                      ? 100000 // 👈 fuerza días_cobrados = 0 en la UI
                      : checkGrace?.value
                      ? checkGrace.value
                      : 10
                  }
                  docsDaysMin={docsDaysMin}
                  receiptDate={receiptDateRef.current}
                  blockChequeInterest={blockChequeInterest}
                  computedDiscounts={computedDiscounts}
                  totalDocsFinal={totalDocsFinal}
                  totalBase={totalBase}
                  onOpenCalculator={openCreateModal}
                  showCalculatorButton={newValues.length > 0}
                />
              </div>
            )}

            {activeTab === "comments" && (
              <div className="text-white">
                <CommentsView comments={comments} setComments={setComments} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 mt-auto border-t border-zinc-800">
          <button
            onClick={() => {
              if (!canSend) {
                alert(
                  newValues.length === 0
                    ? "Agregá al menos un pago (valor) para confirmar."
                    : "Completá los datos requeridos del/los valores."
                );
                return;
              }
              setIsConfirmModalOpen(true);
            }}
            disabled={!canSend}
            className={`w-full bg-blue-500 text-white py-3 rounded-md font-medium ${
              !canSend ? "opacity-60 cursor-not-allowed" : ""
            }`}
            title={
              !canSend
                ? newValues.length === 0
                  ? "Agregá al menos un valor"
                  : "Faltan datos válidos en los valores"
                : undefined
            }
          >
            {t("paymentModal.send")}
          </button>
        </div>
      </div>

      {/* Confirm Modal (sin cambios funcionales) */}
      {isConfirmModalOpen && (
        <ConfirmDialog
          open={isConfirmModalOpen}
          onCancel={() => setIsConfirmModalOpen(false)}
          onConfirm={handleCreatePayment}
          isLoading={isProcessingPayment}
          canConfirm={canSend} // 👈 ahora exige valores + validez
          invalidReason={
            newValues.length === 0
              ? "Agregá al menos un pago (valor)."
              : "Completá el banco para cheque/transferencia"
          }
          title="Confirmar envío"
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            ¿Querés confirmar la creación del pago?
          </p>
        </ConfirmDialog>
      )}

      {openModalRefi && (
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <ModalCalculator
            open={openModalRefi}
            onCancel={closeCreateModal}
            grace={grace}
            interestSetting={interestSetting}
            newValues={newValues}
            setNewValues={setNewValues}
            docsDaysMin={docsDaysMin}
            docSurchargePending={docSurchargePending}
            remainingToRefi={remainingToRefiWithSurchage}
            blockChequeInterest={blockChequeInterest}
          />
        </div>
      )}
    </div>
  );
}
