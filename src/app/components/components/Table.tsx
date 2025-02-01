import React from "react";
import { AiFillCaretDown } from "react-icons/ai";

interface TableHeader {
  name?: string;
  key: string;
  component?: React.ReactNode;
}

interface TableProps {
  headers: TableHeader[];
  data: any;
  onSort?: (field: string) => void;
  sortField?: string;
  sortOrder?: "asc" | "desc" | "";
}

const Table: React.FC<TableProps> = ({
  headers,
  data,
  onSort,
  sortField,
  sortOrder,
}) => {
  const validData = Array.isArray(data) ? data : [];

  return (
    <div className="flex-grow m-2 md:m-5 bg-white flex flex-col text-xs md:text-sm shadow-lg rounded-lg overflow-hidden">
      <div className="w-full h-full overflow-x-auto">
        <table className="min-w-max w-full table-auto divide-y divide-gray-200">
          {/* Header */}
          <thead className="bg-primary sticky top-0 z-10">
            <tr>
              {headers.map((header) => {
                const isCurrentSort = sortField === header.key;
                const iconRotation =
                  isCurrentSort && sortOrder === "asc" ? "rotate-180" : "";

                return (
                  <th
                    key={header.key}
                    scope="col"
                    className="px-2 md:px-4 py-2 text-xs md:text-sm font-medium text-white uppercase tracking-wider border border-x-white text-center"
                  >
                    <div
                      className="flex justify-center items-center cursor-pointer select-none"
                      onClick={() => onSort?.(header.key)}
                    >
                      {header.component || header.name}
                      <AiFillCaretDown
                        className={`text-sm ml-1 transition-transform ${iconRotation}`}
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-white divide-y divide-gray-200 text-center">
            {validData.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-4 text-center text-gray-500"
                >
                  No se encontraron datos
                </td>
              </tr>
            ) : (
              validData.map((row: any, index: number) => (
                <tr key={row.key || index} className="hover:bg-gray-50">
                  {Object.keys(row).map((key, i) =>
                    key !== "key" ? (
                      <td
                        key={i}
                        className="px-2 md:px-4 py-2 text-xs md:text-sm text-gray-500 border border-gray-200 text-center break-words max-w-xs"
                      >
                        {row[key]}
                      </td>
                    ) : null
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
