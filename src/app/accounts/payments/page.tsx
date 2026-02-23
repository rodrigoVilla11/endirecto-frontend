"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FaCopy, FaEye, FaSpinner, FaTimes } from "react-icons/fa";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import PrivateRoute from "@/app/context/PrivateRoutes";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useClient } from "@/app/context/ClientContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { startOfDay, endOfDay } from "date-fns";

// RTK Query (payments)
import {
  useLazyGetPaymentsQuery,
  useSetChargedMutation,
  type Payment,
  useUpdatePaymentMutation,
} from "@/redux/services/paymentsApi";
import {
  useAddNotificationToCustomerMutation,
  useGetCustomerByIdQuery,
} from "@/redux/services/customersApi";
import { useAuth } from "@/app/context/AuthContext";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import {
  useAddNotificationToUserByIdMutation,
  useGetUserByIdQuery,
  useGetUsersQuery,
} from "@/redux/services/usersApi";
import { useUploadPdfMutation } from "@/redux/services/cloduinaryApi";
import DetailsModal from "./DetailsModal";

const ITEMS_PER_PAGE = 15;

const stopRowOpen = (e: React.SyntheticEvent) => {
  e.stopPropagation();
  if (e.nativeEvent?.stopImmediatePropagation)
    e.nativeEvent.stopImmediatePropagation();
};

const stopProps = {
  onClick: stopRowOpen,
  onMouseDown: stopRowOpen,
  onPointerDown: stopRowOpen,
};

