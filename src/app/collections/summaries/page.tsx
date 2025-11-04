"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { FaEye, FaSpinner, FaTimes, FaCheck, FaCopy } from "react-icons/fa";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useClient } from "@/app/context/ClientContext";

// 👉 RTK Query (payments)
import {
  useLazyGetPaymentsQuery,
  useMarkAsChargedMutation,
  useUpdatePaymentMutation,
  type Payment,
} from "@/redux/services/paymentsApi";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetUserByIdQuery } from "@/redux/services/usersApi";

const ITEMS_PER_PAGE = 15;
function isPaymentRendido(p?: Payment): boolean {
  if (!p) return false;
  return p.rendido === true;
}
const PaymentsPendingPage = () => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();

  // Estado de lista
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Payment[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sortQuery, setSortQuery] = useState<string>(""); // "campo:asc|desc"
  const [customer_id, setCustomer_id] = useState<string>("");
  const [sellerFilter, setSellerFilter] = useState<string>(""); // vendedor
  const [methodFilter, setMethodFilter] = useState<
    "" | "efectivo" | "transferencia" | "cheque"
  >("");

  const { data: sellersData, isLoading: isSellersLoading } =
    useGetSellersQuery(null);

  // Filtros
  const [searchParams, setSearchParams] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });

  // Modal detalle
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Payment | null>(null);

  // Modal confirmación marcar cobrado
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPayment, setConfirmPayment] = useState<Payment | null>(null);
  const [confirmComment, setConfirmComment] = useState("");

  // RTK hooks
  const [fetchPayments, { data, isFetching }] = useLazyGetPaymentsQuery();
  const [markAsCharged, { isLoading: isMarking }] = useMarkAsChargedMutation();
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Observer para scroll infinito
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Mantener sync con cliente elegido
  useEffect(() => {
    if (selectedClientId !== customer_id) {
      setCustomer_id(selectedClientId || "");
      setPage(1);
      setItems([]);
      setHasMore(true);
    }
  }, [selectedClientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [updatePayment] = useUpdatePaymentMutation();

  // Carga con paginación y orden
  useEffect(() => {
    const loadItems = async () => {
      if (isLoading) return;
      setIsLoading(true);
      try {
        const startDate = searchParams.startDate
          ? format(searchParams.startDate, "yyyy-MM-dd")
          : undefined;
        const endDate = searchParams.endDate
          ? format(searchParams.endDate, "yyyy-MM-dd")
          : undefined;

        const baseArgs: any = {
          page,
          limit: ITEMS_PER_PAGE,
          startDate,
          endDate,
          sort: sortQuery,
          isCharged: "false",
          includeLookup: false,
        };

        if (selectedClientId) {
          const cid = selectedClientId || customer_id;
          if (cid) baseArgs.customer_id = String(cid);
        }
        if (sellerFilter) baseArgs.seller_id = sellerFilter; // 👈 ya lo tenías
        const result = await fetchPayments(baseArgs).unwrap();

        const newItems = result?.payments ?? [];
        setItems((prev) => (page === 1 ? newItems : [...prev, ...newItems]));
        setHasMore(newItems.length === ITEMS_PER_PAGE);
      } catch (err) {
        console.error("Error loading payments:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
    // ⬇️ agregá sellerFilter
  }, [
    page,
    sortQuery,
    customer_id,
    searchParams.startDate,
    searchParams.endDate,
    sellerFilter, // ✅ NUEVO
  ]);

  // IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isFetching) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [hasMore, isLoading, isFetching]);

  // Ordenamiento
  const handleSort = useCallback(
    (field: string) => {
      setPage(1);
      setItems([]);
      setHasMore(true);

      const [currentField, currentDirection] = sortQuery
        ? sortQuery.split(":")
        : ["", ""];
      setSortQuery(
        currentField === field
          ? `${field}:${currentDirection === "asc" ? "desc" : "asc"}`
          : `${field}:asc`
      );
    },
    [sortQuery]
  );

  // Abrir detalle
  const openDetails = (payment: Payment) => {
    setSelected(payment);
    setIsDetailOpen(true);
  };
  const closeDetails = () => {
    setIsDetailOpen(false);
    setSelected(null);
  };

  // Abrir modal de confirmación
  const openConfirm = (payment: Payment) => {
    // 🚫 Si no está rendido, no permitimos confirmar cobro/imputación
    if (!isPaymentRendido(payment)) {
      // Podés reemplazar por tu sistema de toasts
      window.alert("Este pago todavía no está rendido. Rendilo primero.");
      return;
    }

    setConfirmPayment(payment);
    setConfirmComment("");
    setConfirmOpen(true);
  };
  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmPayment(null);
    setConfirmComment("");
  };

  const confirmMarkCharged = async () => {
    if (!confirmPayment) return;

    // 🚫 Doble chequeo
    if (!isPaymentRendido(confirmPayment)) {
      window.alert("No se puede marcar como imputado si no está rendido.");
      return;
    }

    try {
      setMarkingId(confirmPayment._id);

      await markAsCharged({
        id: confirmPayment._id,
        value: true,
        comments: confirmComment?.trim() || undefined,
      }).unwrap();

      try {
        await updatePayment({
          id: confirmPayment._id,
          data: { isImputed: true, status: "confirmed" },
        }).unwrap();
      } catch (err) {
        console.warn("Cobrado OK, pero no se pudo setear isImputed=true:", err);
      }

      setItems((prev) => prev.filter((p) => p._id !== confirmPayment._id));
      if (selected?._id === confirmPayment._id) closeDetails();
      closeConfirm();
    } catch (e) {
      console.error("No se pudo marcar como cobrado:", e);
    } finally {
      setMarkingId(null);
    }
  };

  /* ===================== Helpers para columnas pedidas ===================== */

  // Traducción de método de pago
  const humanMethod = (m?: string) => {
    if (!m) return "";
    if (m === "efectivo") return t("cash") || "Efectivo";
    if (m === "transferencia") return t("transfer") || "Transferencia";
    if (m === "cheque") return t("cheque") || "Cheque";
    return m; // fallback si llega algo distinto
  };

  // "Forma de pago": concatenar métodos de values
  const methodsFromValues = (vals?: Payment["values"]) =>
    (vals ?? [])
      .map((v) => humanMethod((v as any)?.method))
      .filter(Boolean)
      .join(", ") || "—";

  // "Banco": concatenar bancos presentes en values
  const banksFromValues = (vals?: Payment["values"]) =>
    (vals ?? [])
      .map((v) => (v as any)?.bank)
      .filter(Boolean)
      .join(", ") || "—";

  /* ===================== Tabla: SOLO las 8 columnas solicitadas ===================== */

  const filteredItems = useMemo(() => {
    if (!methodFilter) return items;
    return items.filter((p) =>
      (p.values ?? []).some((v: any) => v?.method === methodFilter)
    );
  }, [items, methodFilter]);

  const currencyFmt = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const tableData =
    filteredItems?.map((p) => {
      return {
        key: p._id,

        // 1) 👁️ Ver detalle
        info: (
          <div className="grid place-items-center">
            {" "}
            {/* centra horizontal y vertical dentro de la celda */}
            <button
              type="button"
              className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-zinc-200 "
              title={t("view") as string}
              onClick={() => openDetails(p)}
              aria-label={t("view") as string}
            >
              <FaEye className="text-base leading-none" />
            </button>
          </div>
        ),

        // 2) CLIENTE (customer.id)
        customer: <CustomerIdAndName id={p.customer?.id} />,

        // 3) DOCUMENT (map de documents.number)
        documents: (p.documents ?? []).map((d) => d.number).join(", ") || "—",

        // 4) FORMA DE PAGO (desde values[].method)
        paymentMethod: methodsFromValues(p.values),

        // 5) BANCO (desde values[].bank)
        bank: banksFromValues(p.values),
        // 6) FECHA
        date: p.date ? format(new Date(p.date), "dd/MM/yyyy HH:mm") : "—",

        // 7) DESCUENTO (totals.discount)
        discount: currencyFmt.format(p.totals?.discount ?? 0),

        // 8) TOTAL (total)
        total: currencyFmt.format(p.totals.values ?? 0),
      };
    }) ?? [];

  const tableHeader = [
    // 1) 👁️
    { component: <FaEye className="text-center text-xl" />, key: "info" },
    // 2) CLIENTE
    { name: t("customer"), key: "customer", important: true },
    // 3) DOCUMENT
    { name: t("documents"), key: "documents" },
    // 4) FORMA DE PAGO
    { name: t("paymentMethod"), key: "paymentMethod" },
    // 5) BANCO
    { name: t("bank"), key: "bank" },
    // 6) FECHA
    { name: t("date"), key: "date" },
    // 7) DESCUENTO
    { name: t("discount"), key: "discount" },
    // 8) TOTAL
    { name: t("total"), key: "total", important: true },
  ];

  /* ===================== Header (filtros/contador) ===================== */
  const sellerOptions = React.useMemo(() => {
    const raw = (sellersData ?? sellersData ?? []) as any[];
    return raw
      .map((s) => {
        const id = String(s?.id ?? s?._id ?? s?.seller_id ?? "");
        const name =
          s?.name ??
          s?.fullName ??
          ([s?.first_name, s?.last_name].filter(Boolean).join(" ") ||
            s?.username ||
            s?.email ||
            id);
        return id ? { id, name } : null;
      })
      .filter(Boolean) as Array<{ id: string; name: string }>;
  }, [sellersData]);

  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <DatePicker
            selected={searchParams.startDate}
            onChange={(date) => {
              setPage(1);
              setItems([]);
              setHasMore(true);
              setSearchParams((s) => ({ ...s, startDate: date }));
            }}
            placeholderText={t("dateFrom")}
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
      {
        content: (
          <DatePicker
            selected={searchParams.endDate}
            onChange={(date) => {
              setPage(1);
              setItems([]);
              setHasMore(true);
              setSearchParams((s) => ({ ...s, endDate: date }));
            }}
            placeholderText={t("dateTo")}
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
      // ⬇️ NUEVO: Filtro por vendedor (server-side)
      {
        content: (
          <select
            value={sellerFilter}
            onChange={(e) => {
              setSellerFilter(e.target.value);
              // reset de paginación/lista para aplicar el filtro
              setPage(1);
              setItems([]);
              setHasMore(true);
            }}
            disabled={isSellersLoading}
            className="border border-gray-300 rounded p-2 text-sm min-w-[220px]"
            title={t("seller") || "Vendedor"}
          >
            <option value="">{"Todos los vendedores"}</option>
            {sellerOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        ),
      },

      // ⬇️ NUEVO: Filtro por forma de pago (client-side)
      {
        content: (
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as any)}
            className="border border-gray-300 rounded p-2 text-sm"
            title={t("paymentMethod") || "Forma de pago"}
          >
            <option value="">{"Todos los metodos de pago"}</option>
            <option value="efectivo">{t("cash") || "Efectivo"}</option>
            <option value="transferencia">
              {t("transfer") || "Transferencia"}
            </option>
            <option value="cheque">{t("cheque") || "Cheque"}</option>
          </select>
        ),
      },
    ],
    results: `${data?.total ?? 0} ${t("page.header.results")}`,
  };

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
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("pendingPayments")}</h3>
        <Header headerBody={headerBody} />
        <Table
          headers={tableHeader}
          data={tableData}
          onSort={handleSort}
          sortField={sortQuery.split(":")[0] || ""}
          sortOrder={(sortQuery.split(":")[1] as "asc" | "desc" | "") || ""}
        />
      </div>

      {/* Modal de Detalles */}
      {isDetailOpen && selected && (
        <DetailsModal
          payment={selected}
          onClose={closeDetails}
          onMark={() => openConfirm(selected)}
          isMarking={isMarking || markingId === selected._id}
          t={t}
        />
      )}

      {/* Modal de Confirmación de Cobro */}
      {confirmOpen && confirmPayment && (
        <ConfirmMarkModal
          open
          payment={confirmPayment}
          comment={confirmComment}
          onChangeComment={setConfirmComment}
          onCancel={closeConfirm}
          onConfirm={confirmMarkCharged}
          isLoading={isMarking && markingId === confirmPayment._id}
          t={t}
        />
      )}

      <div ref={observerRef} className="h-10" />
    </PrivateRoute>
  );
};

