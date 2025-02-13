import { ChevronDown } from "lucide-react";
import React, { useState } from "react";
import { AiFillCaretDown } from "react-icons/ai";

interface TableHeader {
  name?: string;
  key: string;
  component?: React.ReactNode;
  important?: boolean;
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
  const validData = Array.isArray(rawData) ? rawData : [];
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const renderMobileRow = (row: any, index: number) => {
    const isExpanded = expandedRow === index;

    return (
      <div key={row.key || index} className="border-b border-gray-200 bg-white p-3 rounded-lg shadow-sm">
        {/* 📌 Key destacada arriba */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-primary font-bold bg-gray-100 px-2 py-1 rounded-md border-l-4 border-primary text-xs">
            {row.key}
          </span>
        </div>

        {/* 📌 Fila principal en móviles (Nombre: Valor) */}
        <div
          className="p-2 cursor-pointer hover:bg-gray-100 rounded-md"
          onClick={() => setExpandedRow(isExpanded ? null : index)}
        >
          <div className="grid grid-cols-2 gap-2 w-full">
            {headers
              .filter((h) => h.important)
              .map((header) => (
                <div key={header.key} className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-600">{header.name}:</span>
                  <span className="text-sm text-gray-800">{row[header.key] || "N/A"}</span>
                </div>
              ))}
          </div>
        </div>

        {/* 📌 Contenido expandible en móviles */}
        {isExpanded && (
          <div className="p-3 bg-gray-50 rounded-b-md mt-2">
            <div className="grid grid-cols-2 gap-4">
              {headers.map((header) => (
                <div key={header.key} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">{header.name}:</span>
                  <span className="text-gray-600">{row[header.key] || "N/A"}</span>
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
      <thead className="bg-primary sticky top-0 z-10">
        <tr>
          {headers.map((header) => {
            const isCurrentSort = sortField === header.key;
            const iconRotation = isCurrentSort && sortOrder === "asc" ? "rotate-180" : "";

            return (
              <th
                key={header.key}
                className="px-3 py-2 text-xs md:text-[13px] font-medium text-white uppercase tracking-wider text-center"
              >
                <div
                  className="flex justify-center items-center cursor-pointer select-none"
                  onClick={() => onSort?.(header.key)}
                >
                  {header.component || header.name}
                  <AiFillCaretDown className={`text-xs ml-1 transition-transform ${iconRotation}`} />
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {validData.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="px-3 py-2 text-center text-gray-500 text-sm">
              No se encontraron datos
            </td>
          </tr>
        ) : (
          validData.map((row: any, index: number) => (
            <tr key={row.key || index} className="hover:bg-gray-50">
              {headers.map((header, i) => (
                <td key={i} className="px-3 py-1.5 text-xs md:text-[13px] text-gray-600 border-x border-gray-100 text-center">
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
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 mx-2 md:mx-4">
      <div className="w-full">
        {/* 📌 Tabla en móviles con formato "Nombre: Valor" */}
        <div className="md:hidden">{validData.map((row, index) => renderMobileRow(row, index))}</div>

        {/* 📌 Tabla en desktop */}
        <div className="hidden md:block overflow-x-auto">{renderDesktopTable()}</div>
      </div>
    </div>
  );
}
