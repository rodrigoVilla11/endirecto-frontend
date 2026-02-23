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
import {
  useGetUserByIdQuery,
  useGetUsersQuery,
} from "@/redux/services/usersApi";
import DetailsModal from "./DetailsModal";

const ITEMS_PER_PAGE = 15;
export function isPaymentRendido(p?: Payment): boolean {
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
  const { data: usersData = [], isLoading: isLoadingUsers } =
    useGetUsersQuery(null);
  const users = usersData || [];

  const getSellerLabel = (seller: any) => {
    if (!seller) return t("notFound");
    const user = users.find((u: any) => u.seller_id === seller.id);
    const nameToShow = user?.username || seller.name || seller.id;
    return `${nameToShow}`;
  };

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
      { threshold: 0.5 },
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
          : `${field}:asc`,
      );
    },
    [sortQuery],
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
    // ✅ Siempre excluir reversed en UI, venga como venga del backend
    const base = items.filter((p) => p?.status !== "reversed");

    if (!methodFilter) return base;

    return base.filter((p) =>
      (p.values ?? []).some((v: any) => v?.method === methodFilter),
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
    [],
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
        rendido: (
          <span>
            <ImputedPill imputed={p.rendido} />
          </span>
        ),
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
    { name: t("rendido"), key: "rendido", important: true },
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
    const raw = (sellersData ?? []) as any[];
    return raw
      .map((s) => {
        const id = String(s?.id ?? s?._id ?? s?.seller_id ?? "");
        if (!id) return null;
        return { id, label: getSellerLabel({ ...s, id }) };
      })
      .filter(Boolean) as Array<{ id: string; label: string }>;
  }, [sellersData, getSellerLabel]);

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
              setPage(1);
              setItems([]);
              setHasMore(true);
            }}
            disabled={isSellersLoading || isLoadingUsers}
            className="border border-gray-300 rounded p-2 text-sm min-w-[220px]"
            title={t("seller") || "Vendedor"}
          >
            <option value="">{"Todos los vendedores"}</option>
            {sellerOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
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
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "OPERADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4 text-white">{t("pendingPayments")}</h3>
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

function ImputedPill({ imputed }: { imputed?: boolean }) {
  const { t } = useTranslation();
  const labelYes = t("yes") || "Sí";
  const labelNo = t("no") || "No";
  const label = imputed ? labelYes : labelNo;

  // ✅ Colores: verde si está rendido (true), rojo si no (false)
  const cls = imputed
    ? "bg-emerald-100 text-emerald-800"
    : "bg-rose-100 text-rose-800";

  const base =
    "px-4 py-2 rounded-full text-xs font-medium inline-flex items-center gap-1";

  return <span className={`${base} ${cls}`}>{label}</span>;
}
