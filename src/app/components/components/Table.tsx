import React, { useState } from "react";
import { AiFillCaretDown } from "react-icons/ai";
import { useTranslation } from "react-i18next";

interface TableHeader {
  name?: string;
  key: string;
  component?: React.ReactNode;
  important?: boolean;
  sortable?: boolean;
}

interface TableProps {
  headers: TableHeader[];
  data: any;
  onSort?: (field: string) => void;
  sortField?: string;
  sortOrder?: "asc" | "desc" | "";
}

export default function Table({
  headers,
  data: rawData,
  sortField,
  sortOrder,
  onSort,
}: TableProps) {
  const { t } = useTranslation();
  const validData = Array.isArray(rawData) ? rawData : [];
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const labelOf = (h: TableHeader) => h.name ?? h.key;

  const renderMobileRow = (row: any, index: number) => {
    const isExpanded = expandedRow === index;
    const importantHeaders = headers.filter((h) => h.important);
    // fallback: si nadie marcó important, usamos las 2 primeras columnas con name
    const fallback = headers.slice(0, 2);
    const primary = importantHeaders.length ? importantHeaders : fallback;

    const toggle = () =>
      setExpandedRow((cur) => (cur === index ? null : index));

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    };

    return (
      <div
        key={row.key ?? index}
        className="rounded-2xl border border-zinc-200 bg-white shadow-sm ring-1 ring-black/5 mb-3 overflow-hidden"
      >
        {/* Header de la card */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-zinc-100 bg-gradient-to-br from-zinc-50 to-white">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary tabular-nums">
            {row.key ?? t("na")}
          </span>

          {/* “chips” con los campos importantes */}
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[11px] text-zinc-500">
              {t("tapToExpand") || "Tocar para ver más"}
            </span>
          </div>
        </div>

        {/* Cuerpo colapsado: solo importantes */}
        <div
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={onKeyDown}
          className="px-3 py-2 active:scale-[0.99] transition"
          aria-expanded={isExpanded}
          aria-label={t("expandRow") || "Expandir fila"}
        >
          <div className="grid grid-cols-1 gap-2">
            {primary.map((header) => (
              <div
                key={header.key}
                className="flex items-start justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2"
              >
                <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  {labelOf(header)}
                </span>
                <span
                  className="max-w-[60%] text-sm text-zinc-900 truncate"
                  title={
                    typeof row[header.key] === "string"
                      ? row[header.key]
                      : undefined
                  }
                >
                  {/* soporta ReactNode */}
                  {row[header.key] ?? t("na")}
                </span>
              </div>
            ))}
          </div>

          {/* caret */}
          <div className="mt-2 flex items-center justify-center">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm">
              <AiFillCaretDown
                className={`text-zinc-500 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </span>
          </div>
        </div>

        {/* Expandible: todos los campos, en dos columnas responsivas */}
        {isExpanded && (
          <div className="px-3 pb-3">
            <div className="mt-1 grid grid-cols-1 xs:grid-cols-2 gap-2">
              {headers.map((header) => (
                <div
                  key={`exp-${header.key}`}
                  className="rounded-lg border border-zinc-100 bg-white px-3 py-2"
                >
                  <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    {labelOf(header)}
                  </div>
                  <div
                    className="mt-0.5 text-sm text-zinc-900 break-words"
                    title={
                      typeof row[header.key] === "string"
                        ? row[header.key]
                        : undefined
                    }
                  >
                    {row[header.key] ?? t("na")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDesktopTable = () => (
    <table className="min-w-full table-auto lg:table-fixed divide-y divide-gray-200">
      <thead className="bg-table sticky top-0 z-10">
        <tr>
          {headers.map((header) => {
            const isCurrentSort = sortField === header.key;
            const iconRotation =
              isCurrentSort && sortOrder === "asc" ? "rotate-180" : "";

            if (header.sortable) {
              return (
                <th
                  key={header.key}
                  className="px-3 py-2 text-xs font-medium text-white uppercase tracking-wider text-center"
                >
                  <div
                    className="flex justify-center items-center cursor-pointer select-none"
                    onClick={() => onSort?.(header.key)}
                  >
                    {header.component || header.name}
                    <AiFillCaretDown
                      className={`text-xs ml-1 transition-transform ${iconRotation}`}
                    />
                  </div>
                </th>
              );
            }

            return (
              <th
                key={header.key}
                className="px-3 py-2 text-xs font-medium text-white uppercase tracking-wider text-center"
              >
                <div className="flex justify-center items-center select-none">
                  {header.component || header.name}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {validData.length === 0 ? (
          <tr>
            <td
              colSpan={headers.length}
              className="px-3 py-2 text-center text-gray-500 text-xs"
            >
              {t("noDataFound")}
            </td>
          </tr>
        ) : (
          validData.map((row: any, index: number) => (
            <tr key={row.key || index} className="hover:bg-gray-50">
              {headers.map((header, i) => (
                <td
                  key={i}
                  className="px-3 py-1.5 text-xs text-gray-600 border-x border-gray-100 text-center"
                >
                  {row[header.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 mx-2 md:mx-4">
      <div className="w-full">
        {/* Mobile (cards) */}
        <div className="md:hidden p-2">
          {validData.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center text-sm text-zinc-500">
              {t("noDataFound")}
            </div>
          ) : (
            validData.map((row, index) => renderMobileRow(row, index))
          )}
        </div>

        {/* Desktop (tabla) */}
        <div className="hidden md:block overflow-x-auto">
          {renderDesktopTable()}
        </div>
      </div>
    </div>
  );
}
