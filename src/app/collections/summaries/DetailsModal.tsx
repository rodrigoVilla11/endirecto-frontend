import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { Payment } from "@/redux/services/paymentsApi";
import { useGetUserByIdQuery } from "@/redux/services/usersApi";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { FaCheck, FaCopy, FaSpinner, FaTimes } from "react-icons/fa";
import { isPaymentRendido } from "./page";

type DetailsModalProps = {
  payment: Payment;
  onClose: () => void;
  onMark: () => void;
  isMarking: boolean;
  t: (k: string) => string;
};
export default function DetailsModal({
  payment,
  onClose,
  onMark,
  isMarking,
  t,
}: DetailsModalProps) {
  // ===== formateadores =====
  const currencyFmt = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: payment.currency || "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // ===== lógica de rendición =====
  const rendido = isPaymentRendido(payment);

  const userId =
    (payment as any)?.user?.id ??
    (payment as any)?.user?._id ??
    (payment as any)?.user_id ??
    "";
  const userQuery = useGetUserByIdQuery(userId ? { id: userId } : { id: "" }, {
    skip: !userId,
  });

  const fmtMoney = (n: any) =>
    currencyFmt.format(Number(typeof n === "number" ? n : (n ?? 0)));

  const mainDoc =
    Array.isArray(payment?.documents) && payment.documents.length
      ? payment.documents[0]
      : undefined;

  const fecha = (() => {
    const raw = (payment?.date as any)?.$date ?? payment?.date;
    try {
      return raw ? format(new Date(raw), "dd/MM/yyyy HH:mm") : "—";
    } catch {
      return "—";
    }
  })();

  const idPago = (payment as any)?._id?.$oid ?? (payment as any)?._id ?? "—";

  const { data: customer } = useGetCustomerByIdQuery(
    { id: payment?.customer?.id ?? "" },
    { skip: !payment?.customer?.id },
  );

  const clienteLabel = (() => {
    const id = payment?.customer?.id ?? (payment as any)?.customer_id;
    const name = customer?.name;
    if (id && name) return `${id} - ${name}`;
    if (id) return `${id}`;
    if (name) return `${name}`;
    return "—";
  })();

  const sellerLabel =
    (payment as any)?.seller?.name ??
    (payment as any)?.seller?.id ??
    (payment as any)?.seller_id ??
    "—";

  const username = userQuery?.data?.username ?? "—";

  const gross = payment?.totals?.gross; // Documentos base (Σ base_i)
  const discountAmtOriginal = -payment?.totals?.discount; // Desc/Cost F (monto, puede ser <0)
  const net = payment?.totals?.net; // TOTAL A PAGAR (efect/transf)
  const valuesNominal = (payment?.totals as any)?.values_raw; // suma de bases (nominal cheques)
  const chequeInterest = (payment?.totals as any)?.cheque_interest; // Σ intereses cheques
  const saldoDiff = (payment?.totals as any)?.diff;

  const netFromValues =
    typeof valuesNominal === "number" && typeof chequeInterest === "number"
      ? valuesNominal - Math.abs(chequeInterest)
      : typeof valuesNominal === "number"
        ? valuesNominal
        : undefined;

  const valuesDoNotReachTotal =
    typeof gross === "number" &&
    typeof netFromValues === "number" &&
    netFromValues < gross;

  const daysUsed = (mainDoc as any)?.days_used;
  const discountRate = (mainDoc as any)?.discount_rate; // fracción
  const discountRateTxt =
    typeof discountRate === "number"
      ? `${(discountRate * 100).toFixed(2)}%`
      : undefined;

  const discountAmt =
    valuesDoNotReachTotal && typeof netFromValues === "number" && discountRate
      ? -1 * (netFromValues * discountRate) // Aplicar la tasa sobre el neto real
      : discountAmtOriginal;

  // Monto aplicado a valores que vino en el payload (handleCreatePayment v04/11/2025)
  const discountAmtToValuesRaw =
    typeof (payment?.totals as any)?.discount_applied_to_values === "number"
      ? (payment!.totals as any).discount_applied_to_values
      : undefined;

  // Si no vino en totals, usamos tu cálculo derivado (`discountAmt`)
  const discountAmtToValues =
    typeof discountAmtToValuesRaw === "number"
      ? discountAmtToValuesRaw
      : discountAmt;

  // Atajo: el que realmente se aplica a valores (y alimenta "Total Desc/Cost F")
  const appliedDiscount =
    typeof discountAmtToValues === "number" ? discountAmtToValues : 0;

  // Para decidir si mostrar la fila separada
  const showDiscountToValuesRow =
    typeof discountAmtToValues === "number" &&
    typeof discountAmtOriginal === "number" &&
    Math.abs(discountAmtToValues - discountAmtOriginal) > 0.009;

  const totalDescCostF =
    (typeof appliedDiscount === "number" ? appliedDiscount : 0) +
    (typeof chequeInterest === "number" ? chequeInterest : 0);
  const netToApply =
    typeof valuesNominal === "number" && typeof totalDescCostF === "number"
      ? valuesNominal - totalDescCostF
      : undefined;
  const hasCheques =
    Array.isArray(payment?.values) &&
    payment.values.some(
      (v: any) => String(v?.method).toLowerCase() === "cheque",
    );

  // Genero texto copiable idéntico al “resumen simple” que venías usando
  const copyLines = (() => {
    const lines: string[] = [];
    const documents: any[] = Array.isArray(payment?.documents)
      ? payment.documents
      : [];
    lines.push(`Fecha: ${fecha.replace(" ", " ")}`);
    lines.push(`ID Pago: ${idPago}`);
    lines.push(`Cliente: ${clienteLabel}`);
    lines.push(`Vendedor: ${sellerLabel}`);
    lines.push(`Usuario: ${username}`);
    lines.push(``);

    lines.push(`DOCUMENTOS:`);

    if (documents.length === 0) {
      lines.push(`Sin documentos aplicados`);
    } else {
      documents.forEach((doc, idx) => {
        const docNumber = doc?.number || `#${idx + 1}`;
        const docBase = typeof doc?.base === "number" ? doc.base : 0;
        const docDiscount =
          typeof doc?.discount_amount === "number" ? doc.discount_amount : 0;
        const docFinal =
          typeof doc?.final_amount === "number" ? doc.final_amount : docBase;
        const docDays =
          typeof doc?.days_used === "number"
            ? doc.days_used
            : typeof doc?.days === "number"
              ? doc.days
              : undefined;

        lines.push(`  • ${docNumber}: ${fmtMoney(docBase)}`);

        if (docDiscount !== 0) {
          const label = docDiscount > 0 ? "Desc" : "Cost. F";
          const pct =
            docBase > 0
              ? `${((Math.abs(docDiscount) / docBase) * 100).toFixed(2)}%`
              : "";
          const daysText = typeof docDays === "number" ? `${docDays}d` : "";
          lines.push(`    ${label}: ${daysText} ${pct ? `- ${pct}` : ""}`);
          lines.push(`    ${label}: ${fmtMoney(Math.abs(docDiscount))}`);
        }

        lines.push(`    Neto: ${fmtMoney(docFinal)}`);

        if (idx < documents.length - 1) {
          lines.push(""); // línea en blanco entre documentos
        }
      });
    }

    lines.push(`-------------------------------------------`);

    if (typeof gross === "number") lines.push(`Documentos: ${fmtMoney(gross)}`);
    if (typeof daysUsed === "number" && discountRateTxt) {
      lines.push(
        `Desc/Costo Financiero: ${daysUsed} días - ${discountRateTxt}`,
      );
    }
    if (typeof appliedDiscount === "number") {
      lines.push(
        `Desc/Costo Financiero por pago efect/transf: ${fmtMoney(
          Math.abs(appliedDiscount),
        )}`,
      );
    }
    lines.push(``);

    if (Array.isArray(payment?.values) && payment.values.length > 0) {
      lines.push(`COMPOSICION DEL PAGO:`);
      payment.values.forEach((v: any) => {
        const method = String(v?.method || "").toLowerCase();
        if (method === "cheque") {
          const whenRaw = v?.cheque?.collection_date;
          const dTxt = whenRaw
            ? (() => {
                try {
                  const d =
                    typeof whenRaw === "string" || typeof whenRaw === "number"
                      ? new Date(whenRaw)
                      : whenRaw instanceof Date
                        ? whenRaw
                        : new Date();

                  const dd = String(d.getUTCDate()).padStart(2, "0");
                  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
                  const yy = String(d.getUTCFullYear()).toString().slice(-2);

                  return `${dd}/${mm}/${yy}`;
                } catch {
                  return "—";
                }
              })()
            : "—";

          const nominal =
            typeof v?.raw_amount === "number" ? v.raw_amount : undefined;

          if (typeof nominal === "number") {
            lines.push(`Cheque ${dTxt} — Nominal: ${fmtMoney(nominal)}`);
          } else {
            lines.push(`Cheque ${dTxt}`);
          }

          const daysCharged = v?.cheque?.days_charged;
          const interestPct =
            typeof v?.cheque?.interest_pct === "number"
              ? (v.cheque.interest_pct * 100).toFixed(2) + "%"
              : undefined;
          const interestAmount = v?.cheque?.interest_amount;

          if (typeof daysCharged === "number" || interestPct) {
            lines.push(
              `Costo Financiero: ${daysCharged ?? "—"} días${
                interestPct ? ` - ${interestPct}` : ""
              }`,
            );
          }
          if (typeof interestAmount === "number") {
            lines.push(`Costo Financiero: ${fmtMoney(interestAmount)}`);
          }
          lines.push(`--------------------------------`);
        } else {
          const label =
            method === "efectivo"
              ? "Efectivo"
              : method === "transferencia"
                ? "Transferencia"
                : v?.method || "Valor";
          if (typeof v?.amount === "number") {
            lines.push(`${label}: ${fmtMoney(v.amount)}`);
            lines.push(`--------------------------------`);
          } else {
            lines.push(`${label}`);
          }
        }
      });
    }

    if (
      typeof valuesNominal === "number" ||
      typeof discountAmt === "number" ||
      typeof chequeInterest === "number" ||
      typeof gross === "number" ||
      typeof saldoDiff === "number"
    ) {
      lines.push(`--------------------------------`);
      if (typeof valuesNominal === "number") {
        lines.push(`Total Pagado (Nominal): ${fmtMoney(valuesNominal)}`);
      }

      // 👇 NUEVO: si vino `discount_applied_to_values` y difiere del ajuste original, lo mostramos explícito
      if (showDiscountToValuesRow) {
        lines.push(
          `Desc/Cost F aplicado a valores: ${fmtMoney(appliedDiscount)}`,
        );
      } else if (typeof appliedDiscount === "number") {
        // Si no difiere, mantenemos la fila corta como antes
        lines.push(`Desc/Cost F: ${fmtMoney(appliedDiscount)}`);
      }

      if (typeof chequeInterest === "number") {
        lines.push(`Cost F. Cheques: ${fmtMoney(chequeInterest)}`);
      }

      if (
        typeof appliedDiscount === "number" ||
        typeof chequeInterest === "number"
      ) {
        const shown =
          totalDescCostF >= 0
            ? fmtMoney(totalDescCostF)
            : `-${fmtMoney(Math.abs(totalDescCostF))}`;
        lines.push(`Total Desc/Cost F: ${shown}`);
      }

      if (typeof gross === "number")
        lines.push(`Neto a aplicar Factura: ${fmtMoney(netToApply)}`);
      if (typeof saldoDiff === "number")
        lines.push(`SALDO ${fmtMoney(saldoDiff)}`);
    }
    return lines;
  })();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyLines.join("\n"));
    } catch {}
  };
  function formatISODateOnlyUTC(iso: string | Date, pattern = "dd/MM/yy") {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    const localMidnight = new Date(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
    );
    return format(localMidnight, pattern);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl
          bg-white rounded-none sm:rounded-xl shadow-xl
          overflow-hidden flex flex-col
        "
      >
        {/* Header (sticky) */}
        <div
          className="
            sticky top-0 z-10
            flex items-center justify-between px-4 py-3
            border-b border-zinc-200 bg-white
          "
        >
          <div className="flex flex-col min-w-0">
            <h4 className="text-base sm:text-lg font-semibold truncate">
              {t("paymentDetail") || "Detalle de pago"}
            </h4>
            <span className="text-xs text-zinc-500 truncate">
              {t("number")}: {payment.documents?.[0]?.number ?? "—"} ·{" "}
              {t("date")}:{" "}
              {payment.date
                ? format(new Date(payment.date), "dd/MM/yyyy HH:mm")
                : "N/A"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-zinc-100"
            title={t("close") || "Cerrar"}
          >
            <FaTimes />
          </button>
        </div>

        {/* Body (scrollable) */}

        {/* Meta */}
        <div
          className="
    flex-1 overflow-y-auto
    p-3 sm:p-4 space-y-4
    max-h-[calc(90vh-112px)]
    pb-4 sm:pb-6
    scroll-pb-24 sm:scroll-pb-28
  "
        >
          <section className="space-y-2">
            <Info
              label={t("customer") || "Cliente"}
              value={<CustomerIdAndName id={payment.customer?.id} />}
            />
          </section>
          <section className="rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-3 py-2 text-sm font-semibold border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <Info
                label={t("status")}
                value={<StatusPill status={payment.status} />}
              />
              <Info
                label={t("type") || "Tipo"}
                value={<TypePill type={payment.type} />}
              />
              <Info
                label={t("charged") || "Cobrado"}
                value={payment.isCharged ? t("yes") || "Sí" : t("no") || "No"}
              />
              <Info
                label="Rendido"
                value={
                  <span
                    className={rendido ? "text-emerald-600" : "text-rose-600"}
                  >
                    {rendido ? t("yes") || "Sí" : t("no") || "No"}
                  </span>
                }
              />
            </div>
          </section>

          {!rendido && (
            <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
              Este pago aún no está rendido. Debés rendirlo antes de poder
              marcarlo como imputado.
            </div>
          )}

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card title="Valores">
              <div className="max-h overflow-auto pr-1">
                {Array.isArray(payment?.values) && payment.values.length > 0 ? (
                  <ul className="space-y-2">
                    {payment.values.map((v: any, idx: number) => {
                      const method = String(v?.method || "").toLowerCase();

                      // helper para formatear comprobante
                      const renderReceipt = () => {
                        if (!v?.receipt_url) return null;
                        return (
                          <div className="mt-2">
                            <a
                              href={v.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium underline decoration-dotted hover:decoration-solid text-blue-600"
                            >
                              Ver comprobante
                              {v?.receipt_original_name
                                ? ` · ${v.receipt_original_name}`
                                : ""}
                            </a>
                          </div>
                        );
                      };

                      // ---- CHEQUE ----
                      if (method === "cheque") {
                        const whenRaw = v?.cheque?.collection_date;
                        const dTxt = whenRaw
                          ? formatISODateOnlyUTC(whenRaw, "dd/MM/yy")
                          : "—";
                        const nominal =
                          typeof v?.raw_amount === "number"
                            ? v.raw_amount
                            : undefined;
                        const daysCharged = v?.cheque?.days_charged;
                        const interestPct =
                          typeof v?.cheque?.interest_pct === "number"
                            ? (v.cheque.interest_pct * 100).toFixed(2) + "%"
                            : undefined;
                        const interestAmount = v?.cheque?.interest_amount;

                        return (
                          <li
                            key={idx}
                            className="rounded-lg border border-zinc-200 p-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">
                                Cheque{" "}
                                <span className="text-zinc-500">{dTxt}</span>
                              </div>
                              <Pill text="Cheque" tone="amber" />
                            </div>

                            <div className="mt-1 text-xs text-zinc-600">
                              {typeof nominal === "number" && (
                                <div className="flex items-center justify-between">
                                  <span>Nominal</span>
                                  <span className="font-medium">
                                    {fmtMoney(nominal)}
                                  </span>
                                </div>
                              )}

                              {hasCheques && (
                                <>
                                  {(typeof daysCharged === "number" ||
                                    interestPct) && (
                                    <div className="flex items-center justify-between">
                                      <span>Costo Financiero (días / %)</span>
                                      <span className="font-medium">
                                        {(daysCharged ?? "—") +
                                          (interestPct
                                            ? ` · ${interestPct}`
                                            : "")}
                                      </span>
                                    </div>
                                  )}

                                  {typeof interestAmount === "number" && (
                                    <div className="flex items-center justify-between">
                                      <span>Costo Financiero (monto)</span>
                                      <span className="font-medium">
                                        {fmtMoney(interestAmount)}
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {/* 👇 Nuevo: Link al comprobante */}
                            {renderReceipt()}
                          </li>
                        );
                      }

                      // ---- EFECTIVO / TRANSFERENCIA / OTROS ----
                      const label =
                        method === "efectivo"
                          ? "Efectivo"
                          : method === "transferencia"
                            ? "Transferencia"
                            : v?.method || "Valor";

                      return (
                        <li
                          key={idx}
                          className="rounded-lg border border-zinc-200 p-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">{label}</div>
                            <Pill
                              text={label}
                              tone={method === "efectivo" ? "green" : "blue"}
                            />
                          </div>

                          {typeof v?.amount === "number" && (
                            <div className="mt-1 text-xs text-zinc-600 flex items-center justify-between">
                              <span>Monto</span>
                              <span className="font-medium">
                                {fmtMoney(v.amount)}
                              </span>
                            </div>
                          )}

                          {/* 👇 Nuevo: Link al comprobante */}
                          {renderReceipt()}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-xs text-zinc-500">
                    {t("noData") || "Sin valores"}
                  </div>
                )}
              </div>
            </Card>

            <Card title="Documentos y Totales">
              <div className="space-y-2">
                <div className="space-y-2">
                  <AmountRow label="Documentos:" value={gross} fmt={fmtMoney} />
                  {typeof daysUsed === "number" && discountRateTxt && (
                    <Row>
                      <span className="text-xs text-zinc-500">
                        Desc/Costo Financiero
                      </span>
                      <span className="text-xs font-medium text-zinc-700">
                        {daysUsed} días · {discountRateTxt}
                      </span>
                    </Row>
                  )}
                  <AmountRow
                    label="Desc/Costo F (monto)"
                    value={
                      typeof discountAmtOriginal === "number"
                        ? Math.abs(discountAmtOriginal)
                        : undefined
                    }
                    fmt={fmtMoney}
                  />
                  <Divider />
                  <AmountRow
                    label="TOTAL a pagar (efect/transf)"
                    value={net}
                    fmt={fmtMoney}
                    strong
                  />
                </div>

                <Divider />

                {typeof valuesNominal === "number" && (
                  <AmountRow
                    label="Total Pagado (Nominal)"
                    value={valuesNominal}
                    fmt={fmtMoney}
                  />
                )}
                {typeof discountAmt === "number" && (
                  <AmountRow
                    label="Desc/Cost F"
                    value={discountAmt}
                    fmt={fmtMoney}
                  />
                )}
                {hasCheques && typeof chequeInterest === "number" && (
                  <AmountRow
                    label="Cost F. Cheques"
                    value={chequeInterest}
                    fmt={fmtMoney}
                  />
                )}

                {(typeof discountAmt === "number" ||
                  (hasCheques && typeof chequeInterest === "number")) && (
                  <AmountRow
                    label="Total Desc/Cost F"
                    value={
                      (typeof discountAmt === "number" ? discountAmt : 0) +
                      (hasCheques && typeof chequeInterest === "number"
                        ? chequeInterest
                        : 0)
                    }
                    fmt={fmtMoney}
                    strong
                  />
                )}

                {typeof gross === "number" && (
                  <AmountRow
                    label="Neto a aplicar Factura"
                    value={netToApply}
                    fmt={fmtMoney}
                    muted
                  />
                )}
                {typeof saldoDiff === "number" && (
                  <AmountRow
                    label="SALDO"
                    value={saldoDiff}
                    fmt={fmtMoney}
                    strong
                  />
                )}
              </div>
            </Card>
          </section>

          {/* Texto copiable (compacto, con botón) */}
          <section className="rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-3 py-2 text-sm font-semibold border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <span>{t("copiableSummary") || "Texto copiable"}</span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded border border-zinc-300 hover:bg-zinc-100"
              >
                <FaCopy />
                {t("copy") || "Copiar"}
              </button>
            </div>
            <pre className="font-mono text-[11px] sm:text-xs leading-5 whitespace-pre-wrap bg-white rounded-lg p-3">
              {copyLines.join("\n")}
            </pre>
          </section>

          {/* Comentarios */}
          {payment.comments ? (
            <div className="rounded-xl border border-zinc-200 p-3 text-sm">
              <div className="font-semibold mb-1">{t("notes") || "Notas"}</div>
              <div className="text-zinc-700 whitespace-pre-wrap break-words">
                {payment.comments}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer (sticky) */}
        <div
          className="
            sticky bottom-0 z-10
            flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2
            px-4 py-3 border-t border-zinc-200 bg-white
          "
        >
          <div className="text-[10px] sm:text-xs text-zinc-500">
            ID: {payment._id}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              className="w-full sm:w-auto px-3 py-2 rounded border border-zinc-300 hover:bg-zinc-100"
              onClick={onClose}
            >
              {t("close") || "Cerrar"}
            </button>

            <button
              className={`w-full sm:w-auto px-3 py-2 rounded text-white ${
                isMarking
                  ? "bg-amber-500 cursor-wait"
                  : rendido
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-zinc-400 cursor-not-allowed"
              }`}
              onClick={onMark}
              disabled={isMarking || !rendido}
              title={!rendido ? "Rendí el pago para poder marcarlo" : undefined}
            >
              {isMarking ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin" />
                  {t("processing") || "Procesando..."}
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-2">
                  <FaCheck /> {t("markAsCharged") || "Marcar cobrado"}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 overflow-hidden bg-white">
      <div className="px-3 py-2 text-sm font-semibold border-b border-zinc-200 bg-zinc-50">
        {title}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between">{children}</div>;
}

function Divider() {
  return <div className="h-px bg-zinc-200 my-2" />;
}

function AmountRow({
  label,
  value,
  fmt,
  strong,
  muted,
}: {
  label: string;
  value: number | undefined;
  fmt: (n: number) => string;
  strong?: boolean;
  muted?: boolean;
}) {
  const base =
    "text-sm " +
    (strong
      ? "font-semibold text-zinc-900"
      : muted
        ? "text-zinc-500"
        : "text-zinc-800");

  return (
    <Row>
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`${base}`}>
        {typeof value === "number" ? fmt(value) : "—"}
      </span>
    </Row>
  );
}

function Pill({
  text,
  tone = "zinc",
}: {
  text: React.ReactNode;
  tone?: "zinc" | "green" | "blue" | "amber";
}) {
  const map: Record<string, string> = {
    zinc: "bg-zinc-100 text-zinc-700",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${map[tone]}`}
    >
      {text}
    </span>
  );
}


function Info({
  label,
  value,
  variant = "chip",
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  variant?: "hero" | "chip";
}) {
  const isString =
    typeof value === "string" || typeof value === "number" || value == null;
  const titleText = isString && value != null ? String(value) : undefined;

  const base =
    "border bg-white shadow-sm rounded-2xl " +
    (variant === "hero"
      ? "px-4 py-3"
      : "px-3 py-2 sm:px-4 sm:py-3 border-zinc-200/70");

  return (
    <div className={base}>
      <div className="text-[10px] sm:text-[11px] uppercase tracking-wide text-zinc-500/80">
        {label}
      </div>
      <div
        className={
          variant === "hero"
            ? "mt-1 text-[15px] sm:text-base font-semibold text-zinc-900 truncate"
            : "mt-1 text-sm sm:text-[15px] font-medium text-zinc-900 truncate"
        }
        title={titleText}
      >
        {isString ? (value ?? "—") : value}
      </div>
    </div>
  );
}

function CustomerIdAndName({ id }: { id?: string }) {
  const { data, isFetching, isError } = useGetCustomerByIdQuery(
    { id: id ?? "" },
    { skip: !id },
  );

  if (!id) return <>—</>;
  if (isFetching) return <span className="text-zinc-400">…</span>;
  if (isError) return <>{id} — —</>;

  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-xs">{id}</span>
      <span>—</span>
      <span className="font-mono text-xs">{data?.name ?? "—"}</span>
    </span>
  );
}

function StatusPill({ status }: { status?: string }) {
  const { t } = useTranslation();

  const s = (status ?? "").toLowerCase();

  const fallback =
    s === "pending"
      ? "Pending"
      : s === "confirmed"
        ? "Confirmed"
        : s === "reversed"
          ? "Reversed"
          : s || "-";

  // Clave i18n: paymentStatus.pending / .confirmed / .reversed
  const label = t(`paymentStatus.${s}`, fallback);

  const cls =
    s === "pending"
      ? "bg-amber-100 text-amber-800"
      : s === "confirmed"
        ? "bg-emerald-100 text-emerald-800"
        : s === "reversed"
          ? "bg-rose-100 text-rose-800"
          : "bg-zinc-100 text-zinc-800";

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function TypePill({ type }: { type?: string }) {
  const { t } = useTranslation();
  const raw = (type ?? "").toLowerCase();
  const k = raw === "contra_entrega" ? "pago_anticipado" : raw;

  const fallback =
    k === "pago_anticipado"
      ? "Pago anticipado"
      : k === "cta_cte"
        ? "Cuenta corriente"
        : k || "-";

  const label = t(`paymentType.${k}`, fallback);

  const cls =
    k === "pago_anticipado"
      ? "bg-blue-100 text-blue-800"
      : k === "cta_cte"
        ? "bg-violet-100 text-violet-800"
        : "bg-zinc-100 text-zinc-800";

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}