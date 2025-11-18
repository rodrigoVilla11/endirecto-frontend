// src/lib/payments/buildPaymentNotificationFromPayment.ts

export function buildPaymentNotificationFromPayment(payment: any): string {
  // ===== Helpers =====
  const fmtMoney = (n?: number) =>
    typeof n === "number"
      ? new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: String(payment?.currency || "ARS"),
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(n)
      : "—";

  const ddmmyy = (dateLike: any): string => {
    try {
      const d =
        typeof dateLike === "string" || typeof dateLike === "number"
          ? new Date(dateLike)
          : dateLike instanceof Date
          ? dateLike
          : new Date();
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = String(d.getFullYear()).slice(-2);
      return `${dd}/${mm}/${yy}`;
    } catch {
      return "—";
    }
  };

  const r2 = (n: number) => Math.round(n * 100) / 100;

  // ===== Safe getters =====
  const totals = payment?.totals ?? {};
  const documents: any[] = Array.isArray(payment?.documents)
    ? payment.documents
    : [];
  const values: any[] = Array.isArray(payment?.values) ? payment.values : [];

  const paymentId = payment?.id || payment?._id || payment?.number || "—";
  const when = payment?.date || new Date();

  const cliente = payment?.customer?.name || payment?.customer?.id || "—";
  const vendedor =
    payment?.seller?.name || payment?.seller?.id || payment?.seller_id || "—";
  const usuario =
    payment?.user?.name ||
    payment?.user?.id ||
    payment?.user?.user_id ||
    payment?.user_id ||
    "—";

  // ===== Totales de backend (con fallbacks) =====
  const gross = Number(totals?.gross) || 0; // Documentos base
  const docsAdjTotal = Number(totals?.discount) || 0; // +desc / -rec total docs
  const docsFinal = Number(totals?.net) || r2(gross - docsAdjTotal);
  const valuesRawBackend = Number(totals?.values_raw) || 0; // suma nominal
  const chequeInterest = Number(totals?.cheque_interest) || 0;

  // Si no vino values_raw, lo reconstruimos (nominal cheques = raw, otros = amount)
  const valuesRaw =
    valuesRawBackend ||
    values.reduce((acc, v) => {
      const m = String(v?.method || "").toLowerCase();
      if (m === "cheque") {
        const raw =
          typeof v?.raw_amount === "number"
            ? v.raw_amount
            : typeof v?.cheque?.net_amount === "number"
            ? r2((v.cheque.net_amount || 0) + (v.cheque.interest_amount || 0))
            : Number(v?.amount) || 0;
        return acc + raw;
      }
      return acc + (Number(v?.amount) || 0);
    }, 0);

  // ===== Desc/Cost F. aplicado a valores — con fallback para RECARGO + cheques =====
  // Backend ideal: totals.discount_applied_to_values
  let appliedAdjToValues = Number(totals?.discount_applied_to_values) || 0;

  const hasCheques = values.some(
    (v) => String(v?.method || "").toLowerCase() === "cheque"
  );
  const isSurcharge = docsAdjTotal < 0; // recargo en docs
  // En recargo, si el neto aportado por los valores alcanza el bruto de docs,
  // el ajuste aplicado a valores debe ser el recargo total (abs(discount)).
  const netFromValues = r2(valuesRaw - Math.abs(chequeInterest)); // nominal - CF cheques
  const reachesGross =
    Math.round(netFromValues * 100) >= Math.round(gross * 100);

  if (appliedAdjToValues === 0 && isSurcharge && hasCheques && reachesGross) {
    // fallback: usar el recargo total de documentos como ajuste sobre valores
    appliedAdjToValues = Math.abs(docsAdjTotal);
  }

  // ===== Acumulados y derivados (seguimos la “plantilla oficial”) =====
  const totalDescCF = r2(appliedAdjToValues + chequeInterest);
  const netToApply = r2(valuesRaw - totalDescCF); // = "Neto a aplicar Factura"
  const saldoDiff = r2(gross - netToApply);

  // ===== Días y % para cabecera =====
  const docRate =
    typeof documents?.[0]?.discount_rate === "number"
      ? documents[0].discount_rate
      : gross > 0
      ? docsAdjTotal / gross
      : 0;

  let daysWeighted = 0;
  if (documents.length > 0) {
    let baseSum = 0;
    let acc = 0;
    for (const d of documents) {
      const b = typeof d?.base === "number" ? d.base : 0;
      const dy =
        typeof d?.days_used === "number"
          ? d.days_used
          : typeof d?.days === "number"
          ? d.days
          : undefined;
      if (b > 0 && typeof dy === "number") {
        baseSum += b;
        acc += b * dy;
      }
    }
    daysWeighted = baseSum > 0 ? Math.round((acc / baseSum) * 100) / 100 : 0;
  }

  // ===== Texto =====
  const lines: string[] = [];
  lines.push(`Fecha: ${ddmmyy(when)}`);
  lines.push(`ID Pago: ${paymentId}`);
  lines.push(`Cliente: ${cliente}`);
  lines.push(`Vendedor: ${vendedor}`);
  lines.push(`Usuario: ${usuario}`);
  lines.push("");

  // Documentos
  lines.push(`Documentos: ${fmtMoney(gross)}`);
  if (gross > 0 && appliedAdjToValues !== 0) {
    const pctTxt = `${(docRate * 100).toFixed(2)}%`;
    lines.push(`Desc/Costo Financiero: ${daysWeighted || 0} - ${pctTxt}`);
    lines.push(
      `Desc/Costo Financiero por pago efect/transf: ${fmtMoney(
        Math.abs(appliedAdjToValues)
      )}`
    );
  }
  lines.push(`-------------------------------------------`);

  // Composición
  lines.push(`COMPOSICION DEL PAGO`);
  values.forEach((v) => {
    const method = String(v?.method || "").toLowerCase();
    if (method === "cheque") {
      const ch = v?.cheque || {};
      const dTxt = ch?.collection_date ? ddmmyy(ch.collection_date) : "—";
      // nominal
      const nominal =
        typeof v?.raw_amount === "number"
          ? v.raw_amount
          : typeof ch?.net_amount === "number"
          ? r2((ch.net_amount || 0) + (ch.interest_amount || 0))
          : Number(v?.amount) || 0;

      lines.push(`Cheque ${dTxt}: ${fmtMoney(nominal)}`);
      const daysCharged =
        typeof ch?.days_charged === "number" ? ch.days_charged : undefined;
      const pct =
        typeof ch?.interest_pct === "number"
          ? `${(ch.interest_pct * 100).toFixed(2)}%`
          : undefined;
      if (typeof daysCharged === "number" || pct) {
        lines.push(
          `Costo Financiero: ${daysCharged ?? "—"} - ${pct ?? "—"}`
        );
      }
      lines.push(`Costo Financiero: ${fmtMoney(ch?.interest_amount || 0)}`);
      lines.push(`-------------------------------------------`);
    } else {
      const label =
        method === "transferencia" ? "Transferencia" : "Efectivo";
      lines.push(`${label}: ${fmtMoney(Number(v?.amount) || 0)}`);
      lines.push(`-------------------------------------------`);
    }
  });

  // Totales finales
  lines.push(`Total Pagado (Nominal): ${fmtMoney(valuesRaw)}`);
  lines.push(`Desc/Cost F.: ${fmtMoney(appliedAdjToValues)}`);
  if (chequeInterest) {
    lines.push(`Cost F. Cheques: ${fmtMoney(chequeInterest)}`);
  }
  if (totalDescCF) {
    lines.push(`Total Desc/Cost F.: ${fmtMoney(totalDescCF)}`);
  }
  lines.push(`Neto a aplicar Factura: ${fmtMoney(netToApply)}`);
  lines.push(`SALDO: ${fmtMoney(saldoDiff)}`);

  return lines.join("\n");
}
