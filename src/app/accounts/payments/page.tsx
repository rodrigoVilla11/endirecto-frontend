"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineDownload } from "react-icons/ai";
import { FaRegFilePdf, FaEye, FaSpinner, FaTimes, FaUndo } from "react-icons/fa";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useClient } from "@/app/context/ClientContext";

// RTK Query (payments)
import {
  useLazyGetPaymentsQuery,
  useSetChargedMutation,
  type Payment,
} from "@/redux/services/paymentsApi";

const ITEMS_PER_PAGE = 15;

const PaymentsChargedPage = () => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Payment[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sortQuery, setSortQuery] = useState<string>(""); // "campo:asc|desc"
  const [customer_id, setCustomer_id] = useState<string>("");

  const [searchParams, setSearchParams] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null,
  });

  // Modal de detalles
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Payment | null>(null);

  const [fetchPayments, { data, isFetching }] = useLazyGetPaymentsQuery();
  const [setCharged, { isLoading: isToggling }] = useSetChargedMutation();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedClientId !== customer_id) {
      setCustomer_id(selectedClientId || "");
      setPage(1);
      setItems([]);
      setHasMore(true);
    }
  }, [selectedClientId]);

  useEffect(() => {
    const loadItems = async () => {
      if (isLoading) return;
      setIsLoading(true);
      try {
        const startDate = searchParams.startDate ? format(searchParams.startDate, "yyyy-MM-dd") : undefined;
        const endDate = searchParams.endDate ? format(searchParams.endDate, "yyyy-MM-dd") : undefined;

        const res = await fetchPayments({
          page,
          limit: ITEMS_PER_PAGE,
          startDate,
          endDate,
          sort: sortQuery,
          customer_id: customer_id || undefined,
          isCharged: "true",         // 👈 solo cobrados
          includeLookup: false,
        }).unwrap();

        const newItems = res?.payments ?? [];
        setItems((prev) => (page === 1 ? newItems : [...prev, ...newItems]));
        setHasMore(newItems.length === ITEMS_PER_PAGE);
      } catch (e) {
        console.error("Error loading charged payments:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortQuery, customer_id, searchParams.startDate, searchParams.endDate]);

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

  const handleSort = useCallback(
    (field: string) => {
      setPage(1);
      setItems([]);
      setHasMore(true);
      const [curField, curDir] = sortQuery ? sortQuery.split(":") : ["", ""];
      setSortQuery(curField === field ? `${field}:${curDir === "asc" ? "desc" : "asc"}` : `${field}:asc`);
    },
    [sortQuery]
  );

  const openDetails = (p: Payment) => {
    setSelected(p);
    setIsDetailOpen(true);
  };
  const closeDetails = () => {
    setIsDetailOpen(false);
    setSelected(null);
  };

  const onUnmarkCharged = async (id: string) => {
    const msg = t("areYouSureUnmarkCharged") || "¿Desmarcar este pago como cobrado?";
    if (!window.confirm(msg)) return;
    try {
      setTogglingId(id);
      await setCharged({ id, value: false }).unwrap();
      setItems((prev) => prev.filter((p) => p._id !== id)); // lo quitamos de la lista de cobrados
      if (selected?._id === id) closeDetails();
    } catch (e) {
      console.error("No se pudo desmarcar como cobrado:", e);
    } finally {
      setTogglingId(null);
    }
  };

  const tableData =
    items?.map((p) => {
      const number = p.documents?.[0]?.number ?? "—";
      const isThisRowToggling = togglingId === p._id;

      return {
        key: p._id,
        info: (
          <button
            className="flex items-center justify-center p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
            title={t("view") as string}
            onClick={() => openDetails(p)}
          >
            <FaEye className="text-lg" />
          </button>
        ),
        pdf: (
          <div className="flex justify-center items-center">
            <FaRegFilePdf className="text-center text-xl" />
          </div>
        ),
        number,
        date: p.date ? format(new Date(p.date), "dd/MM/yyyy HH:mm") : "N/A",
        payment: p.currency || "ARS",
        amount: p.total,
        status: p.status,
        notes: p.comments ?? "",
        customer: p.customer?.id ?? "—",
        actions: (
          <button
            className={`flex items-center gap-2 px-3 py-1 rounded text-white ${
              isThisRowToggling ? "bg-amber-500 cursor-wait" : "bg-red-600 hover:bg-red-700"
            }`}
            onClick={() => onUnmarkCharged(p._id)}
            disabled={isToggling || isThisRowToggling}
            title={t("unmarkAsCharged") || "Desmarcar cobrado"}
          >
            {isThisRowToggling ? (
              <>
                <FaSpinner className="animate-spin" />
                {t("processing") || "Procesando..."}
              </>
            ) : (
              <>
                <FaUndo />
                {t("unmarkAsCharged") || "Desmarcar cobrado"}
              </>
            )}
          </button>
        ),
      };
    }) ?? [];

  const tableHeader = [
    { component: <AiOutlineDownload className="text-center text-xl" />, key: "info" },
    { component: <FaRegFilePdf className="text-center text-xl" />, key: "pdf" },
    { name: t("number"), key: "number", important: true },
    { name: t("date"), key: "date" },
    { name: t("payment"), key: "payment" },
    { name: t("amount"), key: "amount", important: true },
    { name: t("status"), key: "status", important: true },
    { name: t("notes"), key: "notes" },
    { name: t("customer"), key: "customer" },
    { name: t("actions") || "Acciones", key: "actions" },
  ];

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
    results: `${data?.total ?? 0} ${t("results")}`,
  };

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR", "CUSTOMER"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("chargedPayments") || "Pagos cobrados"}</h3>
        <Header headerBody={headerBody} />
        <Table
          headers={tableHeader}
          data={tableData}
          onSort={handleSort}
          sortField={sortQuery.split(":")[0] || ""}
          sortOrder={(sortQuery.split(":")[1] as "asc" | "desc" | "") || ""}
        />
      </div>

      {isDetailOpen && selected && (
        <DetailsModal
          payment={selected}
          onClose={closeDetails}
          onUnmark={() => onUnmarkCharged(selected._id)}
          isToggling={isToggling || togglingId === selected._id}
          t={t}
        />
      )}

      <div ref={observerRef} className="h-10" />
    </PrivateRoute>
  );
};

export default PaymentsChargedPage;

/* ===================== Modal de Detalles ===================== */

type DetailsModalProps = {
  payment: Payment;
  onClose: () => void;
  onUnmark: () => void;
  isToggling: boolean;
  t: (k: string) => string;
};

function DetailsModal({ payment, onClose, onUnmark, isToggling, t }: DetailsModalProps) {
  const currencyFmt = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: payment.currency || "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col">
            <h4 className="text-lg font-semibold">
              {t("paymentDetail") || "Detalle de pago"}
            </h4>
            <span className="text-xs text-zinc-500">
              {t("number")}: {payment.documents?.[0]?.number ?? "—"} · {t("date")}:{" "}
              {payment.date ? format(new Date(payment.date), "dd/MM/yyyy HH:mm") : "N/A"}
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

        {/* Body */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <Info label={t("customer") || "Cliente"} value={payment.customer?.id || "—"} />
            <Info label={t("status")} value={payment.status} />
            <Info label={t("type") || "Tipo"} value={payment.type} />
            <Info
              label={t("charged") || "Cobrado"}
              value={payment.isCharged ? (t("yes") || "Sí") : (t("no") || "No")}
            />
          </div>

          <div className="rounded border border-zinc-200 dark:border-zinc-800">
            <div className="px-3 py-2 text-sm font-semibold border-b border-zinc-200 dark:border-zinc-800">
              {t("totals") || "Totales"}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 text-sm">
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

          <div className="rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-3 py-2 text-sm font-semibold border-b">
              {t("documents") || "Documentos"}
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              <div className="grid grid-cols-6 px-3 py-2 text-xs text-zinc-500">
                <span>{t("number")}</span>
                <span>{t("days") || "Días"}</span>
                <span>{t("base") || "Base"}</span>
                <span>%</span>
                <span>{t("discount") || "Desc."}</span>
                <span>{t("final") || "Final"}</span>
              </div>
              {(payment.documents || []).map((d) => (
                <div key={d.document_id} className="grid grid-cols-6 px-3 py-2 text-sm">
                  <span>{d.number}</span>
                  <span className={d.note ? "text-amber-600" : ""}>{d.days_used ?? "—"}</span>
                  <span>{currencyFmt.format(d.base)}</span>
                  <span>{(d.discount_rate * 100).toFixed(0)}%</span>
                  <span>-{currencyFmt.format(d.discount_amount)}</span>
                  <span className={d.note ? "text-amber-600" : ""}>
                    {currencyFmt.format(d.final_amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-3 py-2 text-sm font-semibold border-b">
              {t("values") || "Valores"}
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              <div className="grid grid-cols-5 px-3 py-2 text-xs text-zinc-500">
                <span>{t("method") || "Medio"}</span>
                <span>{t("concept") || "Concepto"}</span>
                <span>{t("amount") || "Importe"}</span>
                <span>{t("bank") || "Banco"}</span>
                <span>{t("receipt") || "Comprobante"}</span>
              </div>
              {(payment.values || []).map((v, i) => (
                <div key={i} className="grid grid-cols-5 px-3 py-2 text-sm">
                  <span className="uppercase">{v.method}</span>
                  <span>{v.concept}</span>
                  <span>{currencyFmt.format(v.amount)}</span>
                  <span>{v.bank || "—"}</span>
                  <span>
                    {v.receipt_url ? (
                      <a href={v.receipt_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        {t("view") || "Ver"}
                      </a>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {payment.comments ? (
            <div className="rounded border border-zinc-200 dark:border-zinc-800 p-3 text-sm">
              <div className="font-semibold mb-1">{t("notes") || "Notas"}</div>
              <div className="text-zinc-700 dark:text-zinc-300">{payment.comments}</div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="text-xs text-zinc-500">
            ID: {payment._id} · {t("created") || "Creado"}:{" "}
            {payment.created_at ? format(new Date(payment.created_at), "dd/MM/yyyy HH:mm") : "—"}
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={onClose}
            >
              {t("close") || "Cerrar"}
            </button>
            <button
              className={`px-3 py-2 rounded text-white ${
                isToggling ? "bg-amber-500 cursor-wait" : "bg-red-600 hover:bg-red-700"
              }`}
              onClick={onUnmark}
              disabled={isToggling}
            >
              {isToggling ? (
                <span className="inline-flex items-center gap-2">
                  <FaSpinner className="animate-spin" /> {t("processing") || "Procesando..."}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <FaUndo /> {t("unmarkAsCharged") || "Desmarcar cobrado"}
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
      <span className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</span>
      <span className={`text-sm ${valueClassName}`}>{value}</span>
    </div>
  );
}
