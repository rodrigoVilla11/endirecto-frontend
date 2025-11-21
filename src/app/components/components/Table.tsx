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
        className="rounded-2xl border border-purple-100 bg-white shadow-md hover:shadow-lg transition-all duration-300 mb-4 overflow-hidden"
      >
        {/* Header de la card con gradiente */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-purple-100 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50">
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-red-500 via-white to-blue-500 px-3 py-1 text-xs font-bold text-black shadow-sm">
            {row.key ?? t("na")}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-600 font-medium">
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
          className="px-4 py-3 active:scale-[0.99] transition cursor-pointer"
          aria-expanded={isExpanded}
          aria-label={t("expandRow") || "Expandir fila"}
        >
          <div className="grid grid-cols-1 gap-3">
            {primary.map((header) => (
              <div
                key={header.key}
                className="flex items-start justify-between gap-3 rounded-xl bg-gradient-to-r from-pink-50/50 via-purple-50/50 to-blue-50/50 px-4 py-3 border border-purple-100"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                  {labelOf(header)}
                </span>
                <span
                  className="max-w-[60%] text-sm font-medium text-gray-900 truncate"
                  title={
                    typeof row[header.key] === "string"
                      ? row[header.key]
                      : undefined
                  }
                >
                  {row[header.key] ?? t("na")}
                </span>
              </div>
            ))}
          </div>

          {/* caret con gradiente */}
          <div className="mt-3 flex items-center justify-center">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-red-500 via-white to-blue-500 shadow-md">
              <AiFillCaretDown
                className={`text-black text-sm transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </span>
          </div>
        </div>

        {/* Expandible: todos los campos */}
        {isExpanded && (
          <div className="px-4 pb-4 bg-gray-50">
            <div className="mt-2 grid grid-cols-1 xs:grid-cols-2 gap-3">
              {headers.map((header) => (
                <div
                  key={`exp-${header.key}`}
                  className="rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
                    {labelOf(header)}
                  </div>
                  <div
                    className="text-sm font-medium text-gray-900 break-words"
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
    <table className="min-w-full table-auto lg:table-fixed">
      <thead className="bg-gradient-to-r from-red-500 via-white to-blue-500 sticky top-0 z-10">
        <tr>
          {headers.map((header) => {
            const isCurrentSort = sortField === header.key;
            const iconRotation =
              isCurrentSort && sortOrder === "asc" ? "rotate-180" : "";

            if (header.sortable) {
              return (
                <th
                  key={header.key}
                  className="px-4 py-4 text-xs font-bold text-black uppercase tracking-wider text-center"
                >
                  <div
                    className="flex justify-center items-center cursor-pointer select-none hover:opacity-80 transition-opacity"
                    onClick={() => onSort?.(header.key)}
                  >
                    {header.component || header.name}
                    <AiFillCaretDown
                      className={`text-sm ml-2 transition-transform ${iconRotation}`}
                    />
                  </div>
                </th>
              );
            }

            return (
              <th
                key={header.key}
                className="px-4 py-4 text-xs font-bold text-black uppercase tracking-wider text-center"
              >
                <div className="flex justify-center items-center select-none">
                  {header.component || header.name}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-purple-100">
        {validData.length === 0 ? (
          <tr>
            <td
              colSpan={headers.length}
              className="px-4 py-8 text-center text-gray-500 text-sm"
            >
              {t("noDataFound")}
            </td>
          </tr>
        ) : (
          validData.map((row: any, index: number) => (
            <tr 
              key={row.key || index} 
              className="hover:bg-gradient-to-r hover:from-pink-50/30 hover:via-purple-50/30 hover:to-blue-50/30 transition-all duration-200"
            >
              {headers.map((header, i) => (
                <td
                  key={i}
                  className="px-4 py-3 text-xs font-medium text-gray-700 border-x border-purple-50 text-center"
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
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-purple-100 mx-2 md:mx-4">
      <div className="w-full">
        {/* Mobile (cards) */}
        <div className="md:hidden p-3">
          {validData.length === 0 ? (
            <div className="rounded-2xl border border-purple-100 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 p-6 text-center text-sm font-medium text-gray-600">
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