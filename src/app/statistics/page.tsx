"use client";

import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useGetItemsQuery } from "@/redux/services/itemsApi";
import { useGetMonthlySalesQuery } from "@/redux/services/ordersApi";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function StatsPage() {
  // Traemos las brands e items de la API
  const { data: brands } = useGetBrandsQuery(null);
  const { data: items } = useGetItemsQuery(null);

  // Estados para filtrar
  const [brand, setBrand] = useState("");
  const [item, setItem] = useState("");

  // Control de apertura del panel de filtros
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // Definimos un rango de fechas (por ejemplo, año 2025)
  const startDate = "2025-01-01";
  const endDate = "2025-12-31";

  // Llamamos al endpoint de ventas mensuales pasando los filtros
  const { data: monthlySalesData, isLoading, error } = useGetMonthlySalesQuery({
    startDate,
    endDate,
    brand,
    item,
  });

  // Transformamos los datos de la respuesta para que el mes sea un nombre en español.
  // Usamos d.totalQty, pero si no existe usamos d.countOrders o 0.
  const aggregatedData = monthlySalesData
    ? monthlySalesData.map((d: any) => ({
        month: monthNames[d.month - 1], // d.month es de 1 a 12
        totalSales: d.totalSales,
        totalQty: d.totalQty ?? d.countOrders ?? 0,
      }))
    : [];

  // Valores resumen calculados a partir de aggregatedData
  const currentMonthName = monthNames[new Date().getMonth()];
  const currentMonthData = aggregatedData.find((d: any) => d.month === currentMonthName);
  const currentMonthSales = currentMonthData ? currentMonthData.totalSales : 0;
  const previousMonthData = aggregatedData.length > 1 ? aggregatedData[aggregatedData.length - 2] : null;
  const previousMonthSales = previousMonthData ? previousMonthData.totalSales : 0;
  const last12MonthsSales = aggregatedData.reduce((acc: number, d: any) => acc + d.totalSales, 0);

  const currentMonthQty = currentMonthData ? currentMonthData.totalQty : 0;
  const previousMonthQty = previousMonthData ? previousMonthData.totalQty : 0;
  const last12MonthsQty = aggregatedData.reduce((acc: number, d: any) => acc + d.totalQty, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-3 mt-4">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-xl font-semibold text-gray-800">STATS</h1>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="px-3 py-1 bg-white border border-gray-200 rounded text-sm hover:bg-gray-50 flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
        </button>
      </div>

      {/* Cambiamos el layout condicionalmente según isFilterOpen */}
      <div className={`grid gap-3 ${isFilterOpen ? "grid-cols-1 lg:grid-cols-[200px_1fr]" : "grid-cols-1"}`}>
        {isFilterOpen && (
          <div className="bg-white p-3 rounded border border-gray-200 shadow-sm h-fit">
            <div className="space-y-2">
              {/* Select de Brands */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Brands</label>
                <select
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                >
                  <option value="">-- Seleccionar Brand --</option>
                  {brands?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select de Items */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Items</label>
                <select
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                >
                  <option value="">-- Seleccionar Item --</option>
                  {items?.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div>Cargando datos...</div>
        ) : error ? (
          <div>Error al cargar datos</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {/* Gráfico: Sales by Amount */}
            <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
              <h2 className="text-sm font-medium text-gray-800 mb-2">Monthly Sales by Amount</h2>
              <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                <div>
                  <div className="text-gray-500">Current Month</div>
                  <div className="font-semibold text-gray-800">{formatCurrency(currentMonthSales)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Previous Month</div>
                  <div className="font-semibold text-gray-800">{formatCurrency(previousMonthSales)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Last 12 months</div>
                  <div className="font-semibold text-gray-800">{formatCurrency(last12MonthsSales)}</div>
                </div>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aggregatedData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(value) => `$${value / 1000000}M`} tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: "#374151", fontSize: 10 }}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: "0.25rem",
                        fontSize: 10,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="totalSales" name="Sales Amount" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico: Sales by Quantity */}
            <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
              <h2 className="text-sm font-medium text-gray-800 mb-2">Monthly Sales by Quantity</h2>
              <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                <div>
                  <div className="text-gray-500">Current Month</div>
                  <div className="font-semibold text-gray-800">{currentMonthQty.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500">Previous Month</div>
                  <div className="font-semibold text-gray-800">{previousMonthQty.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500">Last 12 months</div>
                  <div className="font-semibold text-gray-800">{last12MonthsQty.toLocaleString()}</div>
                </div>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aggregatedData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: number) => value.toLocaleString()}
                      labelStyle={{ color: "#374151", fontSize: 10 }}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: "0.25rem",
                        fontSize: 10,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="totalQty" name="Sales Quantity" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
