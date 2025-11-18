// components/ValueView/PaymentSummary.tsx

import React from "react";
import { PaymentTotals } from "./types/types";
import { LabelWithTip } from "./LabelWithTip";

interface PaymentSummaryProps {
  totals: PaymentTotals;
  docAdjustmentSigned: number;
  hasCheques: boolean;
  hasChequePromo: boolean;
  currencyFormatter: Intl.NumberFormat;
}

export function PaymentSummary({
  totals,
  docAdjustmentSigned,
  hasCheques,
  hasChequePromo,
  currencyFormatter,
}: PaymentSummaryProps) {
  return (
    <div className="mt-4 space-y-1 text-sm">
      <RowSummary
        label={
          <LabelWithTip
            label="TOTAL PAGADO (NOMINAL)"
            tip="Suma de importes originales: para cheques se toma el monto bruto, para otros métodos el monto ingresado."
          />
        }
        value={currencyFormatter.format(totals.totalNominalValues)}
      />

      <RowSummary
        label={
          <LabelWithTip
            label="DTO/COSTO FINANCIERO"
            tip="Ajuste por comprobantes según días y condición de pago: descuento (signo -) o recargo (signo +)."
          />
        }
        value={`${docAdjustmentSigned >= 0 ? "-" : "+"}${currencyFormatter.format(
          Math.abs(docAdjustmentSigned)
        )}`}
      />

      {hasCheques && (
        <>
          <RowSummary
            label={
              <LabelWithTip
                label="COSTO FINANCIERO (CHEQUES)"
                tip="Suma del costo financiero de todos los cheques (monto bruto x % por días gravados)."
              />
            }
            value={`+${currencyFormatter.format(totals.totalChequeInterest)}`}
          />

          {hasChequePromo && (
            <RowSummary
              label={
                <LabelWithTip
                  label="DTO PROMO (CHEQUES)"
                  tip="Descuento promocional aplicado a cheques según reglas de días (0–7/7–15/15–30)."
                />
              }
              value={`-${currencyFormatter.format(totals.totalChequePromo)}`}
            />
          )}

          <RowSummary
            label={
              <LabelWithTip
                label="TOTAL DESC/COST F."
                tip="Suma del ajuste por documentos (descuento/recargo) y el costo financiero de cheques."
              />
            }
            value={`${
              totals.totalDescCostF >= 0 ? "+" : ""
            }${currencyFormatter.format(totals.totalDescCostF)}`}
            bold
          />
        </>
      )}

      <RowSummary
        label={
          <LabelWithTip
            label="NETO EFECTIVO A IMPUTAR"
            tip="Valor real que se imputa: Nominal - CF + Promo. Este es el poder de pago efectivo."
          />
        }
        value={currencyFormatter.format(totals.netEffectivePayment)}
        bold
      />

      <RowSummary
        label={
          <LabelWithTip
            label="SALDO"
            tip="Diferencia entre el total a pagar de documentos (neto) y los pagos imputados. Si es 0, el pago queda cubierto."
          />
        }
        value={currencyFormatter.format(totals.saldoUI)}
        highlight={
          totals.saldoUI === 0
            ? "ok"
            : totals.saldoUI < 0
            ? "bad"
            : "warn"
        }
        copy={totals.saldoUI}
      />
    </div>
  );
}

function RowSummary({
  label,
  value,
  bold,
  highlight,
  copy,
}: {
  label: React.ReactNode;
  value: string;
  bold?: boolean;
  highlight?: "ok" | "bad" | "warn";
  copy?: number;
}) {
  const color =
    highlight === "ok"
      ? "text-emerald-500"
      : highlight === "bad"
      ? "text-red-500"
      : highlight === "warn"
      ? "text-amber-400"
      : "text-white";

  return (
    <div className="flex justify-between">
      <span className={`text-zinc-300 ${bold ? "font-semibold" : ""}`}>
        {label}
      </span>
      <div>
        <span
          className={`${color} tabular-nums ${bold ? "font-semibold" : ""}`}
        >
          {value}
        </span>
        {copy && copy > 0 && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(copy.toFixed(2));
            }}
            className="ml-2 text-xs text-zinc-400 hover:text-emerald-400 transition-colors"
            title="Copiar saldo"
          >
            📋
          </button>
        )}
      </div>
    </div>
  );
}