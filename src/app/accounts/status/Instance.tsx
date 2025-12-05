"use client";
import React from "react";
import { useTranslation } from "react-i18next";

type Priority = "ALTA" | "MEDIA" | "BAJA" | "HIGH" | "MEDIUM" | "LOW" | string;

interface InstanceModel {
  id?: string;
  _id?: string;
  type?: string;
  title?: string;
  notes?: string;
  description?: string;
  note?: string;
  priority?: Priority;
  status?: string;
  date?: string | Date;
  created_at?: string | Date;
  createdAt?: string | Date;
}

interface InstanceProps {
  instances: InstanceModel;
}

const Instance: React.FC<InstanceProps> = ({ instances }) => {
  const { t } = useTranslation();

  // Normalizar prioridad
  const normalizePriority = (priority?: string): "ALTA" | "MEDIA" | "BAJA" => {
    const p = priority?.toUpperCase();
    if (p === "HIGH" || p === "ALTA") return "ALTA";
    if (p === "MEDIUM" || p === "MEDIA") return "MEDIA";
    if (p === "LOW" || p === "BAJA") return "BAJA";
    return "MEDIA";
  };

  const normalizedPriority = normalizePriority(instances.priority as string);

  // Texto para prioridad según idioma
  const getPriorityLabel = (p: "ALTA" | "MEDIA" | "BAJA") => {
    if (p === "ALTA") return t("crm.priorityHigh");
    if (p === "MEDIA") return t("crm.priorityMedium");
    return t("crm.priorityLow");
  };

  // Función para determinar el color según el tipo
  const getTypeColor = (type?: string): string => {
    const key = type?.toLowerCase() || "";
    const types: { [key: string]: string } = {
      "llamada de cobranza": "bg-red-500",
      llamada: "bg-red-500",
      call: "bg-red-500",
      "mensaje de whatsapp": "bg-green-500",
      whatsapp: "bg-green-500",
      "envío de resumen de cuenta": "bg-green-500",
      email: "bg-blue-500",
      "reclamo de pago": "bg-yellow-500",
      payment_claim: "bg-yellow-500",
      visita: "bg-yellow-500",
      visit: "bg-yellow-500",
    };
    return types[key] || "bg-purple-500";
  };

  // Función para formatear la fecha
  const formatDate = (date?: string | Date): string => {
    if (!date) return t("crm.noDate") || "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return t("crm.noDate") || "N/A";
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Devuelve la key de i18n según el enum que venga del back
  const getInstanceTitleKey = (inst: InstanceModel): string => {
    const raw = (inst.title || inst.type || "").toUpperCase().trim();

    if (!raw) return "crm.genericInstance";

    // WHATSAPP MESSAGE
    if (
      raw === "WHATSAPP MESSAGE" ||
      raw === "WHATSAPP_MESSAGE" ||
      raw.includes("WHATSAPP")
    ) {
      return "crm.whatsappMessage";
    }

    // COLLECTION CALL (llamada de cobranza)
    if (
      raw === "COLLECTION CALL" ||
      raw.includes("LLAMADA") ||
      raw.includes("CALL")
    ) {
      return "crm.collectionCall"; // o "crm.call", como prefieras
    }

    // SEND ACCOUNT SUMMARY (envío de resumen de cuenta)
    if (
      raw === "SEND ACCOUNT SUMMARY" ||
      raw.includes("ACCOUNT SUMMARY") ||
      raw.includes("RESUMEN DE CUENTA")
    ) {
      return "crm.sendAccountSummary";
    }

    // PAYMENT CLAIM (reclamo de pago)
    if (
      raw === "PAYMENT CLAIM" ||
      raw.includes("PAYMENT_CLAIM") ||
      raw.includes("RECLAMO")
    ) {
      return "crm.paymentClaim";
    }

    // Fallback
    return "crm.genericInstance";
  };

  const typeColor = getTypeColor(instances?.type);
  const displayDate = formatDate(
    instances?.date || instances?.created_at || instances?.createdAt
  );
  const displayNote =
    instances?.notes ||
    instances?.description ||
    instances?.note ||
    t("crm.noNotes");

  const displayTitle = t(getInstanceTitleKey(instances));

  // Obtener el color del texto de prioridad
  const getPriorityTextColor = (p: "ALTA" | "MEDIA" | "BAJA"): string => {
    if (p === "ALTA") return "text-red-400";
    if (p === "MEDIA") return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <article
      className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl"
      role="listitem"
    >
      {/* Header con color según tipo */}
      <div className={`${typeColor} px-6 py-3`}>
        <h3 className="font-bold text-white text-base truncate">
          {displayTitle}
        </h3>
      </div>

      {/* Body */}
      <div className="p-6 space-y-3">
        {/* Prioridad */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">
            {t("crm.priorityLabel")}:
          </span>
          <span
            className={`text-sm font-bold uppercase ${getPriorityTextColor(
              normalizedPriority
            )}`}
          >
            {getPriorityLabel(normalizedPriority)}
          </span>
        </div>

        {/* Fecha */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">
            {t("crm.dateLabel")}:
          </span>
          <span className="text-gray-300 text-sm">{displayDate}</span>
        </div>

        {/* Nota */}
        <div className="flex items-start gap-2">
          <span className="font-bold text-white text-sm flex-shrink-0">
            {t("crm.noteLabel")}:
          </span>
          <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
            {displayNote}
          </p>
        </div>

        {/* Estado (opcional) */}
        {instances.status && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
            <span className="font-bold text-white text-sm">
              {t("crm.statusLabel")}:
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-700 text-gray-300 border border-gray-600">
              {instances.status}
            </span>
          </div>
        )}
      </div>
    </article>
  );
};

export default Instance;