export default PaymentsPendingPage;

/* ===================== Modal de Confirmación (con comentario) ===================== */

function ConfirmMarkModal({
  open,
  payment,
  comment,
  onChangeComment,
  onCancel,
  onConfirm,
  isLoading,
  t,
}: {
  open: boolean;
  payment: Payment;
  comment: string;
  onChangeComment: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  t: (k: string) => string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <h4 className="text-lg font-semibold">
            {t("confirmMarkAsChargedTitle") || "Confirmar cobro"}
          </h4>
          <button
            onClick={onCancel}
            className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title={t("close") || "Cerrar"}
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {t("confirmMarkAsChargedBody") ||
              "¿Querés marcar este pago como imputado? Podés agregar un comentario."}
          </p>

          <div className="rounded border border-zinc-200 dark:border-zinc-800 p-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                  {t("customer")}
                </span>
                <div className="font-medium">{payment.customer?.id ?? "—"}</div>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                  {t("documents")}
                </span>
                <div className="font-medium">
                  {(payment.documents ?? []).map((d) => d.number).join(", ") ||
                    "—"}
                </div>
              </div>
            </div>
          </div>

          <label className="block text-sm">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">
              {t("addComment") || "Agregar comentario"}{" "}
              <span className="lowercase text-zinc-400">
                ({t("optional") || "opcional"})
              </span>
            </span>
            <textarea
              value={comment}
              onChange={(e) => onChangeComment(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded border border-zinc-300 dark:border-zinc-700 p-2 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder={
                t("commentPlaceholder") || "Escribí un comentario..."
              }
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={onCancel}
          >
            {t("cancel") || "Cancelar"}
          </button>
          <button
            className={`px-3 py-2 rounded text-white ${
              isLoading
                ? "bg-amber-500 cursor-wait"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <FaSpinner className="animate-spin" />{" "}
                {t("processing") || "Procesando..."}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <FaCheck /> {t("confirm") || "Confirmar"}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== Modal de Detalles ===================== */

type DetailsModalProps = {
  payment: Payment;
  onClose: () => void;
  onMark: () => void;
  isMarking: boolean;
  t: (k: string) => string;
};
function DetailsModal({
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
    currencyFmt.format(Number(typeof n === "number" ? n : n ?? 0));

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
    { skip: !payment?.customer?.id }
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

  const totalDescCostF =
    (typeof discountAmt === "number" ? discountAmt : 0) +
    (typeof chequeInterest === "number" ? chequeInterest : 0);

  const netToApply =
    typeof valuesNominal === "number" && typeof discountAmtOriginal === "number"
      ? valuesNominal - totalDescCostF
      : undefined;

  const hasCheques =
    Array.isArray(payment?.values) &&
    payment.values.some(
      (v: any) => String(v?.method).toLowerCase() === "cheque"
    );

  // Genero texto copiable idéntico al “resumen simple” que venías usando
  const copyLines = (() => {
    const lines: string[] = [];
    lines.push(`Fecha: ${fecha.replace(" ", " ")}`);
    lines.push(`ID Pago: ${idPago}`);
    lines.push(`Cliente: ${clienteLabel}`);
    lines.push(`Vendedor: ${sellerLabel}`);
    lines.push(`Usuario: ${username}`);
    lines.push(``);

    if (typeof gross === "number") lines.push(`Documentos: ${fmtMoney(gross)}`);
    if (typeof daysUsed === "number" && discountRateTxt) {
      lines.push(
        `Desc/Costo Financiero: ${daysUsed} días - ${discountRateTxt}`
      );
    }
    if (typeof discountAmt === "number") {
      lines.push(
        `Desc/Costo Financiero: ${fmtMoney(Math.abs(discountAmtOriginal))}`
      );
    }
    if (typeof net === "number") {
      lines.push(`-----------------------------------`);
      lines.push(`TOTAL A PAGAR (efect/transf): ${fmtMoney(net)}`);
      lines.push(``);
    }

    if (Array.isArray(payment?.values) && payment.values.length > 0) {
      lines.push(`COMPOSICION DEL PAGO:`);
      payment.values.forEach((v: any) => {
        const method = String(v?.method || "").toLowerCase();
        if (method === "cheque") {
          const whenRaw = v?.cheque?.collection_date;
          const dTxt = whenRaw
            ? formatISODateOnlyUTC(whenRaw, "dd/MM/yy")
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
              }`
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
      if (typeof discountAmt === "number") {
        lines.push(`Desc/Cost F: ${fmtMoney(discountAmt)}`);
      }
      if (typeof chequeInterest === "number") {
        lines.push(`Cost F. Cheques: ${fmtMoney(chequeInterest)}`);
      }
      if (
        typeof discountAmt === "number" ||
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
      d.getUTCDate()
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
        {isString ? value ?? "—" : value}
      </div>
    </div>
  );
}

function CustomerIdAndName({ id }: { id?: string }) {
  const { data, isFetching, isError } = useGetCustomerByIdQuery(
    { id: id ?? "" },
    { skip: !id }
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

function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom";
}) {
  const pos = side === "top" ? "bottom-full mb-1" : "top-full mt-1";

  return (
    <span className="relative inline-flex group">
      <span
        className="inline-flex min-w-0"
        tabIndex={0}
        title={typeof content === "string" ? content : undefined}
      >
        {children}
      </span>
      <span
        role="tooltip"
        className={`
          pointer-events-none absolute ${pos} left-1/2 -translate-x-1/2
          z-50 hidden group-hover:block group-focus-within:block
          max-w-[80vw] sm:max-w-xs
          whitespace-normal break-words
          rounded-md px-2 py-1 text-xs
          bg-black/85 text-white shadow-lg
        `}
      >
        {content}
      </span>
    </span>
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