const PaymentsChargedPage = () => {
   const { t } = useTranslation();
  const { selectedClientId } = useClient();
  const [sellerFilter, setSellerFilter] = useState<string>(""); // vendedor
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Payment[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sortQuery, setSortQuery] = useState<string>("");
  const [customer_id, setCustomer_id] = useState<string>("");
  const [showAnulados, setShowAnulados] = useState(false); // default: NO mostrarlos
  const [uploadPdf, { data: dataPdf, isLoading: isLoadingPdf }] =
    useUploadPdfMutation();
  const [methodFilter, setMethodFilter] = useState<
    "" | "efectivo" | "transferencia" | "cheque"
  >("");

  const [searchParams, setSearchParams] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>(() => {
    const today = new Date();
    return { startDate: today, endDate: today };
  });

  // Modal de detalles
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Payment | null>(null);
  const { userData } = useAuth();

  const [fetchPayments, { data, isFetching }] = useLazyGetPaymentsQuery();
  const [setCharged, { isLoading: isToggling }] = useSetChargedMutation();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRindiendo, setIsRindiendo] = useState(false);
  const [updatePayment] = useUpdatePaymentMutation();
  const { data: sellersData, isLoading: isSellersLoading } =
    useGetSellersQuery(null);
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery(null);

  const userRole = useMemo(
    () => userData?.role?.toUpperCase() || "",
    [userData]
  );
  const isCustomerRole = userRole === "CUSTOMER";

  const [rendidoFilter, setRendidoFilter] = useState<"" | "true" | "false">(
    "false"
  );
  useEffect(() => {
    setSelectedIds(new Set());
  }, [
    page,
    sortQuery,
    selectedClientId,
    searchParams.startDate,
    searchParams.endDate,
    rendidoFilter,
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
    setSelectedIds((prev) => {
      if (!checked) return new Set();
      const eligible = visibleItems
        .filter((p) => !isAnulado(p))
        .map((p) => p._id);
      return new Set(eligible);
    });
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

  const [addNotificationToCustomer] = useAddNotificationToCustomerMutation();
  const [addNotificationToUserById] = useAddNotificationToUserByIdMutation();

  const role = userData?.role as "CUSTOMER" | "VENDEDOR" | string | undefined;
  const isSellerRole = role === "VENDEDOR";
  const isSeller = role === "VENDEDOR";

  const isAnulado = (p: Payment | any) =>
    String(p?.status || "").toLowerCase() === "reversed" || Boolean(p?.anulado);

  useEffect(() => {
    const loadItems = async () => {
      if (isLoading) return;
      setIsLoading(true);
      try {
        const startDate = searchParams.startDate
          ? startOfDay(searchParams.startDate).toISOString()
          : undefined;

        const endDate = searchParams.endDate
          ? endOfDay(searchParams.endDate).toISOString()
          : undefined;

        const baseArgs: any = {
          page,
          limit: ITEMS_PER_PAGE,
          startDate,
          endDate,
          sort: sortQuery,
          includeLookup: false,
        };

        // 1) Si sos VENDEDOR, se filtra SIEMPRE por tu seller_id y el select queda bloqueado
        if (isSellerRole) {
          if (userData?.seller_id)
            baseArgs.seller_id = String(userData.seller_id);
        }

        // 2) Si NO sos VENDEDOR, aplicá el filtro manual de vendedor (si está elegido)
        if (!isSellerRole && sellerFilter) {
          baseArgs.seller_id = sellerFilter;
        }

        // 3) Filtro por cliente (cuando corresponde)
        if (role === "CUSTOMER" || selectedClientId) {
          const cid = selectedClientId || customer_id;
          if (cid) baseArgs.customer_id = String(cid);
        }
        const res = await fetchPayments(baseArgs).unwrap();

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
    sellerFilter,
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
    let arr = items;

    if (!showAnulados) {
      arr = arr.filter((p) => !isAnulado(p));
    }

    if (methodFilter) {
      arr = arr.filter((p) =>
        (p.values ?? []).some((v: any) => v?.method === methodFilter)
      );
    }

    if (rendidoFilter) {
      const flag = rendidoFilter === "true";
      arr = arr.filter((p) => (p as any).rendido === flag);
    }

    return arr;
  }, [items, methodFilter, rendidoFilter, showAnulados]);

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

  async function urlToDataUrl(url: string): Promise<string> {
    const resp = await fetch(url);
    if (!resp.ok)
      throw new Error(`No se pudo descargar imagen: ${resp.status}`);
    const blob = await resp.blob();

    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  // ================== Get user (para el PDF) ==================
  // Reemplaza COMPLETO tu downloadPDFFor por esta versión
  const downloadPDFFor = async (
    rows: Payment[],
    opts?: {
      uploadPdf?: (
        file: File,
        folder?: string
      ) => Promise<{ inline_url?: string; secure_url?: string; url?: string }>;
      updatePayment?: (id: string, body: any) => Promise<any>;
      folder?: string;
      alsoDownload?: boolean;
    }
  ) => {
    if (!rows.length) return;

    const currencyFmt = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const fmtMoney = (n: number) =>
      currencyFmt.format(n).replace(/\s/g, "\u00A0");

    const valueGross = (v: any) =>
      Number(v?.raw_amount ?? v?.rawAmount ?? v?.amount ?? 0);

    const prettyMethod = (m?: string) => {
      const k = (m ?? "").toLowerCase();
      if (k === "efectivo") return "Efectivo";
      if (k === "transferencia") return "Transferencia";
      if (k === "cheque") return "Cheque";
      return (m || "—").toUpperCase();
    };

    const formatMethodsCell = (values: any[]) => {
      if (!values || !values.length) return "—";

      return values
        .map((v) => {
          const m = String(v?.method || "").toLowerCase();

          if (m === "cheque") {
            const num = v?.cheque?.cheque_number;
            return num ? `Cheque N° ${num}` : "Cheque";
          }

          return prettyMethod(m); // Efectivo / Transferencia / etc.
        })
        .join("\n"); // 👈 una línea por valor, igual que Cobrado
    };

    const buildMethodTotalsGross = (payments: Payment[]) => {
      const acc: Record<string, { total: number; count: number }> = {};
      for (const p of payments) {
        for (const v of (p as any).values ?? []) {
          const m = (v?.method ?? "—").toString().toLowerCase();
          const amount = valueGross(v);
          if (!Number.isFinite(amount)) continue;
          if (!acc[m]) acc[m] = { total: 0, count: 0 };
          acc[m].total += amount;
          acc[m].count += 1;
        }
      }
      return acc;
    };

    const LOGO_URL =
      "https://res.cloudinary.com/db7kbwl5n/image/upload/v1767962680/endirecto_iggio2.png";

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight(); // 👈 agregado para saber el alto de página
    const margin = { left: 40, right: 40 };
    const wAvail = pageW - margin.left - margin.right;

    let logoDataUrl = "";
    try {
      logoDataUrl = await urlToDataUrl(LOGO_URL);
    } catch (e) {
      console.warn("No pude cargar el logo, sigo sin logo:", e);
    }

    // ===== Título (con vendedor) =====
    const firstRow: any = rows[0];
    const sellerId = firstRow?.seller.id;
    const userName = userData?.username || "";
    let sellerName = "";
    if (sellerId && Array.isArray(sellersData)) {
      const seller = usersData?.find((s) => s.seller_id === sellerId);
      sellerName = seller?.username || "";
    }
    const hasSeller = Boolean(sellerName);
    const hasUser = Boolean(userName);

    const title =
      hasSeller || hasUser
        ? sellerName && userName
          ? sellerName === userName
            ? `Rendición de pagos - ${sellerName}`
            : `Rendición de pagos - ${sellerName} - ${userName}`
          : `Rendición de pagos - ${sellerName || userName}`
        : "Rendición de pagos";

    // altura reservada para header
    const headerH = 82;

    // medidas logo
    const logoMaxH = 44;
    const logoMaxW = 112;
    const now = new Date();

    function drawHeader() {
      const topY = 22;
      // Logo
      let x = margin.left;
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, "PNG", x, topY, logoMaxW, logoMaxH);
        x += logoMaxW + 12;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(title, x, topY + 18);

      // Fecha
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Generado: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        x,
        topY + 36
      );

      // Línea separadora
      doc.setDrawColor(220);
      doc.setLineWidth(1);
      doc.line(margin.left, headerH - 10, pageW - margin.right, headerH - 10);
    }

    // Total bruto de todos los valores
    const sumValuesGross = rows.reduce(
      (s, p) =>
        s +
        ((p as any).values ?? []).reduce(
          (x: number, v: any) => x + valueGross(v),
          0
        ),
      0
    );

    const cw = {
      fecha: wAvail * 0.15,
      cliente: wAvail * 0.22,
      docs: wAvail * 0.2,
      metodos: wAvail * 0.16,
      cobrado: wAvail * 0.15,
      totalCobrado: wAvail * 0.14,
    };

    // ===== BLOQUE 1: tabla principal =====
    autoTable(doc, {
      startY: headerH,
      tableWidth: wAvail,
      pageBreak: "auto",
      margin: {
        left: margin.left,
        right: margin.right,
        top: headerH,
        bottom: 40,
      },

      didDrawPage: () => {
        drawHeader();
      },
      head: [
        ["Fecha", "Cliente", "Docs", "Métodos", "Cobrado", "Total Cobrado"],
      ],
      body: rows.map((p: any) => {
        const fecha = p.date
          ? format(new Date(p.date), "dd/MM/yyyy HH:mm")
          : "—";
        const id = p.customer?.id ?? "—";
        const nombre = p.customer?.name;
        const cliente =
          id !== "—" && nombre !== "—" ? `${id} — ${nombre}` : nombre ?? id;

        const docs =
          (p.documents ?? []).map((d: any) => d.number).join(", ") || "—";

        const valuesArr: any[] = p.values ?? [];

        const methods =
          valuesArr.length > 0 ? formatMethodsCell(valuesArr) : "—";

        const cobradoLines =
          valuesArr.length > 0
            ? valuesArr.map((v) => fmtMoney(valueGross(v))).join("\n")
            : "—";

        const totalCobradoNumber = valuesArr.reduce(
          (s, v) => s + valueGross(v),
          0
        );
        const totalCobrado = fmtMoney(totalCobradoNumber);

        return [fecha, cliente, docs, methods, cobradoLines, totalCobrado];
      }),

      theme: "striped",
      styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak" },
      bodyStyles: { valign: "top" },
      headStyles: { fillColor: [2, 132, 199], textColor: 255 },
      columnStyles: {
        0: { cellWidth: cw.fecha },
        1: { cellWidth: cw.cliente },
        2: { cellWidth: cw.docs },
        3: { cellWidth: cw.metodos },
        4: { cellWidth: cw.cobrado, halign: "right" },
        5: {
          cellWidth: cw.totalCobrado,
          halign: "right",
          overflow: "visible",
        },
      },
      foot: [
        [
          {
            content: "Totales",
            colSpan: 5,
            styles: { halign: "right", fontStyle: "bold" },
          },
          {
            content: fmtMoney(sumValuesGross),
            styles: { halign: "right", fontStyle: "bold" },
          },
        ],
      ],
    });

    // ===== BLOQUE 2: Totales por método justo debajo =====

    const totalsMap = buildMethodTotalsGross(rows as any);
    const totalsEntries = Object.entries(totalsMap).sort(
      (a, b) => b[1].total - a[1].total
    );
    const grand = totalsEntries.reduce((s, [, o]) => s + o.total, 0);
    const grandCount = totalsEntries.reduce((s, [, o]) => s + o.count, 0);

    // Y de la primera tabla
    const firstTableFinalY =
      (doc as any).lastAutoTable?.finalY != null
        ? (doc as any).lastAutoTable.finalY
        : 140;

    // Dejo un espacio y calculo si entra en la misma página
    let totalsStartY = firstTableFinalY + 30;
    const estimatedHeight = 120; // estimación simple
    if (totalsStartY + estimatedHeight > pageH - 40) {
      doc.addPage();
      drawHeader();
      totalsStartY = 60;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Totales por método (bruto)", margin.left, totalsStartY);

    autoTable(doc, {
      startY: totalsStartY + 20,
      tableWidth: wAvail,
      margin: {
        left: margin.left,
        right: margin.right,
        top: headerH,
        bottom: 40,
      },
      didDrawPage: () => {
        drawHeader();
      },
      head: [["Método", "Cant. valores", "Total bruto", "% del total"]],
      body: totalsEntries.map(([m, o]) => [
        prettyMethod(m),
        String(o.count),
        currencyFmt.format(o.total),
        `${((o.total / (grand || 1)) * 100).toFixed(2)}%`,
      ]),
      foot: [
        [
          { content: "TOTAL", styles: { fontStyle: "bold" } },
          { content: String(grandCount), styles: { fontStyle: "bold" } },
          { content: currencyFmt.format(grand), styles: { fontStyle: "bold" } },
          { content: "100%", styles: { fontStyle: "bold" } },
        ],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [34, 197, 94], textColor: 0 },
      columnStyles: {
        0: { cellWidth: wAvail * 0.5 },
        1: { cellWidth: wAvail * 0.14, halign: "right" },
        2: { cellWidth: wAvail * 0.22, halign: "right" },
        3: { cellWidth: wAvail * 0.14, halign: "right" },
      },
    });

    // ===== Subida + actualización de pagos (sin cambios) =====
    const filename = `rendidos_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`;
    const ab = doc.output("arraybuffer");
    const blob = new Blob([ab], { type: "application/pdf" });
    const file = new File([blob], filename, { type: "application/pdf" });

    if (opts?.alsoDownload) {
      doc.save(filename);
    }

    const folder = opts?.folder ?? "rendiciones";
    let pdfUrl = "";

    try {
      if (typeof opts?.uploadPdf === "function") {
        const r = await opts.uploadPdf(file, folder);
        pdfUrl = r?.inline_url || r?.secure_url || r?.url || "";
      } else {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        const base =
          process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000";
        const resp = await fetch(`${base}/cloudinary/upload-pdf`, {
          method: "POST",
          body: fd,
        });
        if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
        const j = await resp.json();
        pdfUrl = j?.inline_url || j?.secure_url || "";
      }
    } catch (e) {
      console.error("Error subiendo PDF a Cloudinary:", e);
      return;
    }

    if (!pdfUrl) return;

    try {
      await Promise.all(
        (rows as any[]).map((p) => {
          const id = p?.id || p?._id;
          if (!id) return Promise.resolve();

          if (typeof opts?.updatePayment === "function") {
            return opts.updatePayment(id, { pdf: pdfUrl });
          } else {
            const base =
              process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000";
            return fetch(`${base}/payments/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pdf: pdfUrl }),
            }).then(() => undefined);
          }
        })
      );
    } catch (e) {
      console.error("Error actualizando pagos con PDF:", e);
    }

    return pdfUrl;
  };

  const { data: customer } = useGetCustomerByIdQuery(
    { id: selectedClientId ?? "" },
    { skip: !selectedClientId }
  );

  const handleRendir = async () => {
    // Si no hay selección, tomamos TODOS los visibles no rendidos
    const poolWhenEmpty = visibleItems.filter((p) => !(p as any).rendido);

    const candidates = selectedIds.size
      ? items.filter((p) => selectedIds.has(p._id))
      : poolWhenEmpty;

    // Si llega sin selección y además no hay nada para rendir, avisamos
    if (!candidates.length) {
      alert(
        "No hay pagos para rendir (ya están rendidos o no hay en la vista actual)."
      );
      return;
    }

    // Si no había selección, la marcamos en la UI (solo visibles no rendidos)
    if (selectedIds.size === 0) {
      setSelectedIds(new Set(poolWhenEmpty.map((p) => p._id)));
    }

    // Filtramos por si había seleccionados rendidos por error
    const toRendir = candidates.filter((p) => !(p as any).rendido);

    setIsRindiendo(true);
    try {
      // 1) Marcamos como rendidos en backend
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

      // 2) Actualizamos localmente
      setItems((prev) =>
        prev.map((p) =>
          okIds.includes(p._id) ? ({ ...p, rendido: true } as any) : p
        )
      );

      const okRows = toRendir.filter((p) => okIds.includes(p._id));

      // 3) Generamos + subimos PDF + actualizamos cada pago con el link
      await downloadPDFFor(okRows, {
        uploadPdf: (file, folder) => uploadPdf({ file, folder }).unwrap(),
        updatePayment: (id, body) => updatePayment({ id, data: body }).unwrap(),
        folder: "rendiciones",
        alsoDownload: true,
      });

      // 4) Limpiamos selección
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

  function buildAnnulmentNotificationText(p: any, username?: string) {
    const fechaPago = (() => {
      const raw = (p?.date as any)?.$date ?? p?.date;
      try {
        return raw ? format(new Date(raw), "dd/MM/yyyy HH:mm") : "—";
      } catch {
        return "—";
      }
    })();

    const idPago = p?._id?.$oid ?? p?._id ?? "—";
    const customerId = p?.customer?.id ?? "—";
    const customerName = p?.customer?.name ? ` - ${p.customer.name}` : "";
    const vendedor =
      (p as any)?.seller?.name ??
      (p as any)?.seller?.id ??
      (p as any)?.seller_id ??
      "—";

    // Totales útiles para contexto
    const gross = p?.totals?.gross;
    const valuesNominal = (p?.totals as any)?.values_raw;
    const fmt = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: p?.currency || "ARS",
    }).format;

    const lines: string[] = [];
    lines.push(`Fecha: ${fechaPago}`);
    lines.push(`ID Pago: ${idPago}`);
    lines.push(`Cliente: ${customerId}${customerName}`);
    lines.push(`Vendedor: ${vendedor}`);
    lines.push(`Usuario: ${username || "—"}`);
    lines.push(``);
    lines.push(`*** ESTE PAGO FUE ANULADO ***`);
    if (typeof gross === "number") lines.push(`Documentos: ${fmt(gross)}`);
    if (typeof valuesNominal === "number")
      lines.push(`Total Pagado (Nominal): ${fmt(valuesNominal)}`);
    lines.push(`-----------------------------------`);
    lines.push(`Estado: ANULADO`);
    return lines.join("\n");
  }

  const onAnnulPayment = async (p: Payment) => {
    if (!isAdmin) return;

    // Si ya está anulado, no volvemos a notificar al cliente
    if (isAnulado(p)) {
      // opcional: console.warn("Pago ya anulado");
      return;
    }

    const ok = window.confirm("¿Anular definitivamente este pago?");
    if (!ok) return;

    try {
      // 1) Marcar anulado en backend
      await updatePayment({
        id: (p as any)._id,
        data: { status: "reversed", isCharged: false, rendido: false },
      }).unwrap();

      // 2) Actualizar estado local
      setItems((prev) =>
        prev.map((x) =>
          x._id === (p as any)._id
            ? ({
                ...x,
                status: "reversed",
                isCharged: false,
                rendido: false,
              } as any)
            : x
        )
      );
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete((p as any)._id);
        return n;
      });

      // 3) Notificar al cliente (7 días de ventana)
      try {
        const now = new Date();
        const longDescription = buildAnnulmentNotificationText(
          p,
          userData?.username
        );

        await addNotificationToUserById({
          id: "67a60be545b75a39f99a485b",
          notification: {
            title: "PAGO ANULADO",
            type: "PAGO",
            description: longDescription,
            link: "/payments",
            schedule_from: now,
            schedule_to: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        }).unwrap();

        await addNotificationToUserById({
          id: "67a66d36c646d2c766b81065",
          notification: {
            title: "PAGO ANULADO",
            type: "PAGO",
            description: longDescription,
            link: "/payments",
            schedule_from: now,
            schedule_to: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        }).unwrap();

        await addNotificationToCustomer({
          customerId: String(p?.customer?.id || selectedClientId),
          notification: {
            title: "PAGO ANULADO",
            type: "PAGO",
            description: longDescription,
            link: "/payments",
            schedule_from: now,
            schedule_to: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        }).unwrap();
      } catch (e) {
        console.error("No se pudo notificar al cliente sobre la anulación:", e);
        // sin alert; dejamos log
      }

      // ✅ Sin alert: la comunicación al cliente se hace por notificación
    } catch (e) {
      console.error(e);
      // Podés mostrar un toast no intrusivo si querés, pero me pediste quitar alerts.
    }
  };

  // ===================== Tabla =====================

  const tableData =
    visibleItems?.map((p) => {
      const isThisRowToggling = togglingId === p._id;
      const gray = isAnulado(p) ? "text-zinc-400" : "";
      return {
        key: `${format(new Date(p.date), "dd/MM/yyyy HH:mm")}- ${
          p.customer.name
        }`,
        select: (
          <input
            {...stopProps}
            type="checkbox"
            aria-label={`Seleccionar pago ${p._id}`}
            aria-checked={selectedIds.has(p._id)}
            checked={selectedIds.has(p._id)}
            onChange={(e) => toggleOne(p._id, e.target.checked)}
            disabled={isAnulado(p)}
          />
        ),
        info: (
          <div className={`grid place-items-center  ${gray} `}>
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
        status: (
          <span>
            <StatusPill status={p.status} />
          </span>
        ),
        total: currencyFmt.format(p.totals?.values_raw ?? 0),
        notes: p.comments ?? "",
      };
    }) ?? [];

  const allSelected =
    visibleItems.length > 0 &&
    visibleItems.every((p) => selectedIds.has(p._id));

  const someSelected =
    !allSelected && visibleItems.some((p) => selectedIds.has(p._id));

  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const tableHeader = [
    {
      component: (
        <input
          ref={selectAllRef}
          type="checkbox"
          aria-label="Seleccionar todos"
          checked={allSelected}
          onChange={(e) => toggleAll(e.target.checked)}
        />
      ),
      key: "select",
      important: true,
    },
    { component: <FaEye className="text-center text-xl" />, key: "info" },
    { name: t("customer"), key: "customer" },
    { name: t("seller") || "Vendedor", key: "seller" },
    { name: t("date"), key: "date" },
    { name: t("documents"), key: "documents", important: true },
    { name: t("imputed"), key: "imputed" },
    { name: t("rendido"), key: "rendido", important: true },
    { name: t("status"), key: "status", important: true },
    { name: t("total"), key: "total", important: true },
    { name: t("notes"), key: "notes" },
  ];

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);
  // ===================== Header (filtros/acciones) =====================
  const sellerOptions = React.useMemo(() => {
    const raw = Array.isArray(usersData) ? usersData : [];
    return raw
      .filter((s) => !!s?.seller_id) // solo los que tienen seller_id truthy
      .map((s) => ({
        id: String(s.seller_id),
        name: s.username ?? String(s.seller_id),
      }));
  }, [usersData]);

  useEffect(() => {
    if (isSellerRole) {
      // no usamos sellerFilter manual en este caso
      setSellerFilter("");
    }
  }, [isSellerRole]);

  useEffect(() => {
    // al cambiar de cliente, limpiamos el filtro manual de vendedor (si no sos VENDEDOR)
    if (!isSellerRole) setSellerFilter("");
  }, [selectedClientId, isSellerRole]);

  // === Helpers para habilitar el botón diario (ADMIN + 1 día + 1 vendedor) ===
  const isAdmin = (userData?.role || "").toUpperCase() === "ADMINISTRADOR";
  const isSingleDaySelected = useMemo(() => {
    if (!searchParams.startDate || !searchParams.endDate) return false;
    const a = format(searchParams.startDate, "yyyy-MM-dd");
    const b = format(searchParams.endDate, "yyyy-MM-dd");
    return a === b;
  }, [searchParams.startDate, searchParams.endDate]);

  const canDownloadDaily =
    isAdmin && isSingleDaySelected && Boolean(sellerFilter);

  // === Traer TODAS las páginas del filtro actual (día + vendedor) y generar PDF ===
  const handleDownloadDailyForCurrentFilters = async () => {
    try {
      if (!canDownloadDaily) {
        alert("Faltan filtros: día único y vendedor (y rol ADMIN).");
        return;
      }

      // Fechas yyyy-MM-dd ya usadas en loadItems
      const startDate = searchParams.startDate
        ? startOfDay(searchParams.startDate).toISOString()
        : undefined;
      const endDate = searchParams.endDate
        ? endOfDay(searchParams.endDate).toISOString()
        : undefined;

      // Construir args base (igual que en loadItems) pero independiente del estado de página
      const baseArgs: any = {
        page: 1,
        limit: ITEMS_PER_PAGE,
        startDate,
        endDate,
        sort: sortQuery,
        includeLookup: false,
        seller_id: sellerFilter, // admin elige vendedor explícito
      };

      // Paginar hasta traer todo
      const all: Payment[] = [];
      let curPage = 1;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const res = await fetchPayments({
          ...baseArgs,
          page: curPage,
        }).unwrap();
        const chunk: Payment[] = res?.payments ?? [];
        if (!chunk.length) break;
        all.push(...chunk);
        if (chunk.length < ITEMS_PER_PAGE) break;
        curPage++;
      }

      if (!all.length) {
        alert("No hay pagos para ese día y vendedor.");
        return;
      }

      // Carpeta por fecha/vendedor para mantener ordenado
      const folder = `rendiciones/diarias/${sellerFilter}/${format(
        searchParams.startDate!,
        "yyyyMMdd"
      )}`;

      await downloadPDFFor(all, {
        uploadPdf: (file, f) => uploadPdf({ file, folder: f }).unwrap(),
        updatePayment: (id, body) => updatePayment({ id, data: body }).unwrap(),
        folder,
        alsoDownload: true, // baja local además de subir
      });
    } catch (e) {
      console.error(e);
      alert("No se pudo generar el PDF diario.");
    }
  };

  const headerFilters: Array<{ content: React.ReactNode }> = [
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
          isClearable
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
          isClearable
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
        <select
          value={
            isSellerRole ? String(userData?.seller_id ?? "") : sellerFilter
          }
          onChange={(e) => {
            // bloquear para SELLER y CUSTOMER
            if (isSellerRole || isCustomerRole) return;

            setSellerFilter(e.target.value);
            setPage(1);
            setItems([]);
            setHasMore(true);
          }}
          disabled={isSellersLoading || isSellerRole || isCustomerRole}
          className="border border-gray-300 rounded p-2 text-sm min-w-[220px]"
          title={t("seller") || "Vendedor"}
        >
          <option value="">{t("allSellers") || "Todos los vendedores"}</option>
          {sellerOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      ),
    },
    {
      content: (
        <select
          value={rendidoFilter}
          onChange={(e) =>
            setRendidoFilter(e.target.value as "" | "true" | "false")
          }
          className="border border-gray-300 rounded p-2 text-sm min-w-[160px]"
          title="Estado de rendición"
        >
          <option value="">Todos</option>
          <option value="true">Rendidos</option>
          <option value="false">No Rendidos</option>
        </select>
      ),
    },
    {
      content: (
        <button
          type="button"
          onClick={() => setShowAnulados((s) => !s)}
          className={`px-3 py-2 rounded text-white ${
            showAnulados
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-zinc-700 hover:bg-zinc-800"
          }`}
          title={showAnulados ? "Ocultar anulados" : "Mostrar anulados"}
        >
          {showAnulados ? "Ocultar Anulados" : "Mostrar Anulados"}
        </button>
      ),
    },
  ];

  // 👉 Botón "Rendir": solo si NO es CUSTOMER
  if (!isCustomerRole) {
    headerFilters.push({
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
    });
  }

  // 👉 Botón "PDF diario (vendedor)": SOLO ADMINISTRADOR
  if (isAdmin) {
    headerFilters.push({
      content: (
        <button
          key="pdf-diario"
          onClick={handleDownloadDailyForCurrentFilters}
          disabled={!canDownloadDaily || isRindiendo}
          className={`px-3 py-2 rounded text-white ${
            !canDownloadDaily || isRindiendo
              ? "bg-zinc-300 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
          title={
            canDownloadDaily
              ? "Descargar PDF diario del vendedor"
              : !isAdmin
              ? "Requiere rol ADMIN"
              : !isSingleDaySelected
              ? "Seleccioná el mismo día en ambos campos"
              : "Elegí un vendedor o mostrás solo un vendedor en la lista"
          }
        >
          PDF diario (vendedor)
        </button>
      ),
    });
  }

  // Botón mobile de seleccionar visibles (lo dejamos para todos menos si no hay items)
  headerFilters.push({
    content: (
      <button
        onClick={() => toggleAll(!allSelected)}
        disabled={visibleItems.length === 0}
        className={`sm:hidden px-3 py-2 rounded text-white text-sm ${
          visibleItems.length === 0
            ? "bg-zinc-300 cursor-not-allowed"
            : "bg-zinc-800 hover:bg-zinc-900"
        }`}
      >
        {allSelected ? "Deseleccionar visibles" : "Seleccionar visibles"}
      </button>
    ),
  });

  const headerBody = {
    buttons: [],
    filters: headerFilters,
    results: `${data?.total ?? 0} ${t("page.header.results")}`,
  };

  useEffect(() => {
    if (showAnulados) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const p of items) {
        if (isAnulado(p)) next.delete((p as any)._id);
      }
      return next;
    });
  }, [showAnulados, items]);


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
      <div className="gap-4 z-50">
        <h3 className="font-bold p-4 text-white">
          {t("chargedPayments") || "Pagos cobrados"}
        </h3>
        <Header headerBody={headerBody} />

        <MethodTotalsBar
          totals={methodTotals}
          grandTotal={grandTotal}
          format={(n) => currencyFmt.format(n)}
          onSelectMethod={(m) => setMethodFilter(m as any)}
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
          onAnnul={() => onAnnulPayment(selected)}
          isToggling={isToggling || togglingId === selected._id}
          t={t}
          isAdmin={isAdmin}
          isSeller={isSeller}
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
  payment: any;
  onClose: () => void;
  onUnmark: () => void;
  onAnnul: () => void; // ⬅️ nuevo
  isToggling: boolean;
  t: (key: string) => string;
  isAdmin: boolean; // ⬅️ nuevo
  isSeller: boolean;
};



/* ───────────── Subcomponentes internos (sin libs externas) ───────────── */


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
                  title={`${pretty(m)}: ${format(val)} (${pct.toFixed(2)}%)`}
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
                aria-label={`${pretty(m)} ${format(val)} (${pct.toFixed(2)}%)`}
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
                        · {pct.toFixed(2)}%
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
