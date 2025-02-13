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
      <div key={row.key || index} className="border-b border-gray-200">
        <div
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
          onClick={() => setExpandedRow(isExpanded ? null : index)}
        >
          <div className="flex gap-4 z-10 text-sm md:text-[13px]">
            {headers.filter((h) => h.important).map((header) => (
              <div key={header.key} className="text-gray-600">
                {row[header.key]}
              </div>
            ))}
          </div>
          <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </div>

        {isExpanded && (
          <div className="p-3 bg-gray-50">
            <div className="grid gap-2">
              {headers.map((header) => (
                <div key={header.key} className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{header.name}:</span>
                  <span className="text-gray-600">{row[header.key]}</span>
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
        {/* Muestra la tabla expandible en móviles y `md` */}
        <div className="md:block lg:hidden">{validData.map((row, index) => renderMobileRow(row, index))}</div>

        {/* Muestra la tabla normal solo en `lg` */}
        <div className="hidden lg:block overflow-x-auto">{renderDesktopTable()}</div>
      </div>
    </div>
  );
}
