"use client";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { IoPricetagOutline } from "react-icons/io5";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";

type Priority = "HIGH" | "MEDIUM" | "LOW" | string;

interface InstanceModel {
  id?: string;
  _id?: string;
  type?: string;
  notes?: string;
  priority?: Priority;
  status?: string;
  created_at?: string | Date;
  createdAt?: string | Date;
}

interface InstanceProps {
  instances: InstanceModel;
}

const priorityStyles: Record<Priority, { dot: string; border: string; badge: string; text: string }> = {
  HIGH: {
    dot: "bg-red-500",
    border: "border-red-400",
    badge: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
    text: "text-red-700",
  },
  MEDIUM: {
    dot: "bg-amber-500",
    border: "border-amber-400",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    text: "text-amber-700",
  },
  LOW: {
    dot: "bg-emerald-500",
    border: "border-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    text: "text-emerald-700",
  },
};

const Instance: React.FC<InstanceProps> = ({ instances }) => {
  const { t } = useTranslation();

  const p = (instances.priority ?? "LOW") as Priority;
  const styles = priorityStyles[p] ?? priorityStyles.LOW;

  const created = useMemo(() => {
    const raw = (instances.created_at ?? instances.createdAt) as string | Date | undefined;
    if (!raw) return null;
    const date = new Date(raw);
    if (isNaN(date.getTime())) return null;
    // Render corto y claro; si querés, podés internacionalizarlo según locale
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }, [instances.created_at, instances.createdAt]);

  return (
    <article
      className={`group relative rounded-xl border ${styles.border} bg-white shadow-sm hover:shadow-md transition-shadow`}
      role="listitem"
      aria-label={t("instance") as string}
    >
      {/* Borde lateral de prioridad */}
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${styles.dot}`}
        aria-hidden="true"
      />

      <div className="px-4 py-3 md:px-5 md:py-4">
        {/* Header: título + badges */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <HiOutlineClipboardDocumentList className="text-gray-400" />
            <h3 className="truncate font-semibold text-gray-900">
              {t("instance")}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Prioridad */}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}
              title={`${t("priority")}: ${p}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
              {t(`priority.${p.toLowerCase?.() ?? "low"}`, p)}
            </span>

            {/* Tipo */}
            {instances.type && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200"
                title={`${t("type")}: ${instances.type}`}
              >
                <IoPricetagOutline />
                {instances.type}
              </span>
            )}
          </div>
        </header>

        {/* Notas */}
        <div className="mt-2 text-sm text-gray-700">
          <p
            className="line-clamp-2 md:line-clamp-3"
            title={instances.notes || ""}
          >
            <span className="font-medium text-gray-900">{t("notes")}:</span>{" "}
            {instances.notes || t("none")}
          </p>
        </div>

        {/* Footer: metadata */}
        <footer className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {instances.status && (
              <span className="rounded-md bg-gray-50 px-2 py-0.5 ring-1 ring-inset ring-gray-200">
                {t("status")}: <span className="font-medium">{instances.status}</span>
              </span>
            )}
            {created && (
              <span className="rounded-md bg-gray-50 px-2 py-0.5 ring-1 ring-inset ring-gray-200">
                {t("createdAt")}: <time dateTime={created}>{created}</time>
              </span>
            )}
          </div>

          {/* Acciones (placeholder para futuros handlers) */}
          <div className="invisible gap-2 group-hover:visible">
            {/* Ejemplo: botones fantasma para mantener el layout preparado */}
            {/* <button className="text-gray-600 hover:text-gray-900 underline text-xs">{t("view")}</button>
            <button className="text-gray-600 hover:text-gray-900 underline text-xs">{t("edit")}</button> */}
          </div>
        </footer>
      </div>
    </article>
  );
};

export default Instance;
