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
        className="
      rounded-2xl
      border border-white/10
      bg-white/5 backdrop-blur
      shadow-xl hover:shadow-2xl
      transition-all duration-300
      mb-4 overflow-hidden
      hover:border-[#E10600]/40
    "
      >
        {/* Header de la card */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#0B0B0B]">
          <span className="inline-flex items-center rounded-full bg-[#E10600] px-3 py-1 text-xs font-extrabold text-white shadow-lg">
            {row.key ?? t("na")}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-white/60 font-medium">
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
                className="
              flex items-start justify-between gap-3
              rounded-xl
              bg-white/5
              px-4 py-3
              border border-white/10
              hover:bg-white/10
              transition-colors
            "
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  {labelOf(header)}
                </span>

                <span
                  className="max-w-[60%] text-sm font-semibold text-white truncate"
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

          {/* caret */}
          <div className="mt-3 flex items-center justify-center">
            <span
              className="
            inline-flex h-8 w-8 items-center justify-center rounded-full
            bg-white/10 border border-white/20
            shadow-lg
            hover:bg-[#E10600] hover:border-[#E10600]
            transition-all
          "
            >
              <AiFillCaretDown
                className={`text-white text-sm transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </span>
          </div>
        </div>

        {/* Expandible: todos los campos */}
        {isExpanded && (
          <div className="px-4 pb-4 bg-[#0B0B0B] border-t border-white/10">
            <div className="mt-4 grid grid-cols-1 xs:grid-cols-2 gap-3">
              {headers.map((header) => (
                <div
                  key={`exp-${header.key}`}
                  className="
                rounded-xl
                border border-white/10
                bg-white/5 backdrop-blur
                px-4 py-3
                shadow-lg hover:shadow-xl
                transition-all
                hover:border-[#E10600]/30
              "
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-1">
                    {labelOf(header)}
                  </div>

                  <div
                    className="text-sm font-medium text-white/85 break-words"
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

            {/* acento marca */}
            <div className="mt-4 h-0.5 w-16 bg-[#E10600] opacity-80 rounded-full" />
          </div>
        )}

        {/* firma abajo */}
        <div className="h-1 w-full bg-[#E10600] opacity-90" />
      </div>
    );
  };

  const renderDesktopTable = () => (
    <table className="min-w-full table-auto lg:table-fixed">
      <thead className="sticky top-0 z-10 bg-[#0B0B0B] border-b border-white/10">
        <tr>
          {headers.map((header) => {
            const isCurrentSort = sortField === header.key;
            const iconRotation =
              isCurrentSort && sortOrder === "asc" ? "rotate-180" : "";

            if (header.sortable) {
              return (
                <th
                  key={header.key}
                  className="px-4 py-4 text-xs font-extrabold text-white uppercase tracking-wider text-center"
                >
                  <div
                    className="
                    flex justify-center items-center gap-2
                    cursor-pointer select-none
                    hover:text-[#E10600]
                    transition-colors
                  "
                    onClick={() => onSort?.(header.key)}
                  >
                    {header.component || header.name}
                    <AiFillCaretDown
                      className={`text-sm transition-transform ${iconRotation}`}
                    />
                  </div>
                </th>
              );
            }

            return (
              <th
                key={header.key}
                className="px-4 py-4 text-xs font-extrabold text-white uppercase tracking-wider text-center"
              >
                <div className="flex justify-center items-center select-none">
                  {header.component || header.name}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>

      <tbody>
        {validData.length === 0 ? (
          <tr>
            <td
              colSpan={headers.length}
              className="px-4 py-10 text-center text-white/60 text-sm italic"
            >
              {t("noDataFound")}
            </td>
          </tr>
        ) : (
          validData.map((row: any, index: number) => (
            <tr
              key={row.key || index}
              className={`
              border-b border-white/10
              transition-colors
              ${index % 2 === 0 ? "bg-white/0" : "bg-white/5"}
              hover:bg-white/10
            `}
            >
              {headers.map((header, i) => (
                <td
                  key={i}
                  className="px-4 py-3 text-xs font-medium text-white/80 text-center"
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
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white/5 backdrop-blur mx-2 md:mx-4">
      <div className="w-full">
        {/* Mobile (cards) */}
        <div className="md:hidden p-3 space-y-3">
          {validData.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm font-medium text-white/60 italic">
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

      {/* Acento marca */}
      <div className="h-1 w-full bg-[#E10600] opacity-90" />
    </div>
  );
}
