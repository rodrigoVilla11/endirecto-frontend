"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useGetDocumentByIdQuery } from "@/redux/services/documentsApi";

export interface TableRow {
  id: string;
  startDate: string;
  endDate: string;
  amount: number;
  details?: {
    comprobante?: string;
    condicionPago?: string;
    importe?: number;
    descuento?: number;
    saldoAPagar?: number;
  };
}

export interface ExpandableTableProps {
  document_id: string;
  costumerInformation: any;
  onRowSelect?: (id: string, checked: boolean) => void;
  selectedRows?: string[];
}

export function DocumentsView({
  document_id,
  onRowSelect,
  selectedRows = [],
  costumerInformation
}: ExpandableTableProps) {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const { data, error, isLoading } = useGetDocumentByIdQuery({
    id: document_id,
  });
  const toggleRow = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR");
  };

  return (
    <div className="w-full space-y-2">
      {data && (
        <div key={data.id} className="bg-gray-900 rounded-lg overflow-hidden">
          {/* Main Row */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedRows.includes(data.id)}
                onChange={(e) => onRowSelect?.(data.id, e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <button
                onClick={() => toggleRow(data.id)}
                className="text-gray-400 hover:text-gray-300"
              >
                {expandedRows.includes(data.id) ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
              <div className="flex flex-col">
                <span className="text-gray-200 font-medium">{data.number}</span>
                <span className="text-sm text-gray-400">
                  {formatDate(data.date)} - Vto:{" "}
                  {formatDate(data.expiration_date)}
                </span>
              </div>
            </div>
            <span className="text-gray-200 font-medium">{data.amount}</span>
          </div>

          {/* Expanded Content */}
          {expandedRows.includes(data.id) && data && (
            <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Comprobante</span>
                    <span className="text-gray-200">
                      {data.number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Condición de Pago</span>
                    <span className="text-gray-200">
                      {data.payment_condition_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Importe</span>
                    <span className="text-gray-200">
                      {data.amount}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Importe</span>
                    <span className="text-gray-200">
                      {costumerInformation.amount}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Descuento</span>
                    <span className="text-gray-200">
                      {/* {data.details.descuento}% */}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-400">Saldo a Pagar</span>
                    <span className="text-gray-200">
                      {costumerInformation.amount}
                    </span>
                  </div>
                </div>
              </div>
          )}
        </div>
      )}
    </div>
  );
}
