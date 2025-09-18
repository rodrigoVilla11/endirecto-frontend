"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FaEye, FaSpinner, FaTimes } from "react-icons/fa";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useClient } from "@/app/context/ClientContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// RTK Query (payments)
import {
  useLazyGetPaymentsQuery,
  useSetChargedMutation,
  type Payment,
  useUpdatePaymentMutation,
} from "@/redux/services/paymentsApi";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useAuth } from "@/app/context/AuthContext";

const ITEMS_PER_PAGE = 15;

const PaymentsChargedPage = () => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Payment[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sortQuery, setSortQuery] = useState<string>("");
  const [customer_id, setCustomer_id] = useState<string>("");

  const [methodFilter, setMethodFilter] = useState<
    "" | "efectivo" | "transferencia" | "cheque"
  >("");

  const [searchParams, setSearchParams] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });

  // Modal de detalles
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Payment | null>(null);

  const [fetchPayments, { data, isFetching }] = useLazyGetPaymentsQuery();
  const [setCharged, { isLoading: isToggling }] = useSetChargedMutation();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRindiendo, setIsRindiendo] = useState(false);
  const [updatePayment] = useUpdatePaymentMutation();

  useEffect(() => {
    setSelectedIds(new Set());
  }, [
    page,
    sortQuery,
    selectedClientId,
    searchParams.startDate,
    searchParams.endDate,
  ]);

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(items.map((p) => p._id)) : new Set());
  };

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedClientId !== customer_id) {
      setCustomer_id(selectedClientId || "");
      setPage(1);
      setItems([]);
      setHasMore(true);
    }
  }, [selectedClientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const { userData } = useAuth();
  const role = userData?.role as "CUSTOMER" | "VENDEDOR" | string | undefined;

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
          includeLookup: false,
          // isCharged: "true",
        };

        if (role === "VENDEDOR" && !selectedClientId) {
          if (userData?.seller_id) {
            baseArgs.seller_id = String(userData.seller_id);
          }
        } else if (selectedClientId || role === "CUSTOMER") {
          const cid = selectedClientId || customer_id;
          if (cid) baseArgs.customer_id = String(cid);
        }

        console.log("baseArgs", baseArgs);
        const res = await fetchPayments(baseArgs).unwrap();

        console.log("res", res);
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
  }, [
    page,
    sortQuery,
    customer_id,
    searchParams.startDate,
    searchParams.endDate,
    role,
    userData?.seller_id,
    selectedClientId,
  ]);

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

  // ================== VISIBLE (aplica filtro por método) ==================
  const visibleItems = useMemo(() => {
    if (!methodFilter) return items;
    return items.filter((p) =>
      (p.values ?? []).some((v: any) => v?.method === methodFilter)
    );
  }, [items, methodFilter]);

  // ================== EFECTIVOS (si hay selección, intersección con visible) ==================
  const effectiveItems = useMemo(
    () =>
      selectedIds.size
        ? visibleItems.filter((p) => selectedIds.has(p._id))
        : visibleItems,
    [visibleItems, selectedIds]
  );

  // Totales por método sobre lo “efectivo” (visible ∩ seleccionado)
  const methodTotals = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const p of effectiveItems) {
      for (const v of (p.values ?? []) as any[]) {
        const m = (v?.method ?? "—").toString().toLowerCase();
        const amount = Number(v?.amount ?? 0);
        acc[m] = (acc[m] ?? 0) + amount;
      }
    }
    return acc;
  }, [effectiveItems]);

  const grandTotal = useMemo(
    () => Object.values(methodTotals).reduce((a, b) => a + b, 0),
    [methodTotals]
  );

  const prettyMethod = (m?: string) => {
    const k = (m ?? "").toLowerCase();
    if (k === "efectivo") return "Efectivo";
    if (k === "transferencia") return "Transferencia";
    if (k === "cheque") return "Cheque";
    return (m || "—").toUpperCase();
  };

  // totales por método para una lista arbitraria (para PDF)
  const buildMethodTotals = (rows: Payment[]) => {
    const acc: Record<string, { total: number; count: number }> = {};
    for (const p of rows) {
      for (const v of (p.values ?? []) as any[]) {
        const m = (v?.method ?? "—").toString().toLowerCase();
        const amount = Number(v?.amount ?? 0);
        if (!acc[m]) acc[m] = { total: 0, count: 0 };
        acc[m].total += amount;
        acc[m].count += 1;
      }
    }
    return acc;
  };

  const downloadPDFFor = (rows: Payment[]) => {
    if (!rows.length) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Rendición de pagos", 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const now = new Date();
    doc.text(
      `Generado: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      40,
      58
    );

    autoTable(doc, {
      startY: 72,
      head: [["Fecha", "Cliente", "Docs", "Métodos", "Neto", "Valores", "Dif"]],
      body: rows.map((p) => {
        const fecha = p.date
          ? format(new Date(p.date), "dd/MM/yyyy HH:mm")
          : "—";
        const cliente = p.customer?.id ?? "—";
        const docs = (p.documents ?? []).map((d) => d.number).join(", ") || "—";
        const methods =
          (p.values ?? []).map((v: any) => prettyMethod(v.method)).join(", ") ||
          "—";
        const neto = currencyFmt.format(p.totals?.net ?? p.total ?? 0);
        const valores = currencyFmt.format(p.totals?.values ?? 0);
        const dif = currencyFmt.format(
          p.totals?.diff ?? (p.total ?? 0) - (p.totals?.values ?? 0)
        );
        return [fecha, cliente, docs, methods, neto, valores, dif];
      }),
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [2, 132, 199] },
      margin: { left: 40, right: 40 },
      didDrawPage: () => {
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(9);
          doc.text(`Página ${i} / ${totalPages}`, pageW - 40, pageH - 20, {
            align: "right",
          });
        }
      },
    });

    // Totales por método (solo de “rows”)
    const yStart = (doc as any).lastAutoTable?.finalY
      ? (doc as any).lastAutoTable.finalY + 24
      : 120;

    const totalsMap = buildMethodTotals(rows);
    const totalsEntries = Object.entries(totalsMap).sort(
      (a, b) => b[1].total - a[1].total
    );
    const grand = totalsEntries.reduce((s, [, o]) => s + o.total, 0);

    doc.setFont("helvetica", "bold");
    doc.text("Totales por método", 40, yStart - 8);

    autoTable(doc, {
      startY: yStart,
      head: [["Método", "Cant. valores", "Total", "% del total"]],
      body: totalsEntries.map(([m, o]) => [
        prettyMethod(m),
        String(o.count),
        currencyFmt.format(o.total),
        `${((o.total / (grand || 1)) * 100).toFixed(1)}%`,
      ]),
      foot: [
        [
          { content: "TOTAL", styles: { fontStyle: "bold" } },
          {
            content: String(totalsEntries.reduce((s, [, o]) => s + o.count, 0)),
            styles: { fontStyle: "bold" },
          },
          { content: currencyFmt.format(grand), styles: { fontStyle: "bold" } },
          { content: "100%", styles: { fontStyle: "bold" } },
        ],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 40, right: 40 },
    });

    doc.save(`rendidos_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
  };

  const handleRendir = async () => {
    const candidates = selectedIds.size
      ? items.filter((p) => selectedIds.has(p._id))
      : items;
    const toRendir = candidates.filter((p) => !(p as any).rendido);

    if (!toRendir.length) {
      alert("No hay pagos para rendir (ya están rendidos o no hay selección).");
      return;
    }

    setIsRindiendo(true);
    try {
      const results = await Promise.allSettled(
        toRendir.map((p) =>
          updatePayment({ id: p._id, data: { rendido: true } }).unwrap()
        )
      );

      const okIds = results
        .map((r, i) => (r.status === "fulfilled" ? toRendir[i]._id : null))
        .filter((x): x is string => !!x);

      if (!okIds.length) {
        alert("No se pudo rendir ninguno de los pagos seleccionados.");
        return;
      }

      setItems((prev) =>
        prev.map((p) =>
          okIds.includes(p._id) ? ({ ...p, rendido: true } as any) : p
        )
      );

      const okRows = toRendir.filter((p) => okIds.includes(p._id));
      downloadPDFFor(okRows);

      setSelectedIds(new Set());
    } catch (e) {
      console.error(e);
      alert("Ocurrió un error al rendir.");
    } finally {
      setIsRindiendo(false);
    }
  };

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
      setSortQuery(
        curField === field
          ? `${field}:${curDir === "asc" ? "desc" : "asc"}`
          : `${field}:asc`
      );
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
    const msg =
      t("areYouSureUnmarkCharged") || "¿Desmarcar este pago como cobrado?";
    if (!window.confirm(msg)) return;

    try {
      setTogglingId(id);
      await setCharged({ id, value: false }).unwrap();

      // Sacar de la lista “cobrados”
      setItems((prev) => prev.filter((p) => p._id !== id));

      if (selected?._id === id) closeDetails();
    } catch (e) {
      console.error("No se pudo desmarcar como cobrado:", e);
    } finally {
      setTogglingId(null);
    }
  };

  // ===================== Tabla =====================

  const tableData =
    visibleItems?.map((p) => {
      const isThisRowToggling = togglingId === p._id;

      return {
        key: p._id,
        select: (
          <input
            type="checkbox"
            aria-label="Seleccionar pago"
            checked={selectedIds.has(p._id)}
            onChange={(e) => toggleOne(p._id, e.target.checked)}
          />
        ),
        info: (
          <div className="grid place-items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center w-6 h-6 rounded "
              title={t("view") as string}
              onClick={() => openDetails(p)}
              aria-label={t("view") as string}
            >
              {isThisRowToggling ? (
                <FaSpinner className="animate-spin text-base leading-none" />
              ) : (
                <FaEye className="text-base leading-none" />
              )}
            </button>
          </div>
        ),
        customer: <CustomerIdAndName id={p.customer?.id} />,
        seller: <CustomerSellerCell customerId={p.customer?.id} />,
        date: p.date ? format(new Date(p.date), "dd/MM/yyyy HH:mm") : "—",
        documents: (p.documents ?? []).map((d) => d.number).join(", ") || "—",
        imputed: (
          <span>
            <ImputedPill imputed={p.isImputed} />
          </span>
        ),
        rendido: (
          <span>
            <ImputedPill imputed={p.rendido} />
          </span>
        ),
        total: p.total ?? 0,
        notes: p.comments ?? "",
      };
    }) ?? [];

  const allSelected =
    items.length > 0 && items.every((p) => selectedIds.has(p._id));
  const someSelected =
    !allSelected && items.some((p) => selectedIds.has(p._id));

  const tableHeader = [
    {
      component: (
        <input
          type="checkbox"
          aria-label="Seleccionar todos"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={(e) => toggleAll(e.target.checked)}
        />
      ),
      key: "select",
      important: true,
    },
    { component: <FaEye className="text-center text-xl" />, key: "info" },
    { name: t("customer"), key: "customer", important: true },
    { name: t("seller") || "Vendedor", key: "seller" },
    { name: t("date"), key: "date" },
    { name: t("documents"), key: "documents" },
    { name: t("imputed"), key: "imputed" },
    { name: t("rendido"), key: "rendido" },
    { name: t("total"), key: "total", important: true },
    { name: t("notes"), key: "notes" },
  ];

  // ===================== Header (filtros/acciones) =====================

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
      {
        content: (
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as any)}
            className="border border-gray-300 rounded p-2 text-sm"
            title={t("paymentMethod") || "Forma de pago"}
          >
            <option value="">{t("all") || "Todas las formas"}</option>
            <option value="efectivo">{t("cash") || "Efectivo"}</option>
            <option value="transferencia">
              {t("transfer") || "Transferencia"}
            </option>
            <option value="cheque">{t("cheque") || "Cheque"}</option>
          </select>
        ),
      },
      {
        content: (
          <button
            onClick={handleRendir}
            disabled={selectedIds.size === 0 || isRindiendo}
            className={`px-3 py-2 rounded text-white ${
              selectedIds.size === 0 || isRindiendo
                ? "bg-zinc-300 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
            title={
              selectedIds.size === 0
                ? "Seleccioná al menos un pago"
                : "Rendir pagos seleccionados"
            }
          >
            {isRindiendo ? "Rindiendo..." : "Rendir"}
          </button>
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
        <h3 className="font-bold p-4">
          {t("chargedPayments") || "Pagos cobrados"}
        </h3>
        <Header headerBody={headerBody} />

        <MethodTotalsBar
          totals={methodTotals}
          grandTotal={grandTotal}
          format={(n) => currencyFmt.format(n)}
        />

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

/* ===================== Celda de Vendedor ===================== */

function CustomerSellerCell({ customerId }: { customerId?: string }) {
  const { data, isFetching, isError } = useGetCustomerByIdQuery(
    { id: customerId ?? "" },
    { skip: !customerId }
  );

  if (!customerId) return <>—</>;
  if (isFetching) return <span className="text-zinc-400">…</span>;
  if (isError) return <>—</>;
  return <>{data?.seller_id ?? "—"}</>;
}

/* ===================== Modal de Detalles ===================== */

type DetailsModalProps = {
  payment: Payment;
  onClose: () => void;
  onUnmark: () => void;
  isToggling: boolean;
  t: (k: string) => string;
};

function DetailsModal({
  payment,
  onClose,
  onUnmark,
  isToggling,
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
          w-full h-full sm:h-auto sm:max-h[90vh] sm:max-w-3xl
          bg-white rounded-none sm:rounded-xl shadow-xl
          overflow-hidden flex flex-col
        "
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white">
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

        {/* Body */}
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 max-h-[calc(90vh-112px)]">
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
          <div className="rounded border border-zinc-200">
            <div className="px-3 py-2 text-sm font-semibold border-b border-zinc-200">
              {t("totals") || "Totales"}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 text-sm">
              <Info
                label="Bruto"
                value={currencyFmt.format(payment.totals?.gross ?? 0)}
              />
              <Info
                label="Desc."
                value={`-${currencyFmt.format(payment.totals?.discount ?? 0)}`}
              />
              <Info
                label="Neto"
                value={currencyFmt.format(payment.totals?.net ?? payment.total)}
              />
              <Info
                label="Valores"
                value={currencyFmt.format(payment.totals?.values ?? 0)}
              />
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
          <div className="rounded border border-zinc-200 overflow-hidden">
            <div className="px-3 py-2 text-sm font-semibold border-b border-zinc-200">
              {t("documents") || "Documentos"}
            </div>

            {/* Header desktop */}
            <div className="hidden sm:grid [grid-template-columns:minmax(0,2fr)_minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,1fr)] px-3 py-2 text-xs text-zinc-500">
              <span>{t("number")}</span>
              <span>{t("days") || "Días"}</span>
              <span>{t("base") || "Base"}</span>
              <span>%</span>
              <span>{t("discount") || "Desc."}</span>
              <span>{t("final") || "Final"}</span>
            </div>

            <div className="divide-y divide-zinc-200">
              {(payment.documents || []).map((d) => (
                <div
                  key={d.document_id}
                  className="grid grid-cols-1 sm:[grid-template-columns:minmax(0,2fr)_minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-1 px-3 py-2 text-sm"
                >
                  <div className="flex sm:block justify-between min-w-0">
                    <span className="text-xs text-zinc-500 sm:hidden">
                      {t("number")}:
                    </span>
                    <span className="block truncate" title={d.number}>
                      {d.number}
                    </span>
                  </div>

                  <div className="flex sm:block justify-between min-w-0">
                    <span className="text-xs text-zinc-500 sm:hidden">
                      {t("days") || "Días"}:
                    </span>
                    <span
                      className={`sm:text-right tabular-nums ${
                        d.note ? "text-amber-600" : ""
                      }`}
                    >
                      {d.days_used ?? "—"}
                    </span>
                  </div>

                  <div className="flex sm:block justify-between min-w-0">
                    <span className="text-xs text-zinc-500 sm:hidden">
                      {t("base") || "Base"}:
                    </span>
                    <span className="sm:text-right tabular-nums">
                      {currencyFmt.format(d.base)}
                    </span>
                  </div>

                  <div className="flex sm:block justify-between min-w-0">
                    <span className="text-xs text-zinc-500 sm:hidden">%</span>
                    <span className="sm:text-right tabular-nums">
                      {(d.discount_rate * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex sm:block justify-between min-w-0">
                    <span className="text-xs text-zinc-500 sm:hidden">
                      {t("discount") || "Desc."}:
                    </span>
                    <span className="sm:text-right tabular-nums">
                      -{currencyFmt.format(d.discount_amount)}
                    </span>
                  </div>

                  <div className="flex sm:block justify-between min-w-0">
                    <span className="text-xs text-zinc-500 sm:hidden">
                      {t("final") || "Final"}:
                    </span>
                    <span
                      className={`sm:text-right tabular-nums ${
                        d.note ? "text-amber-600" : ""
                      }`}
                    >
                      {currencyFmt.format(d.final_amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Valores */}
          <div className="rounded border border-zinc-200 overflow-hidden">
            <div className="px-3 py-2 text-sm font-semibold border-b border-zinc-200">
              {t("values") || "Valores"}
            </div>

            <div className="hidden sm:grid grid-cols-12 gap-x-3 px-3 py-2 text-xs text-zinc-500">
              <span className="col-span-2">{t("method") || "Medio"}</span>
              <span className="col-span-4">{t("concept") || "Concepto"}</span>
              <span className="col-span-2 text-right">
                {t("amount") || "Importe"}
              </span>
              <span className="col-span-2">{t("bank") || "Banco"}</span>
              <span className="col-span-2">
                {t("receipt") || "Comprobante"}
              </span>
            </div>

            <div className="divide-y divide-zinc-200">
              {(payment.values || []).map((v: any, i: number) => {
                // helpers locales
                const fmtDate = (d?: any) =>
                  d ? format(new Date(d.$date ?? d), "dd/MM/yyyy") : "—";
                const pct = (n?: number) =>
                  Number.isFinite(n as number)
                    ? `${((n as number) * 100).toFixed(2)}%`
                    : "—";

                return (
                  <div
                    key={i}
                    className="
            grid grid-cols-1 sm:grid-cols-12 items-center
            gap-x-3 gap-y-1 px-3 py-2 text-sm
            sm:[&>div]:min-w-0
          "
                  >
                    <div className="flex sm:block justify-between sm:col-span-2">
                      <span className="text-xs text-zinc-500 sm:hidden">
                        {t("method") || "Medio"}:
                      </span>
                      <span className="uppercase truncate">{v.method}</span>
                    </div>

                    <div className="flex sm:block justify-between sm:col-span-4">
                      <span className="text-xs text-zinc-500 sm:hidden">
                        {t("concept") || "Concepto"}:
                      </span>
                      <Tooltip content={v.concept}>
                        <span className="truncate block">
                          {v.concept || "—"}
                        </span>
                      </Tooltip>
                    </div>

                    <div className="flex sm:block justify-between sm:col-span-2">
                      <span className="text-xs text-zinc-500 sm:hidden">
                        {t("amount") || "Importe"}:
                      </span>
                      <span className="tabular-nums whitespace-nowrap sm:text-right sm:block">
                        {currencyFmt.format(Number(v.amount ?? 0))}
                      </span>
                    </div>

                    <div className="flex sm:block justify-between sm:col-span-2">
                      <span className="text-xs text-zinc-500 sm:hidden">
                        {t("bank") || "Banco"}:
                      </span>
                      <Tooltip content={v.bank || "—"}>
                        <span className="truncate">{v.bank || "—"}</span>
                      </Tooltip>
                    </div>

                    <div className="flex sm:block justify-between sm:col-span-2">
                      <span className="text-xs text-zinc-500 sm:hidden">
                        {t("receipt") || "Comprobante"}:
                      </span>
                      <span className="truncate">
                        {v.receipt_url ? (
                          <Tooltip
                            content={v.receipt_original_name || v.receipt_url}
                            side="bottom"
                          >
                            <a
                              href={v.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline break-all inline-block max-w-full"
                            >
                              {t("view") || "Ver"}
                            </a>
                          </Tooltip>
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>

                    {/* 📌 Detalle extra cuando es CHEQUE */}
                    {String(v.method).toLowerCase() === "cheque" &&
                      v.cheque && (
                        <div className="sm:col-span-12 mt-2">
                          <div className="rounded-md border border-zinc-200 bg-zinc-50/50 p-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <Info
                                label="Fecha de cobro"
                                value={fmtDate(v.cheque.collection_date)}
                              />
                              <Info
                                label="Monto original"
                                value={currencyFmt.format(
                                  Number(v.raw_amount ?? v.amount ?? 0)
                                )}
                              />
                              <Info
                                label="Neto (imputable)"
                                value={currencyFmt.format(
                                  Number(v.cheque.net_amount ?? v.amount ?? 0)
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                              <Info
                                label="Interés (%)"
                                value={pct(v.cheque.interest_pct)}
                              />
                              <Info
                                label="Interés ($)"
                                value={currencyFmt.format(
                                  Number(v.cheque.interest_amount ?? 0)
                                )}
                              />
                              <Info
                                label="Tasa diaria"
                                value={
                                  Number.isFinite(Number(v.cheque.daily_rate))
                                    ? `${(
                                        Number(v.cheque.daily_rate) * 100
                                      ).toFixed(3)}%`
                                    : "—"
                                }
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
                              <Info
                                label="Días totales"
                                value={String(v.cheque.days_total ?? "—")}
                              />
                              <Info
                                label="Gracia"
                                value={String(v.cheque.grace_days ?? "—")}
                              />
                              <Info
                                label="Gravados"
                                value={String(v.cheque.days_charged ?? "—")}
                              />
                              <Info
                                label="Tasa anual"
                                value={
                                  Number.isFinite(
                                    Number(v.cheque.annual_interest_pct)
                                  )
                                    ? `${Number(
                                        v.cheque.annual_interest_pct
                                      ).toFixed(2)}%`
                                    : "—"
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>

          {payment.comments ? (
            <div className="rounded border border-zinc-200 p-3 text-sm">
              <div className="font-semibold mb-1">{t("notes") || "Notas"}</div>
              <div className="text-zinc-700 whitespace-pre-wrap break-words">
                {payment.comments}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-t border-zinc-200 bg-white">
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
  // ✅ Soporta legacy "contra_entrega" pero muestra “Pago anticipado”
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

function ImputedPill({ imputed }: { imputed?: boolean }) {
  const { t } = useTranslation();
  const labelYes = t("yes") || "Sí";
  const labelNo = t("no") || "No";
  const label = imputed ? labelYes : labelNo;
  const cls = imputed
    ? "bg-indigo-100 text-indigo-800"
    : "bg-zinc-100 text-zinc-800";
  const base =
    "px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1";
  return <span className={`${base} ${cls}`}>{label}</span>;
}

type MethodTotalsBarProps = {
  totals: Record<string, number>;
  grandTotal: number;
  format: (n: number) => string;
  onSelectMethod?: (method: string) => void;
};

function MethodTotalsBar({
  totals,
  grandTotal,
  format,
  onSelectMethod,
}: MethodTotalsBarProps) {
  const entries = useMemo(() => {
    const list = Object.entries(totals || {}).filter(([, v]) => v > 0);
    list.sort((a, b) => b[1] - a[1]);
    return list;
  }, [totals]);

  if (!entries.length || grandTotal <= 0) return null;

  const pretty = (m: string) => {
    const k = m.toLowerCase();
    if (k === "efectivo") return "Efectivo";
    if (k === "transferencia") return "Transferencia";
    if (k === "cheque") return "Cheque";
    return m.toUpperCase();
  };

  const palette = (m: string) => {
    const k = m.toLowerCase();
    if (k === "efectivo")
      return {
        solid: "bg-emerald-500",
        soft: "bg-emerald-100",
        text: "text-emerald-800",
      };
    if (k === "transferencia")
      return { solid: "bg-sky-500", soft: "bg-sky-100", text: "text-sky-800" };
    if (k === "cheque")
      return {
        solid: "bg-amber-500",
        soft: "bg-amber-100",
        text: "text-amber-800",
      };
    const fallbacks = [
      {
        solid: "bg-violet-500",
        soft: "bg-violet-100",
        text: "text-violet-800",
      },
      { solid: "bg-rose-500", soft: "bg-rose-100", text: "text-rose-800" },
      {
        solid: "bg-indigo-500",
        soft: "bg-indigo-100",
        text: "text-indigo-800",
      },
    ];
    const idx = Math.abs(hashCode(k)) % fallbacks.length;
    return fallbacks[idx];
  };

  const icon = (m: string) => {
    const k = m.toLowerCase();
    if (k === "efectivo") return "💵";
    if (k === "transferencia") return "🔁";
    if (k === "cheque") return "🧾";
    return "💳";
  };

  return (
    <section
      className="mx-4 my-3 rounded-xl border border-zinc-200 bg-white shadow-sm"
      role="group"
      aria-labelledby="method-totals-title"
    >
      <header className="flex items-center gap-3 px-4 pt-3">
        <h3
          id="method-totals-title"
          className="text-sm font-semibold text-zinc-800"
        >
          Resumen por medio de pago
        </h3>
        <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          Total {format(grandTotal)}
        </span>
      </header>

      <div className="px-4 pt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
          <div className="flex h-full">
            {entries.map(([m, val]) => {
              const pct = (val / grandTotal) * 100;
              const { solid } = palette(m);
              return (
                <div
                  key={`seg-${m}`}
                  className={`${solid} transition-[flex-basis] duration-300`}
                  style={{ flexBasis: `${pct}%` }}
                  title={`${pretty(m)}: ${format(val)} (${pct.toFixed(1)}%)`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <ul className="px-2 sm:px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {entries.map(([m, val]) => {
          const pct = (val / grandTotal) * 100;
          const { solid, soft, text } = palette(m);
          const clickable = typeof onSelectMethod === "function";
          const baseRow =
            "group rounded-lg border border-zinc-200 bg-white p-3 transition hover:shadow-sm";
          return (
            <li key={m}>
              <div
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : -1}
                onClick={clickable ? () => onSelectMethod!(m) : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ")
                          onSelectMethod!(m);
                      }
                    : undefined
                }
                className={`${baseRow} ${
                  clickable
                    ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-300"
                    : ""
                }`}
                aria-label={`${pretty(m)} ${format(val)} (${pct.toFixed(1)}%)`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-full text-base ${soft} ${text}`}
                    aria-hidden
                  >
                    {icon(m)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate text-sm font-medium text-zinc-800">
                        {pretty(m)}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        · {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className={`${solid} h-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="ml-auto tabular-nums text-sm font-semibold text-zinc-800">
                    {format(val)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* util para paleta estable */
function hashCode(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return h | 0;
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
