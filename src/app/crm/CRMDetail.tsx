import React from "react";
import { FaTimes, FaFileInvoice } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useGetOrderByIdQuery } from "@/redux/services/ordersApi";

interface CRMDetailProps {
  data: any;
  onClose: () => void;
}

const CRMDetail: React.FC<CRMDetailProps> = ({ data, onClose }) => {
  const { t } = useTranslation();

  // Si hay un order_id definido y no es vacío, hacemos lookup para traer toda la info de la orden.
  const shouldLookupOrder = data.order_id && data.order_id.trim() !== "";
  const { data: orderData } = useGetOrderByIdQuery(
    { id: data.order_id },
    { skip: !shouldLookupOrder }
  );

  // Formatea un número a ARS con fallback a '-'
  function formatPriceWithCurrency(value: number | string): string {
    const number = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(number)) {
      return "-";
    }
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(number)
      .replace("ARS", "")
      .trim();
  }

  // Traducciones para Tipo y Estado (usando tus enums)
  const translateType = (type?: string) => {
    if (!type) return "";
    const map: Record<string, string> = {
      COLLECTION: t("crmd.type.collection"),
      ORDER: t("crmd.type.order"),
      VISIT: t("crmd.type.visit"),
      EMAIL: t("crmd.type.email"),
      CALL: t("crmd.type.call"),
      MESSAGE: t("crmd.type.message"),
      RECLAIM: t("crmd.type.reclaim"),
    };
    return map[type] ?? type;
  };

  const translateStatus = (status?: string) => {
    if (!status) return "";
    const normalized = status.toUpperCase();
    const map: Record<string, string> = {
      PENDING: t("crmd.status.pending"),
      SENDED: t("crmd.status.sended"),
      AUTHORIZED: t("crmd.status.authorized"),
      CHARGED: t("crmd.status.charged"),
      CANCELED: t("crmd.status.canceled"),
    };
    return map[normalized] ?? status;
  };

  // Color del estado (ahora pensado para los enums)
  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status.toUpperCase()) {
      case "AUTHORIZED":
      case "CHARGED":
        return "bg-green-100 text-green-800";
      case "PENDING":
      case "SENDED":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // 🔹 Parseo especial de notas para VISIT
  const parseVisitNotes = (notes: string): string[][] => {
    if (!notes) return [];
    // Separar por " | "
    const blocks = notes
      .split("|")
      .map((b) => b.trim())
      .filter(Boolean);
    // Cada bloque se separa por " > "
    return blocks.map((block) =>
      block
        .split(">")
        .map((p) => p.trim())
        .filter(Boolean)
    );
  };

  const renderNotesBlock = () => {
    if (!data.notes) return null;

    // Si es VISIT, mostramos las notas más acomodadas
    if (data.type === "VISIT") {
      const parsed = parseVisitNotes(data.notes);

      if (!parsed.length) return null;

      return (
        <div className="mb-6 bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-500 mb-2">{t("notes")}</p>
          <ul className="space-y-1">
            {parsed.map((parts, idx) => (
              <li key={idx} className="flex items-start text-sm text-gray-700">
                <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>
                  {parts[0] && (
                    <span className="font-semibold">{parts[0]}</span>
                  )}
                  {parts.length > 1 && (
                    <span className="text-gray-600">
                      {" "}
                      › {parts.slice(1).join(" › ")}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // Resto de tipos: notas normales
    return (
      <div className="mb-6 bg-gray-50 p-3 rounded-md">
        <p className="text-sm text-gray-500 mb-1">{t("notes")}</p>
        <p className="text-gray-700 whitespace-pre-line">{data.notes}</p>
      </div>
    );
  };

  // 🔸 VISTA SIMPLE: COLLECTION / VISIT / RECLAIM
  if (["COLLECTION", "VISIT", "RECLAIM"].includes(data.type)) {
    return (
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            {t("crmDetailTitle")}- {data._id?.$oid || data._id || "Sin ID"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-200"
            aria-label="Cerrar"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* Estado */}
          {data.status && (
            <div className="mb-4">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  data.status
                )}`}
              >
                {translateStatus(data.status)}
              </span>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-500">{t("type")}</p>
            <p className="font-medium">{translateType(data.type)}</p>
          </div>

          {/* Fecha */}
          <div className="mb-4">
            <p className="text-sm text-gray-500">{t("date")}</p>
            <p className="font-medium">
              {data.date
                ? new Date(data.date.$date || data.date).toLocaleString(
                    "es-ES",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }
                  )
                : t("notAvailable")}
            </p>
          </div>

          {/* Notas (con formato especial si es VISIT) */}
          {renderNotesBlock()}

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md transition-colors shadow-sm font-medium"
            >
              {t("close")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🔸 VISTA ORDER (detalle de pedido)
  const orderInfo = shouldLookupOrder && orderData ? orderData : data;

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-auto overflow-hidden max-h-[90vh] flex flex-col">
      {/* Header con botón de cerrar */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <FaFileInvoice className="mr-2 text-blue-600" />
          {t("crmDetailTitle")} {data.number ? `- ${data.number}` : ""}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-200"
          aria-label="Cerrar"
        >
          <FaTimes className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {/* Estado */}
        {orderInfo.status && (
          <div className="mb-4">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                orderInfo.status
              )}`}
            >
              {translateStatus(orderInfo.status)}
            </span>
          </div>
        )}

        {/* Datos clave */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="mb-4">
              <p className="text-sm text-gray-500">{t("type")}</p>
              <p className="font-medium">{translateType(data.type)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cliente</p>
              <p className="font-medium">
                {orderInfo.customer?.id || "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Vendedor</p>
              <p className="font-medium">
                {orderInfo.seller?.id || "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cond. de pago</p>
              <p className="font-medium">
                {orderInfo.payment_condition?.id || "No especificada"}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">{t("date")}</p>
              <p className="font-medium">
                {orderInfo.date
                  ? new Date(
                      orderInfo.date.$date || orderInfo.date
                    ).toLocaleString("es-AR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : t("notAvailable")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-medium text-lg text-green-700">
                {formatPriceWithCurrency(orderInfo.total)}
              </p>
            </div>
          </div>
        </div>

        {/* Notas de la orden (sin formato especial) */}
        {orderInfo.notes ? (
          <div className="mb-6 bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500 mb-1">{t("notes")}</p>
            <p className="text-gray-700 whitespace-pre-line">
              {orderInfo.notes}
            </p>
          </div>
        ) : null}

        {/* Detalles del pedido */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-200">
            Detalles del pedido
          </h3>

          {orderInfo.details?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2">Artículo</th>
                    <th className="px-4 py-2">Cantidad</th>
                    <th className="px-4 py-2">Precio uni.</th>
                    <th className="px-4 py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orderInfo.details.map((detail: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {detail.article?.id || detail.id || "-"}
                      </td>
                      <td className="px-4 py-3">{detail.quantity}</td>
                      <td className="px-4 py-3">
                        {formatPriceWithCurrency(detail.netprice)}
                      </td>
                      <td className="px-4 py-3">
                        {formatPriceWithCurrency(detail.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No hay detalles disponibles.</p>
          )}
        </div>

        {/* Cerrar */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md shadow-sm transition-colors font-medium"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CRMDetail;
