"use client";

import React, { useMemo, useState } from "react";
import {
  PeriodType,
  StatsQueryParams,
  useGetStatsQuery,
} from "@/redux/services/statsApi";

// AJUSTAR ESTOS IMPORTS SEGÚN TU PROYECTO
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";

// Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ============================================================================
// HELPERS
// ============================================================================
const currencyFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fmtMoney = (n: number | undefined | null): string =>
  currencyFmt.format(Number(n || 0));

const pctFmt = (n: number | undefined | null): string =>
  `${(Number(n || 0) * 100).toFixed(1)}%`;

const COLORS = [
  "#0ea5e9",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#e11d48",
  "#64748b",
];

// ============================================================================
// MAIN PAGE
// ============================================================================
const StatsPage: React.FC = () => {
  const [filters, setFilters] = useState<StatsQueryParams>({
    periodType: PeriodType.MONTH,
  });

  const [activeTab, setActiveTab] = useState<
    "general" | "sellers" | "customers" | "products" | "financial"
  >("general");

  const periodOptions = [
    { value: PeriodType.DAY, label: "Día" },
    { value: PeriodType.WEEK, label: "Semana" },
    { value: PeriodType.MONTH, label: "Mes" },
    { value: PeriodType.YEAR, label: "Año" },
    { value: PeriodType.CUSTOM, label: "Personalizado" },
  ];

  // Si tus endpoints no reciben argumentos, podés cambiar {} por undefined o quitar los paréntesis.
  const sellersQuery = useGetSellersQuery(null);
  const customersQuery = useGetCustomersQuery(null);
  const branchesQuery = useGetBranchesQuery(null);
  const brandsQuery = useGetBrandsQuery(null);

  const { data, isLoading, isFetching, error, refetch } =
    useGetStatsQuery(filters);

  const general = data?.general?.current;
  const variation = data?.general?.variation;
  const sellersStats = data?.sellers?.current || [];
  const customersStats = data?.customers;
  const productsStats = data?.products;
  const financialStats = data?.financial;
  const ordersStats = data?.orders;
  const paymentsStats = data?.payments;

  const isCustom = filters.periodType === PeriodType.CUSTOM;

  // --------------------------------------------------------------------------
  // Datos para gráficos (defensivos)
  // --------------------------------------------------------------------------
  const topSellers = useMemo(
    () =>
      Array.isArray(sellersStats)
        ? [...sellersStats]
            .sort((a, b) => b.totalSales - a.totalSales)
            .slice(0, 8)
        : [],
    [sellersStats]
  );

  const topSellersChartData = topSellers.map((s: any) => ({
    name: s.sellerName || s.sellerId || "Sin nombre",
    totalSales: Number(s.totalSales || 0),
  }));

  const topCustomers = useMemo(
    () =>
      Array.isArray(customersStats?.topCustomers)
        ? [...customersStats.topCustomers]
            .sort((a, b) => b.totalPurchases - a.totalPurchases)
            .slice(0, 8)
        : [],
    [customersStats]
  );

  const topCustomersChartData = topCustomers.map((c: any) => ({
    name: c.customerName || "Sin nombre",
    totalPurchases: Number(c.totalPurchases || 0),
  }));

  // Ventas por marca (acepta salesByBrand / brands / brandSales)
  const rawSalesByBrand = useMemo(() => {
    const p: any = productsStats;

    if (Array.isArray(p?.salesByBrand)) return p.salesByBrand;
    if (Array.isArray(p?.brands)) return p.brands;
    if (Array.isArray(p?.brandSales)) return p.brandSales;
    return [];
  }, [productsStats]);

  const brandSalesChartData = rawSalesByBrand.map((b: any) => ({
    name: b.brandName || b.brandId || b._id || "Sin nombre",
    totalSales: Number(b.totalSales || b.total_amount || 0),
  }));

  // Condiciones de pago (acepta paymentConditions / payment_conditions)
  const paymentConditionsArray = useMemo(() => {
    const f: any = financialStats;

    if (Array.isArray(f?.paymentConditions)) return f.paymentConditions;
    if (Array.isArray(f?.payment_conditions)) return f.payment_conditions;
    return [];
  }, [financialStats]);

  const paymentConditionsPieData = paymentConditionsArray.map((pc: any) => ({
    name: pc.name || pc._id || "Sin nombre",
    value: Number(pc.totalAmount || pc.total || 0),
    count: pc.count || 0,
  }));

  // Orders arrays defensivos
  const ordersByStatusArray = Array.isArray(ordersStats?.ordersByStatus)
    ? ordersStats!.ordersByStatus
    : [];

  // ========================================================================
  // Render
  // ========================================================================
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-5 md:py-8 space-y-5">
        {/* HEADER */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
              Dashboard de estadísticas
            </h1>
            <p className="text-sm text-slate-500">
              Visualizá el rendimiento de ventas, clientes, productos y
              cobranzas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm hover:bg-slate-50"
            >
              Actualizar
            </button>
            {isFetching && (
              <span className="text-xs text-slate-500 animate-pulse">
                Actualizando...
              </span>
            )}
          </div>
        </div>

        {/* FILTROS - barra sticky */}
        <div className="sticky top-0 z-10 bg-slate-100 pb-2">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-3 py-3 md:px-4 md:py-4">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Filtros
              </span>
              <button
                className="ml-auto text-[11px] text-slate-500 hover:text-slate-700"
                onClick={() =>
                  setFilters({
                    periodType: PeriodType.MONTH,
                  })
                }
              >
                Limpiar filtros
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Periodo */}
              <FilterField label="Periodo">
                <select
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs md:text-sm w-full bg-white"
                  value={filters.periodType}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      periodType: e.target.value as PeriodType,
                    }))
                  }
                >
                  {periodOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FilterField>

              {/* Fechas */}
              <FilterField label={`Desde ${isCustom ? "(obligatorio)" : ""}`}>
                <input
                  type="date"
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs md:text-sm w-full bg-white"
                  value={filters.startDate || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value || undefined,
                    }))
                  }
                />
              </FilterField>

              <FilterField label={`Hasta ${isCustom ? "(obligatorio)" : ""}`}>
                <input
                  type="date"
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs md:text-sm w-full bg-white"
                  value={filters.endDate || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      endDate: e.target.value || undefined,
                    }))
                  }
                />
              </FilterField>

              {/* Vendedor */}
              <FilterField label="Vendedor">
                <select
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs md:text-sm w-full bg-white"
                  value={filters.sellerId || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sellerId: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">Todos</option>
                  {Array.isArray(sellersQuery.data) &&
                    sellersQuery.data.map((s: any) => (
                      <option key={s.id || s._id} value={s.id || s._id}>
                        {s.name || s.id || s._id}
                      </option>
                    ))}
                </select>
              </FilterField>

              {/* Cliente */}
              <FilterField label="Cliente">
                <select
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs md:text-sm w-full bg-white"
                  value={filters.customerId || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      customerId: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">Todos</option>
                  {Array.isArray(customersQuery.data) &&
                    customersQuery.data.map((c: any) => (
                      <option key={c.id || c._id} value={c.id || c._id}>
                        {c.name || c.business_name || c.id || c._id}
                      </option>
                    ))}
                </select>
              </FilterField>

              {/* Sucursal */}
              <FilterField label="Sucursal">
                <select
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs md:text-sm w-full bg-white"
                  value={filters.branchId || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      branchId: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">Todas</option>
                  {Array.isArray(branchesQuery.data) &&
                    branchesQuery.data.map((b: any) => (
                      <option key={b.id || b._id} value={b.id || b._id}>
                        {b.name || b.id || b._id}
                      </option>
                    ))}
                </select>
              </FilterField>

              {/* Marca */}
              <FilterField label="Marca">
                <select
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs md:text-sm w-full bg-white"
                  value={filters.brandId || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      brandId: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">Todas</option>
                  {Array.isArray(brandsQuery.data) &&
                    brandsQuery.data.map((b: any) => (
                      <option key={b.id || b._id} value={b.id || b._id}>
                        {b.name || b.id || b._id}
                      </option>
                    ))}
                </select>
              </FilterField>
            </div>
          </div>
        </div>

        {/* ESTADO DE CARGA / ERROR */}
        {isLoading && (
          <div className="text-sm text-slate-500">Cargando estadísticas...</div>
        )}
        {error && (
          <div className="text-sm text-red-500">
            Error al cargar estadísticas.
          </div>
        )}

        {data && (
          <>
            {/* RESUMEN GENERAL */}
            <section className="space-y-3">
              <h2 className="font-semibold text-lg text-slate-900">
                Resumen general
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <StatCard
                  label="Ventas totales"
                  value={fmtMoney(general?.totalSales)}
                  variation={variation?.totalSales ?? null}
                />
                <StatCard
                  label="Neto facturado"
                  value={fmtMoney(general?.totalNetAmount)}
                />
                <StatCard
                  label="Cantidad de documentos"
                  value={general?.documentCount ?? 0}
                  variation={variation?.documentCount ?? null}
                />
                <StatCard
                  label="Ticket promedio"
                  value={fmtMoney(general?.averageTicket)}
                  variation={variation?.averageTicket ?? null}
                />
              </div>
            </section>

            {/* TABS */}
            <div className="border-b border-slate-200 mt-4">
              <nav className="flex gap-2 overflow-x-auto text-sm">
                {[
                  { id: "general", label: "General" },
                  { id: "sellers", label: "Vendedores" },
                  { id: "customers", label: "Clientes" },
                  { id: "products", label: "Productos" },
                  { id: "financial", label: "Finanzas" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`px-3 py-2 border-b-2 -mb-px ${
                      activeTab === tab.id
                        ? "border-sky-500 text-sky-600 font-medium"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* CONTENIDO POR TAB */}
            <div className="pt-4 space-y-4">
              {/* TAB GENERAL */}
              {activeTab === "general" && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <DashboardCard title="Top vendedores">
                      <div className="h-56">
                        {topSellersChartData.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topSellersChartData}>
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10 }}
                                interval={0}
                              />
                              <YAxis
                                tickFormatter={(v) =>
                                  `${(v / 1000).toFixed(0)}k`
                                }
                              />
                              <Tooltip
                                formatter={(value: any) =>
                                  fmtMoney(value as number)
                                }
                              />
                              <Bar dataKey="totalSales">
                                {topSellersChartData.map((_, idx) => (
                                  <Cell
                                    key={idx}
                                    fill={COLORS[idx % COLORS.length]}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <EmptyState text="Sin datos de vendedores para este periodo." />
                        )}
                      </div>
                    </DashboardCard>

                    <DashboardCard title="Top clientes">
                      <div className="h-56">
                        {topCustomersChartData.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topCustomersChartData}>
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10 }}
                                interval={0}
                              />
                              <YAxis
                                tickFormatter={(v) =>
                                  `${(v / 1000).toFixed(0)}k`
                                }
                              />
                              <Tooltip
                                formatter={(value: any) =>
                                  fmtMoney(value as number)
                                }
                              />
                              <Bar dataKey="totalPurchases">
                                {topCustomersChartData.map((_, idx) => (
                                  <Cell
                                    key={idx}
                                    fill={COLORS[idx % COLORS.length]}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <EmptyState text="Sin datos de clientes para este periodo." />
                        )}
                      </div>
                    </DashboardCard>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <DashboardCard title="Ventas por marca">
                      <div className="h-56">
                        {brandSalesChartData.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={brandSalesChartData}>
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10 }}
                                interval={0}
                              />
                              <YAxis
                                tickFormatter={(v) =>
                                  `${(v / 1000).toFixed(0)}k`
                                }
                              />
                              <Tooltip
                                formatter={(value: any) =>
                                  fmtMoney(value as number)
                                }
                              />
                              <Bar dataKey="totalSales">
                                {brandSalesChartData.map((_: any, idx: any) => (
                                  <Cell
                                    key={idx}
                                    fill={COLORS[idx % COLORS.length]}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <EmptyState text="Sin datos de marcas para este periodo." />
                        )}
                      </div>
                    </DashboardCard>

                    <DashboardCard title="Condiciones de pago">
                      <div className="h-56">
                        {paymentConditionsPieData.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={paymentConditionsPieData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={3}
                                label={(entry: any) =>
                                  entry.name.length > 10
                                    ? entry.name.slice(0, 10) + "..."
                                    : entry.name
                                }
                              >
                                {paymentConditionsPieData.map(
                                  (_: any, idx: any) => (
                                    <Cell
                                      key={idx}
                                      fill={COLORS[idx % COLORS.length]}
                                    />
                                  )
                                )}
                              </Pie>
                              <Tooltip
                                formatter={(value: any) =>
                                  fmtMoney(value as number)
                                }
                              />
                              <Legend
                                wrapperStyle={{ fontSize: "10px" }}
                                verticalAlign="bottom"
                                height={40}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <EmptyState text="Sin datos de condiciones de pago." />
                        )}
                      </div>
                    </DashboardCard>
                  </div>
                </>
              )}

              {/* TAB VENDEDORES */}
              {activeTab === "sellers" && (
                <DashboardCard title="Detalle de vendedores">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 h-64">
                      {topSellersChartData.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topSellersChartData}>
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 10 }}
                              interval={0}
                            />
                            <YAxis
                              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                              formatter={(value: any) =>
                                fmtMoney(value as number)
                              }
                            />
                            <Bar dataKey="totalSales">
                              {topSellersChartData.map((_, idx) => (
                                <Cell
                                  key={idx}
                                  fill={COLORS[idx % COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyState text="Sin datos de vendedores para este periodo." />
                      )}
                    </div>

                    <div className="border border-slate-100 rounded-xl p-3 max-h-64 overflow-y-auto bg-slate-50/60">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="text-left py-1">Vendedor</th>
                            <th className="text-right py-1">Ventas</th>
                            <th className="text-right py-1">Docs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(sellersStats) &&
                            sellersStats.map((s: any) => (
                              <tr
                                key={s.sellerId}
                                className="border-b border-slate-100 last:border-0"
                              >
                                <td className="py-1">
                                  {s.sellerName || s.sellerId}
                                </td>
                                <td className="py-1 text-right">
                                  {fmtMoney(s.totalSales)}
                                </td>
                                <td className="py-1 text-right">
                                  {s.documentCount}
                                </td>
                              </tr>
                            ))}
                          {!Array.isArray(sellersStats) ||
                          !sellersStats.length ? (
                            <tr>
                              <td
                                colSpan={3}
                                className="text-center text-slate-400 py-2"
                              >
                                Sin datos.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </DashboardCard>
              )}

              {/* TAB CLIENTES */}
              {activeTab === "customers" && (
                <DashboardCard title="Clientes">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 h-64">
                      {topCustomersChartData.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topCustomersChartData}>
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 10 }}
                              interval={0}
                            />
                            <YAxis
                              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                              formatter={(value: any) =>
                                fmtMoney(value as number)
                              }
                            />
                            <Bar dataKey="totalPurchases">
                              {topCustomersChartData.map((_, idx) => (
                                <Cell
                                  key={idx}
                                  fill={COLORS[idx % COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyState text="Sin datos de clientes para este periodo." />
                      )}
                    </div>

                    <div className="border border-slate-100 rounded-xl p-3 max-h-64 overflow-y-auto bg-slate-50/60">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="text-left py-1">Cliente</th>
                            <th className="text-right py-1">Compras</th>
                            <th className="text-right py-1">Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(customersStats?.topCustomers) &&
                            customersStats.topCustomers.map((c: any) => (
                              <tr
                                key={c.customerId}
                                className="border-b border-slate-100 last:border-0"
                              >
                                <td className="py-1">{c.customerName}</td>
                                <td className="py-1 text-right">
                                  {fmtMoney(c.totalPurchases)}
                                </td>
                                <td className="py-1 text-right">
                                  {fmtMoney(c.totalBalance)}
                                </td>
                              </tr>
                            ))}
                          {!Array.isArray(customersStats?.topCustomers) ||
                          !customersStats?.topCustomers?.length ? (
                            <tr>
                              <td
                                colSpan={3}
                                className="text-center text-slate-400 py-2"
                              >
                                Sin datos.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </DashboardCard>
              )}

              {/* TAB PRODUCTOS */}
              {activeTab === "products" && (
                <DashboardCard title="Productos">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="h-64">
                      {brandSalesChartData.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={brandSalesChartData}>
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 10 }}
                              interval={0}
                            />
                            <YAxis
                              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                              formatter={(value: any) =>
                                fmtMoney(value as number)
                              }
                            />
                            <Bar dataKey="totalSales">
                              {brandSalesChartData.map((_: any, idx: any) => (
                                <Cell
                                  key={idx}
                                  fill={COLORS[idx % COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyState text="Sin datos de ventas por marca." />
                      )}
                    </div>

                    <div className="border border-slate-100 rounded-xl p-3 max-h-64 overflow-y-auto bg-slate-50/60">
                      <h4 className="text-xs font-semibold text-slate-500 mb-2">
                        Top productos
                      </h4>
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="text-left py-1">Artículo</th>
                            <th className="text-right py-1">Cant.</th>
                            <th className="text-right py-1">Ventas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(productsStats?.topProducts) &&
                            productsStats.topProducts.map((p: any) => (
                              <tr
                                key={p.articleId}
                                className="border-b border-slate-100 last:border-0"
                              >
                                <td className="py-1">{p.articleId}</td>
                                <td className="py-1 text-right">
                                  {p.totalQuantity}
                                </td>
                                <td className="py-1 text-right">
                                  {fmtMoney(p.totalSales)}
                                </td>
                              </tr>
                            ))}
                          {!Array.isArray(productsStats?.topProducts) ||
                          !productsStats?.topProducts?.length ? (
                            <tr>
                              <td
                                colSpan={3}
                                className="text-center text-slate-400 py-2"
                              >
                                Sin datos.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </DashboardCard>
              )}

              {/* TAB FINANZAS */}
              {activeTab === "financial" && (
                <DashboardCard title="Finanzas y cobranzas">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Resumen */}
                    <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/60 text-xs space-y-2">
                      <InfoRow
                        label="Total documentos"
                        value={fmtMoney(financialStats?.totalAmount)}
                      />
                      <InfoRow
                        label="Neto"
                        value={fmtMoney(financialStats?.totalNetAmount)}
                      />
                      <InfoRow
                        label="Descuento total"
                        value={fmtMoney(financialStats?.totalDiscount)}
                      />
                      <InfoRow
                        label="Balance vencido"
                        value={fmtMoney(financialStats?.expiredBalance)}
                      />
                      <InfoRow
                        label="Docs vencidos"
                        value={financialStats?.expiredDocumentCount ?? 0}
                      />

                      <div className="mt-2 border-t border-slate-200 pt-2">
                        <h4 className="text-[11px] font-semibold text-slate-500 mb-1">
                          Pagos
                        </h4>
                        <InfoRow
                          label="Total pagado"
                          value={fmtMoney(paymentsStats?.totalPayments)}
                        />
                        <InfoRow
                          label="Cantidad de pagos"
                          value={paymentsStats?.paymentCount ?? 0}
                        />
                      </div>

                      <div className="mt-2 border-t border-slate-200 pt-2">
                        <h4 className="text-[11px] font-semibold text-slate-500 mb-1">
                          Pedidos
                        </h4>
                        <InfoRow
                          label="Total pedidos"
                          value={ordersStats?.totalOrders ?? 0}
                        />
                        <InfoRow
                          label="Pedidos cobrados"
                          value={ordersStats?.chargedOrders ?? 0}
                        />
                        <InfoRow
                          label="Tasa de conversión"
                          value={pctFmt(ordersStats?.conversionRate)}
                        />
                      </div>
                    </div>

                    {/* Pie condiciones */}
                    <div className="lg:col-span-2 h-64">
                      {paymentConditionsPieData.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={paymentConditionsPieData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={50}
                              outerRadius={90}
                              paddingAngle={3}
                              label={(entry: any) =>
                                entry.name.length > 10
                                  ? entry.name.slice(0, 10) + "..."
                                  : entry.name
                              }
                            >
                              {paymentConditionsPieData.map(
                                (_: any, idx: any) => (
                                  <Cell
                                    key={idx}
                                    fill={COLORS[idx % COLORS.length]}
                                  />
                                )
                              )}
                            </Pie>
                            <Tooltip
                              formatter={(value: any) =>
                                fmtMoney(value as number)
                              }
                            />
                            <Legend
                              wrapperStyle={{ fontSize: "11px" }}
                              verticalAlign="bottom"
                              height={40}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyState text="Sin datos de condiciones de pago." />
                      )}
                    </div>
                  </div>

                  {/* Tabla de condiciones de pago + estados pedidos */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/60">
                      <h4 className="text-xs font-semibold text-slate-500 mb-2">
                        Detalle condiciones de pago
                      </h4>
                      <div className="max-h-64 overflow-y-auto">
                        <table className="min-w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="text-left py-1">Condición</th>
                              <th className="text-right py-1">Cant.</th>
                              <th className="text-right py-1">Monto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paymentConditionsArray.length ? (
                              paymentConditionsArray.map(
                                (pc: any, idx: number) => (
                                  <tr
                                    key={pc._id || pc.name || idx}
                                    className="border-b border-slate-100 last:border-0"
                                  >
                                    <td className="py-1">
                                      {pc.name || pc._id || "Sin nombre"}
                                    </td>
                                    <td className="py-1 text-right">
                                      {pc.count ?? "-"}
                                    </td>
                                    <td className="py-1 text-right">
                                      {fmtMoney(pc.totalAmount || pc.total)}
                                    </td>
                                  </tr>
                                )
                              )
                            ) : (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="text-center text-slate-400 py-2"
                                >
                                  Sin datos.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/60">
                      <h4 className="text-xs font-semibold text-slate-500 mb-2">
                        Pedidos por estado
                      </h4>
                      <div className="max-h-64 overflow-y-auto">
                        <table className="min-w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="text-left py-1">Estado</th>
                              <th className="text-right py-1">Cant.</th>
                              <th className="text-right py-1">Monto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ordersByStatusArray.length ? (
                              ordersByStatusArray.map((o: any, idx: number) => (
                                <tr
                                  key={o._id || idx}
                                  className="border-b border-slate-100 last:border-0"
                                >
                                  <td className="py-1">
                                    {o._id || "Sin estado"}
                                  </td>
                                  <td className="py-1 text-right">
                                    {o.count ?? 0}
                                  </td>
                                  <td className="py-1 text-right">
                                    {fmtMoney(o.totalAmount)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="text-center text-slate-400 py-2"
                                >
                                  Sin datos.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </DashboardCard>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatsPage;

// ============================================================================
// SUBCOMPONENTES
// ============================================================================
const FilterField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-medium text-slate-600">{label}</label>
    {children}
  </div>
);

interface StatCardProps {
  label: string;
  value: string | number;
  variation?: number | null;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, variation }) => {
  const hasVar = typeof variation === "number";
  const varPercent = hasVar ? (variation || 0) * 100 : 0;
  const isPositive = varPercent >= 0;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-sm border border-slate-200 px-3 py-3 flex flex-col gap-1">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-sm md:text-base font-semibold text-slate-900">
        {value}
      </span>
      {hasVar && (
        <span
          className={`text-[10px] md:text-xs font-medium flex items-center gap-1 ${
            isPositive ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {isPositive ? "▲" : "▼"} {Math.abs(varPercent).toFixed(1)}% vs período
          anterior
        </span>
      )}
    </div>
  );
};

const DashboardCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 md:p-4 space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-sm md:text-base text-slate-900">
        {title}
      </h3>
    </div>
    {children}
  </section>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="w-full h-full flex items-center justify-center">
    <span className="text-xs text-slate-400">{text}</span>
  </div>
);

interface InfoRowProps {
  label: string;
  value: string | number;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <div className="flex justify-between gap-2">
    <span className="text-[11px] text-slate-500">{label}</span>
    <span className="text-[11px] font-medium text-slate-900">{value}</span>
  </div>
);
