"use client";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { IoPricetagOutline } from "react-icons/io5";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";

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
  const normalizePriority = (priority?: string): string => {
    const p = priority?.toUpperCase();
    if (p === "HIGH" || p === "ALTA") return "ALTA";
    if (p === "MEDIUM" || p === "MEDIA") return "MEDIA";
    if (p === "LOW" || p === "BAJA") return "BAJA";
    return "MEDIA";
  };

  const priority = normalizePriority(instances.priority);

  // Función para determinar el color según el tipo
  const getTypeColor = (type?: string): string => {
    const types: { [key: string]: string } = {
      "llamada de cobranza": "bg-red-500",
      llamada: "bg-red-500",
      "mensaje de whatsapp": "bg-green-500",
      whatsapp: "bg-green-500",
      "envío de resumen de cuenta": "bg-green-500",
      email: "bg-blue-500",
      "reclamo de pago": "bg-yellow-500",
      visita: "bg-yellow-500",
      default: "bg-purple-500",
    };
    return types[type?.toLowerCase() || ""] || types.default;
  };

  // Función para formatear la fecha
  const formatDate = (date?: string | Date): string => {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const typeColor = getTypeColor(instances?.type);
  const displayDate = formatDate(instances?.date || instances?.created_at || instances?.createdAt);
  const displayNote = instances?.notes || instances?.description || instances?.note || t("noNotes");
  const displayTitle = instances?.title || instances?.type || t("instance");

  // Obtener el color del texto de prioridad
  const getPriorityTextColor = (p: string): string => {
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
        <h3 className="font-bold text-white text-base">
          {displayTitle}
        </h3>
      </div>

      {/* Body */}
      <div className="p-6 space-y-3">
        {/* Prioridad */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">PRIORIDAD:</span>
          <span className={`text-sm font-bold uppercase ${getPriorityTextColor(priority)}`}>
            {priority}
          </span>
        </div>

        {/* Fecha */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">FECHA:</span>
          <span className="text-gray-300 text-sm">
            {displayDate}
          </span>
        </div>

        {/* Nota */}
        <div className="flex items-start gap-2">
          <span className="font-bold text-white text-sm flex-shrink-0">NOTA:</span>
          <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
            {displayNote}
          </p>
        </div>

        {/* Estado (opcional) */}
        {instances.status && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
            <span className="font-bold text-white text-sm">ESTADO:</span>
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