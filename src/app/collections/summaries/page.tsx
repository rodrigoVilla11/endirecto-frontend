"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaEye, FaSpinner, FaTimes, FaCheck } from "react-icons/fa";
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

const ITEMS_PER_PAGE = 15;

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

  const [updatePayment, { isLoading: isImputedSaving }] =
    useUpdatePaymentMutation(); // 👈 NUEVO
  const [imputedIdSaving, setImputedIdSaving] = useState<string | null>(null);

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

        const result = await fetchPayments({
          page,
          limit: ITEMS_PER_PAGE,
          startDate,
          endDate,
          sort: sortQuery,
          customer_id: customer_id || undefined,
          // 👇 clave para traer solo no cobrados
          isCharged: "false",
          includeLookup: false,
        }).unwrap();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    sortQuery,
    customer_id,
    searchParams.startDate,
    searchParams.endDate,
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

      // Actualización local de la lista
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

  const tableData =
    items?.map((p) => {
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
        discount: p.totals?.discount ?? 0,

        // 8) TOTAL (total)
        total: p.total ?? 0,
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
              "¿Querés marcar este pago como cobrado? Podés agregar un comentario."}
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
  const currencyFmt = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: payment.currency || "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
          overflow-hidden
          flex flex-col
        "
      >
        {/* Header (sticky) */}
        <div className="
          sticky top-0 z-10
          flex items-center justify-between px-4 py-3
          border-b border-zinc-200 dark:border-zinc-800
          bg-white
        ">
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
            className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title={t("close") || "Cerrar"}
          >
            <FaTimes />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* Meta */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
            <Info
              label={t("customer") || "Cliente"}
              value={<CustomerIdAndName id={payment.customer?.id} />}
            />
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
          </div>

          {/* Totales */}
          <div className="rounded border border-zinc-200 dark:border-zinc-800">
            <div className="px-3 py-2 text-sm font-semibold border-b border-zinc-200 dark:border-zinc-800">
              {t("totals") || "Totales"}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 text-sm">
              <Info label="Bruto" value={currencyFmt.format(payment.totals?.gross ?? 0)} />
              <Info label="Desc." value={`-${currencyFmt.format(payment.totals?.discount ?? 0)}`} />
              <Info label="Neto" value={currencyFmt.format(payment.totals?.net ?? payment.total)} />
              <Info label="Valores" value={currencyFmt.format(payment.totals?.values ?? 0)} />
              <Info
                label="Dif."
                valueClassName={
                  (payment.totals?.diff ?? 0) === 0
                    ? "text-emerald-600"
                    : (payment.totals?.diff ?? 0) > 0
                    ? "text-amber-600"
                    : "text-red-600"
                }
                value={currencyFmt.format(payment.totals?.diff ?? 0)}
              />
            </div>
          </div>

          {/* Documentos */}
          <div className="rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-3 py-2 text-sm font-semibold border-b border-zinc-200 dark:border-zinc-800">
              {t("documents") || "Documentos"}
            </div>

            {/* Header solo desktop */}
            <div className="hidden sm:grid grid-cols-6 px-3 py-2 text-xs text-zinc-500">
              <span>{t("number")}</span>
              <span>{t("days") || "Días"}</span>
              <span>{t("base") || "Base"}</span>
              <span>%</span>
              <span>{t("discount") || "Desc."}</span>
              <span>{t("final") || "Final"}</span>
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {(payment.documents || []).map((d) => (
                <div
                  key={d.document_id}
                  className="grid grid-cols-1 sm:grid-cols-6 gap-x-3 gap-y-1 px-3 py-2 text-sm"
                >
                  {/* Número */}
                  <div className="flex sm:block justify-between">
                    <span className="text-xs text-zinc-500 sm:hidden">{t("number")}:</span>
                    <span className="truncate">{d.number}</span>
                  </div>
                  {/* Días */}
                  <div className="flex sm:block justify-between">
                    <span className="text-xs text-zinc-500 sm:hidden">{t("days") || "Días"}:</span>
                    <span className={d.note ? "text-amber-600" : ""}>
                      {d.days_used ?? "—"}
                    </span>
                  </div>
                  {/* Base */}
                  <div className="flex sm:block justify-between">
                    <span className="text-xs text-zinc-500 sm:hidden">{t("base") || "Base"}:</span>
                    <span>{currencyFmt.format(d.base)}</span>
                  </div>
                  {/* % */}
                  <div className="flex sm:block justify-between">
                    <span className="text-xs text-zinc-500 sm:hidden">%</span>
                    <span>{(d.discount_rate * 100).toFixed(0)}%</span>
                  </div>
                  {/* Desc */}
                  <div className="flex sm:block justify-between">
                    <span className="text-xs text-zinc-500 sm:hidden">{t("discount") || "Desc."}:</span>
                    <span>-{currencyFmt.format(d.discount_amount)}</span>
                  </div>
                  {/* Final */}
                  <div className="flex sm:block justify-between">
                    <span className="text-xs text-zinc-500 sm:hidden">{t("final") || "Final"}:</span>
                    <span className={d.note ? "text-amber-600" : ""}>
                      {currencyFmt.format(d.final_amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Valores */}
          <div className="rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-3 py-2 text-sm font-semibold border-b border-zinc-200 dark:border-zinc-800">
              {t("values") || "Valores"}
            </div>

            {/* Header solo desktop */}
            <div className="hidden sm:grid grid-cols-5 px-3 py-2 text-xs text-zinc-500">
              <span>{t("method") || "Medio"}</span>
              <span>{t("concept") || "Concepto"}</span>
              <span>{t("amount") || "Importe"}</span>
              <span>{t("bank") || "Banco"}</span>
              <span>{t("receipt") || "Comprobante"}</span>
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {(payment.values || []).map((v, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-5 gap-x-3 gap-y-1 px-3 py-2 text-sm">
                  {/* Medio */}
                  <div className="flex sm:block justify-between">
                    <span className="text-xs text-zinc-500 sm:hidden">{t("method") || "Medio"}:</span>
                    <span className="uppercase">{(v as any)?.method}</span>
                  </div>
                  {/* Concepto */}
                  <div className="flex sm:block justify-between">
                    <span className="text-xs text-zinc-500 sm:hidden">{t("concept") || "Concepto"}:</span>
                    <span className="truncate">{(v as any)?.concept}</span>
                  </div>
                  {/* Importe */}
                  <div className="flex sm:block justify-between">
                    <span className="text-xs text-zinc-500 sm:hidden">{t("amount") || "Importe"}:</span>
                    <span>{currencyFmt.format((v as any)?.amount)}</span>
                  </div>
                  {/* Banco */}
                  <div className="flex sm:block justify-between">
                    <span className="text-xs text-zinc-500 sm:hidden">{t("bank") || "Banco"}:</span>
                    <span>{(v as any)?.bank || "—"}</span>
                  </div>
                  {/* Comprobante */}
                  <div className="flex sm:block justify-between">
                    <span className="text-xs text-zinc-500 sm:hidden">{t("receipt") || "Comprobante"}:</span>
                    <span>
                      {(v as any)?.receipt_url ? (
                        <a
                          href={(v as any).receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {t("view") || "Ver"}
                        </a>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comentarios */}
          {payment.comments ? (
            <div className="rounded border border-zinc-200 dark:border-zinc-800 p-3 text-sm">
              <div className="font-semibold mb-1">{t("notes") || "Notas"}</div>
              <div className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                {payment.comments}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer (sticky) */}
        <div className="
          sticky bottom-0 z-10
          flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2
          px-4 py-3 border-t border-zinc-200 dark:border-zinc-800
          bg-white
        ">
          <div className="text-[10px] sm:text-xs text-zinc-500">
            ID: {payment._id} · {t("created") || "Creado"}:{" "}
            {payment.created_at
              ? format(new Date(payment.created_at), "dd/MM/yyyy HH:mm")
              : "—"}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              className="w-full sm:w-auto px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={onClose}
            >
              {t("close") || "Cerrar"}
            </button>

            <button
              className={`w-full sm:w-auto px-3 py-2 rounded text-white ${
                isMarking
                  ? "bg-amber-500 cursor-wait"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              onClick={onMark}
              disabled={isMarking}
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
  valueClassName = "",
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <span className={`text-sm ${valueClassName}`}>{value}</span>
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
  const k = (type ?? "").toLowerCase();

  // Fallback legible si faltan traducciones
  const fallback =
    k === "contra_entrega"
      ? "Cash on delivery"
      : k === "cta_cte"
      ? "On account"
      : k || "-";

  // paymentType.contra_entrega / paymentType.cta_cte
  const label = t(`paymentType.${k}`, fallback);

  const cls =
    k === "contra_entrega"
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
