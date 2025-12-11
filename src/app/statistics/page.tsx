"use client";

import React, { useMemo, useState } from "react";
import {
  PeriodType,
  StatsQueryParams,
  useGetStatsQuery,
} from "@/redux/services/statsApi";

import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";

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
import { useGetUsersQuery } from "@/redux/services/usersApi";
import { useGetPaymentConditionsQuery } from "@/redux/services/paymentConditionsApi";
import SalesTargetsPage, { SalesTargetsView } from "../sellersTarget/page";

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

const moneyTooltip =
  (labelMap: Record<string, string> = {}) =>
  (value: any, name: string) => {
    const pretty = fmtMoney(value as number);
    const prettyName = labelMap[name] ?? name;
    return [pretty, prettyName];
  };

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
  const [selectedSellerId, setSelectedSellerId] = useState<string>("");

  const [activeTab, setActiveTab] = useState<
    "general" | "sellers" | "customers" | "products" | "financial" | "targets"
  >("general");
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery(null);
  const getSellerLabel = (seller: any) => {
    if (!seller) return "Sin vendedor";
    const user = usersData?.find((u: any) => u.seller_id === seller.id);
    const nameToShow =
      user?.username || seller.name || seller.id || "Sin nombre";
    return `${nameToShow}`;
  };

  const periodOptions = [
    { value: PeriodType.DAY, label: "Día" },
    { value: PeriodType.WEEK, label: "Semana" },
    { value: PeriodType.MONTH, label: "Mes" },
    { value: PeriodType.YEAR, label: "Año" },
    { value: PeriodType.CUSTOM, label: "Personalizado" },
  ];

  const sellersQuery = useGetSellersQuery(null);
  const customersQuery = useGetCustomersQuery(null);
  const brandsQuery = useGetBrandsQuery(null);
  const paymentConditionsData = useGetPaymentConditionsQuery(null);

  const getBrandLabel = (brand: any) => {
    if (!brand && !brandsQuery) return "Sin marca";

    const brandId =
      typeof brand === "string"
        ? brand
        : brand?.id || brand?._id || brand?.brandId || brand?.brand_id;

    const found = brandsQuery.data?.find(
      (b: any) => b.id === brandId || b._id === brandId
    );

    const nameToShow =
      found?.name || brand?.brandName || brand?.name || brandId || "Sin marca";

    return `${nameToShow}`;
  };

  const getPaymentConditionLabel = (pc: any) => {
    if (!pc && !paymentConditionsData) return "Sin condición";

    const pcId =
      typeof pc === "string"
        ? pc
        : pc?.id ||
          pc?._id ||
          pc?.paymentConditionId ||
          pc?.payment_condition_id ||
          pc?.payment_condition;

    const found = paymentConditionsData.data?.find(
      (p: any) => p.id === pcId || p._id === pcId
    );

    const nameToShow = found?.name || pc?.name || pcId || "Sin condición";

    return `${nameToShow}`;
  };

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

  const topSellersChartData = topSellers.map((s: any, idx: number) => ({
    rank: idx + 1, // 1,2,3...
    name: getSellerLabel({ id: s.sellerId, name: s.sellerName }),
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

  const topCustomersChartData = topCustomers.map((c: any, idx: number) => ({
    rank: idx + 1,
    name: c.customerName || "Sin nombre",
    totalPurchases: Number(c.totalPurchases || 0),
  }));

  const rawSalesByBrand = useMemo(() => {
    const p: any = productsStats;

    if (Array.isArray(p?.salesByBrand)) return p.salesByBrand;
    if (Array.isArray(p?.brands)) return p.brands;
    if (Array.isArray(p?.brandSales)) return p.brandSales;
    return [];
  }, [productsStats]);

  const brandSalesChartData = rawSalesByBrand.map((b: any, idx: number) => ({
    rank: idx + 1,
    name: getBrandLabel(b),
    totalSales: Number(b.totalSales || b.total_amount || 0),
  }));

  const MAX_BARS = 12;
  const productSalesChartData = Array.isArray(productsStats?.topProducts)
    ? productsStats.topProducts.map((p: any, idx: number) => ({
        rank: idx + 1,
        name: p.articleName || p.articleId || "Sin nombre",
        totalSales: Number(p.totalSales || 0),
      }))
    : [];

  const paymentConditionsArray = useMemo(() => {
    const f: any = financialStats;

    if (Array.isArray(f?.paymentConditions)) return f.paymentConditions;
    if (Array.isArray(f?.payment_conditions)) return f.payment_conditions;
    return [];
  }, [financialStats]);

  const paymentConditionsPieData = paymentConditionsArray.map((pc: any) => ({
    id: pc.paymentConditionId || pc.payment_condition_id || pc._id || pc.id,
    name: getPaymentConditionLabel(pc),
    value: Number(pc.totalAmount || pc.total || 0),
    count: pc.count || 0,
  }));

  const ordersByStatusArray = Array.isArray(ordersStats?.ordersByStatus)
    ? ordersStats!.ordersByStatus
    : [];

  const hasAnyData =
    !!general ||
    topSellersChartData.length > 0 ||
    topCustomersChartData.length > 0 ||
    brandSalesChartData.length > 0 ||
    paymentConditionsPieData.length > 0;

  // ========================================================================
  // Render
  // ========================================================================
  return (
    <main className="min-h-screen bg-slate-950/5">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-5 md:py-8">
        {/* HEADER */}
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
              Dashboard de estadísticas
            </h1>
            <p className="text-sm text-slate-500 max-w-xl">
              Visualizá el rendimiento de ventas, clientes, productos y
              cobranzas en un solo lugar.
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              <Pill size="xs" variant="soft">
                Periodo:{" "}
                {
                  periodOptions.find((p) => p.value === filters.periodType)
                    ?.label
                }
              </Pill>
              {filters.startDate && (
                <Pill size="xs" variant="outline">
                  Desde {filters.startDate}
                </Pill>
              )}
              {filters.endDate && (
                <Pill size="xs" variant="outline">
                  Hasta {filters.endDate}
                </Pill>
              )}
              {filters.sellerId && (
                <Pill size="xs" variant="outline">
                  Vendedor filtrado
                </Pill>
              )}
              {filters.customerId && (
                <Pill size="xs" variant="outline">
                  Cliente filtrado
                </Pill>
              )}
              {filters.brandId && (
                <Pill size="xs" variant="outline">
                  Marca filtrada
                </Pill>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs md:text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.99] transition"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]" />
              Actualizar datos
            </button>
            {isFetching && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
                Actualizando...
              </span>
            )}
          </div>
        </header>

        {/* FILTROS - barra sticky */}
        <div className="sticky top-0 z-20 pb-3 mb-4">
          <section className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl shadow-sm px-3 py-3 md:px-4 md:py-4">
            <div className="flex flex-wrap gap-2 mb-3 items-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Filtros
              </span>
              <span className="text-[11px] text-slate-400">
                Ajustá el periodo y los filtros para refinar el análisis.
              </span>
              <button
                className="ml-auto text-[11px] text-slate-500 hover:text-slate-800 underline-offset-2 hover:underline"
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
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs md:text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
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
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs md:text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
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
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs md:text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
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
                        {getSellerLabel(s)}
                      </option>
                    ))}
                </select>
              </FilterField>

              {/* Cliente */}
              <FilterField label="Cliente">
                <select
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs md:text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
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

              {/* Marca */}
              <FilterField label="Marca">
                <select
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs md:text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500"
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
          </section>
        </div>

        {/* ESTADO DE CARGA / ERROR */}
        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs md:text-sm text-rose-700 flex items-start gap-2">
            <span className="mt-[2px]">⚠️</span>
            <div>
              <div className="font-semibold mb-0.5">
                Error al cargar estadísticas
              </div>
              <p className="text-rose-700/80">
                Verificá la conexión o intentá nuevamente con el botón
                &quot;Actualizar datos&quot;.
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="mt-6">
            <LoadingOverlay text="Cargando estadísticas iniciales..." />
          </div>
        )}

        {data && (
          <div className="relative">
            {isFetching && !isLoading && (
              <LoadingOverlay text="Actualizando datos..." subtle />
            )}

            {!hasAnyData && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 px-4 text-center text-sm text-slate-500 mb-4">
                No se encontraron datos para los filtros seleccionados. Probá
                ampliando el periodo o quitando algunos filtros.
              </div>
            )}

            {/* RESUMEN GENERAL */}
            {general && (
              <section className="space-y-3 mb-4">
                <SectionTitle
                  title="Resumen general"
                  subtitle="Visión rápida de la salud del negocio en el periodo seleccionado."
                />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <StatCard
                    icon="💰"
                    label="Ventas totales"
                    value={fmtMoney(general?.totalSales)}
                    variation={variation?.totalSales ?? null}
                  />
                  <StatCard
                    icon="🧾"
                    label="Neto facturado"
                    value={fmtMoney(general?.totalNetAmount)}
                  />
                  <StatCard
                    icon="📄"
                    label="Cantidad de documentos"
                    value={general?.documentCount ?? 0}
                    variation={variation?.documentCount ?? null}
                  />
                  <StatCard
                    icon="🎟️"
                    label="Ticket promedio"
                    value={fmtMoney(general?.averageTicket)}
                    variation={variation?.averageTicket ?? null}
                  />
                </div>
              </section>
            )}

            {/* TABS */}
            <div className="border-b border-slate-200 mt-4">
              <nav className="flex gap-2 text-xs md:text-sm">
                {[
                  { id: "general", label: "General" },
                  { id: "sellers", label: "Vendedores" },
                  { id: "customers", label: "Clientes" },
                  { id: "products", label: "Productos" },
                  { id: "financial", label: "Finanzas" },
                  { id: "targets", label: "Objetivos" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`px-3 py-2 rounded-t-xl border-b-2 -mb-px transition ${
                      activeTab === tab.id
                        ? "border-sky-500 text-sky-600 font-medium bg-sky-50/60"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
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
                                dataKey="rank"
                                tick={{ fontSize: 10 }}
                                interval={0}
                              />

                              <YAxis
                                tickFormatter={(v) =>
                                  `${(v / 1000).toFixed(0)}k`
                                }
                              />
                              <Tooltip
                                formatter={moneyTooltip({
                                  totalSales: "Ventas",
                                })}
                                labelFormatter={(_, payload: any[]) => {
                                  const d = payload?.[0]?.payload;
                                  if (!d) return "";
                                  return `#${d.rank} - ${d.name}`;
                                }}
                              />

                              <Bar dataKey="totalSales" name="Ventas">
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
                                dataKey="rank"
                                tick={{ fontSize: 10 }}
                                interval={0}
                              />

                              <YAxis
                                tickFormatter={(v) =>
                                  `${(v / 1000).toFixed(0)}k`
                                }
                              />
                              <Tooltip
                                formatter={moneyTooltip({
                                  totalPurchases: "Compras",
                                })}
                                labelFormatter={(_, payload: any[]) => {
                                  const d = payload?.[0]?.payload;
                                  if (!d) return "";
                                  return `#${d.rank} - ${d.name}`;
                                }}
                              />

                              <Bar dataKey="totalPurchases" name="Compras">
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
                                dataKey="rank"
                                tick={{ fontSize: 10 }}
                                interval={0}
                              />

                              <YAxis
                                tickFormatter={(v) =>
                                  `${(v / 1000).toFixed(0)}k`
                                }
                              />
                              <Tooltip
                                formatter={moneyTooltip({
                                  totalSales: "Ventas",
                                })}
                                labelFormatter={(_, payload: any[]) => {
                                  const d = payload?.[0]?.payload;
                                  if (!d) return "";
                                  return `#${d.rank} - ${d.name}`;
                                }}
                              />

                              <Bar dataKey="totalSales" name="Ventas">
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
                              dataKey="rank"
                              tick={{ fontSize: 10 }}
                              interval={0}
                            />

                            <YAxis
                              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                              formatter={moneyTooltip({ totalSales: "Ventas" })}
                              labelFormatter={(_, payload: any[]) => {
                                const d = payload?.[0]?.payload;
                                if (!d) return "";
                                return `#${d.rank} - ${d.name}`;
                              }}
                            />

                            <Bar dataKey="totalSales" name="Ventas">
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
                                  {getSellerLabel({
                                    id: s.sellerId,
                                    name: s.sellerName,
                                  })}
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
                              dataKey="rank"
                              tick={{ fontSize: 10 }}
                              interval={0}
                            />

                            <YAxis
                              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                              formatter={moneyTooltip({
                                totalPurchases: "Compras",
                              })}
                              labelFormatter={(_, payload: any[]) => {
                                const d = payload?.[0]?.payload;
                                if (!d) return "";
                                return `#${d.rank} - ${d.name}`;
                              }}
                            />

                            <Bar dataKey="totalPurchases" name="Compras">
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

              {activeTab === "products" && (
                <>
                  {/* MARCAS */}
                  <DashboardCard title="Marcas">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Gráfico marcas */}
                      <div className="h-64">
                        {brandSalesChartData.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={brandSalesChartData}>
                              <XAxis
                                dataKey="rank"
                                tick={{ fontSize: 10 }}
                                interval={0}
                              />

                              <YAxis
                                tickFormatter={(v) =>
                                  `${(v / 1000).toFixed(0)}k`
                                }
                              />
                              <Tooltip
                                formatter={moneyTooltip({
                                  totalSales: "Ventas",
                                })}
                                labelFormatter={(_, payload: any[]) => {
                                  const d = payload?.[0]?.payload;
                                  if (!d) return "";
                                  return `#${d.rank} - ${d.name}`;
                                }}
                              />

                              <Bar dataKey="totalSales" name="Ventas">
                                {brandSalesChartData.map(
                                  (_: any, idx: number) => (
                                    <Cell
                                      key={idx}
                                      fill={COLORS[idx % COLORS.length]}
                                    />
                                  )
                                )}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <EmptyState text="Sin datos de ventas por marca." />
                        )}
                      </div>

                      {/* Lista marcas */}
                      <div className="border border-slate-100 rounded-xl p-3 max-h-64 overflow-y-auto bg-slate-50/60">
                        <h4 className="text-xs font-semibold text-slate-500 mb-2">
                          Top marcas
                        </h4>
                        <table className="min-w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="text-left py-1">Marca</th>
                              <th className="text-right py-1">Cant.</th>
                              <th className="text-right py-1">Ventas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rawSalesByBrand.length ? (
                              rawSalesByBrand.map((b: any, idx: number) => (
                                <tr
                                  key={b.brandId || b._id || idx}
                                  className="border-b border-slate-100 last:border-0"
                                >
                                  <td className="py-1">{getBrandLabel(b)}</td>

                                  <td className="py-1 text-right">
                                    {b.totalQuantity ?? b.count ?? "-"}
                                  </td>
                                  <td className="py-1 text-right">
                                    {fmtMoney(b.totalSales || b.total_amount)}
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
                  </DashboardCard>

                  {/* PRODUCTOS */}
                  <DashboardCard title="Productos">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Gráfico productos */}
                      <div className="h-64">
                        {productSalesChartData.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productSalesChartData}>
                              <XAxis
                                dataKey="rank"
                                tick={{ fontSize: 10 }}
                                interval={0}
                              />

                              <YAxis
                                tickFormatter={(v) =>
                                  `${(v / 1000).toFixed(0)}k`
                                }
                              />

                              <Tooltip
                                formatter={moneyTooltip({
                                  totalSales: "Ventas",
                                })}
                                labelFormatter={(_, payload: any[]) => {
                                  const d = payload?.[0]?.payload;
                                  if (!d) return "";
                                  return `#${d.rank} - ${d.name}`;
                                }}
                              />

                              <Bar dataKey="totalSales" name="Ventas">
                                {productSalesChartData.map(
                                  (_: any, idx: number) => (
                                    <Cell
                                      key={idx}
                                      fill={COLORS[idx % COLORS.length]}
                                    />
                                  )
                                )}
                              </Bar>
                              {productsStats &&
                                productsStats?.topProducts?.length >
                                  MAX_BARS && (
                                  <div className="text-[11px] text-slate-400 mt-1">
                                    +
                                    {productsStats.topProducts.length -
                                      MAX_BARS}{" "}
                                    productos más
                                  </div>
                                )}
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <EmptyState text="Sin datos de ventas por producto." />
                        )}
                      </div>

                      {/* Lista productos */}
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
                            productsStats.topProducts.length ? (
                              productsStats.topProducts.map((p: any) => (
                                <tr
                                  key={p.articleId}
                                  className="border-b border-slate-100 last:border-0"
                                >
                                  <td className="py-1">
                                    {p.articleName || p.articleId}
                                  </td>
                                  <td className="py-1 text-right">
                                    {p.totalQuantity}
                                  </td>
                                  <td className="py-1 text-right">
                                    {fmtMoney(p.totalSales)}
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
                  </DashboardCard>
                </>
              )}

              {/* TAB FINANZAS */}
              {activeTab === "financial" && (
                <DashboardCard title="Finanzas y cobranzas">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Resumen */}
                    <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/60 text-xs space-y-2">
                      <h4 className="text-[11px] font-semibold text-slate-600 mb-1">
                        Resumen documentos
                      </h4>
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
                        <h4 className="text-[11px] font-semibold text-slate-600 mb-1">
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
                        <h4 className="text-[11px] font-semibold text-slate-600 mb-1">
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
                                      {getPaymentConditionLabel(pc)}
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

              {activeTab === "targets" && (
                <div className="space-y-4">
                  {/* SELECT DE VENDEDORES */}
                  <div className="max-w-xs">
                    <label className="text-[11px] font-medium text-slate-600">
                      Seleccionar vendedor
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                      value={selectedSellerId}
                      onChange={(e) => setSelectedSellerId(e.target.value)}
                    >
                      <option value="">Todos</option>
                      {Array.isArray(sellersQuery.data) &&
                        sellersQuery.data.map((s: any) => (
                          <option key={s.id || s._id} value={s.id || s._id}>
                            {getSellerLabel(s)}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* PASAR PROPS */}
                  <SalesTargetsView sellerId={selectedSellerId} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
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
  icon?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  variation,
  icon,
}) => {
  const hasVar = typeof variation === "number";
  const varPercent = hasVar ? (variation || 0) * 100 : 0;
  const isPositive = varPercent >= 0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-sm border border-slate-200 px-3 py-3 flex flex-col gap-1">
      {icon && (
        <div className="absolute right-3 top-3 text-xl pointer-events-none">
          {icon}
        </div>
      )}
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-sm md:text-base font-semibold text-slate-900">
        {value}
      </span>
      {hasVar && (
        <span
          className={`text-[10px] md:text-xs font-medium inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full w-fit ${
            isPositive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          <span>{isPositive ? "▲" : "▼"}</span>
          <span>{Math.abs(varPercent).toFixed(1)}%</span>
          <span className="text-[9px] text-slate-400">vs período anterior</span>
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
    <div className="flex items-center justify-between gap-2">
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
  <div className="flex justify-between gap-2 py-[1px]">
    <span className="text-[11px] text-slate-500">{label}</span>
    <span className="text-[11px] font-medium text-slate-900">{value}</span>
  </div>
);

const Pill = ({
  children,
  size = "sm",
  variant = "soft",
}: {
  children: React.ReactNode;
  size?: "xs" | "sm";
  variant?: "soft" | "outline";
}) => {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]";
  const sizeClass = size === "xs" ? "px-2 py-0.5" : "px-2.5 py-0.5";
  const variantClass =
    variant === "soft"
      ? "bg-sky-50/80 border-sky-100 text-sky-700"
      : "bg-white/70 border-slate-200 text-slate-600";
  return (
    <span className={`${base} ${sizeClass} ${variantClass}`}>{children}</span>
  );
};

const SectionTitle = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <div className="flex flex-col gap-1">
    <h2 className="font-semibold text-lg text-slate-900">{title}</h2>
    {subtitle && (
      <p className="text-xs md:text-sm text-slate-500 max-w-2xl">{subtitle}</p>
    )}
  </div>
);

const LoadingOverlay = ({
  text,
  subtle,
}: {
  text: string;
  subtle?: boolean;
}) => (
  <div
    className={`${
      subtle
        ? "absolute inset-0 bg-white/40 backdrop-blur-[1px]"
        : "rounded-2xl border border-slate-200 bg-white shadow-sm"
    } flex items-center justify-center z-30`}
  >
    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
      <span className="h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      <span>{text}</span>
    </div>
  </div>
);
