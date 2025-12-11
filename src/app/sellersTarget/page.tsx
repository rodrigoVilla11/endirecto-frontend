"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useGetSellerByIdQuery } from "@/redux/services/sellersApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { useGetDocumentIdsBySellerQuery } from "@/redux/services/documentsApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import {
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  Package,
  AlertCircle,
  Loader2,
  DollarSign,
  ShoppingBag,
} from "lucide-react";
import { useGetSumsByIdsAndBrandMutation } from "@/redux/services/documentsDetailsApi";
import { useGetUserByIdQuery } from "@/redux/services/usersApi";

type SalesTargetsPageProps = {
  sellerId?: string; // opcional, si la página se usa como componente y se le pasa un vendedor
};

const SalesTargetsPage: React.FC<SalesTargetsPageProps> = ({
  sellerId: sellerIdProp,
}) => {
  const { userData } = useAuth();

  // Si viene por props, usamos ese. Si no, el del usuario logueado
  const sellerId = sellerIdProp ?? userData?.seller_id;

  // Calcular fechas del mes actual
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();

  const startDate = `${currentYear}-${String(currentMonth).padStart(
    2,
    "0"
  )}-01`;
  const endDate = `${currentYear}-${String(currentMonth).padStart(
    2,
    "0"
  )}-${String(lastDayOfMonth).padStart(2, "0")}`;

  // Queries
  const { data: seller, isLoading: isLoadingSeller } = useGetSellerByIdQuery(
    { id: sellerId! },
    { skip: !sellerId }
  );

  const userQuery = useGetUserByIdQuery({ id: userData?._id || "" });

  const { data: brands, isLoading: isLoadingBrands } = useGetBrandsQuery(null);

  const { data: documentIds, isLoading: isLoadingDocs } =
    useGetDocumentIdsBySellerQuery(
      {
        seller_id: sellerId!,
        startDate,
        endDate,
      },
      { skip: !sellerId }
    );

  // Mutation para obtener sumas
  const [getSumsByIdsAndBrand] = useGetSumsByIdsAndBrandMutation();

  const [brandSales, setBrandSales] = useState<{
    [brandId: string]: {
      totalAmount: number;
      totalQuantity: number;
      totalRelativeQuantity: number;
    };
  }>({});
  const [expandedBrands, setExpandedBrands] = useState<{
    [key: string]: boolean;
  }>({});
  const [isLoadingBrandData, setIsLoadingBrandData] = useState(false);

  // 👉 Helper para saber si la marca trabaja con cantidad relativa
  const isRelativeBrand = (brandId: string) =>
    ["E", "ELF", "EM"].includes(brandId);

  // Filtrar marcas con objetivo
  const brandsWithTargets =
    brands
      ?.filter((brand) => {
        const target = parseFloat(seller?.target?.[brand.id] || "0");
        return target > 0;
      })
      .sort((a, b) => {
        const targetA = parseFloat(seller?.target?.[a.id] || "0");
        const targetB = parseFloat(seller?.target?.[b.id] || "0");
        return targetB - targetA; // mayor a menor
      }) || [];

  // Efecto para cargar datos de todas las marcas
  useEffect(() => {
    const fetchAllBrandSales = async () => {
      if (!documentIds || documentIds.length === 0) return;
      if (brandsWithTargets.length === 0) return;
      if (Object.keys(brandSales).length === brandsWithTargets.length) return;

      setIsLoadingBrandData(true);

      try {
        const promises = brandsWithTargets.map(async (brand) => {
          if (brandSales[brand.id]) {
            return { brandId: brand.id, data: brandSales[brand.id] };
          }

          try {
            const result = await getSumsByIdsAndBrand({
              ids: documentIds,
              brand_id: brand.id,
            }).unwrap();

            return {
              brandId: brand.id,
              data: {
                totalAmount: result.totalAmount || 0,
                totalQuantity: result.totalQuantity || 0,
                totalRelativeQuantity: result.totalRelativeQuantity || 0,
              },
            };
          } catch (error) {
            console.error(
              `Error al obtener datos para marca ${brand.name}:`,
              error
            );
            return {
              brandId: brand.id,
              data: {
                totalAmount: 0,
                totalQuantity: 0,
                totalRelativeQuantity: 0,
              },
            };
          }
        });

        const results = await Promise.all(promises);

        const newBrandSales: typeof brandSales = {};
        results.forEach((result) => {
          if (result) {
            newBrandSales[result.brandId] = result.data;
          }
        });

        setBrandSales((prev) => ({ ...prev, ...newBrandSales }));
      } catch (error) {
        console.error("Error al cargar datos de marcas:", error);
      } finally {
        setIsLoadingBrandData(false);
      }
    };

    fetchAllBrandSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentIds, brandsWithTargets.length, seller]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculatePercentage = (sold: number, target: number) => {
    if (target === 0) return 0;
    return Math.min(100, Math.round((sold / target) * 100));
  };

  const getGradientStyle = (percentage: number) => {
    return {
      width: `${percentage}%`,
      background:
        "linear-gradient(90deg, #ef4444 0%, #facc15 50%, #22c55e 100%)",
    };
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100)
      return { bg: "from-green-500 to-emerald-600", text: "text-green-600" };
    if (percentage >= 80)
      return { bg: "from-yellow-500 to-amber-600", text: "text-yellow-600" };
    if (percentage >= 50)
      return { bg: "from-orange-500 to-orange-600", text: "text-orange-600" };
    return { bg: "from-red-500 to-rose-600", text: "text-red-600" };
  };

  const toggleBrand = (brandId: string) => {
    setExpandedBrands((prev) => ({
      ...prev,
      [brandId]: !prev[brandId],
    }));
  };

  // 👉 Nombre a mostrar según contexto
  const displayName = sellerIdProp
    ? seller?.name || `Vendedor ${sellerId}` // si viene por props, usamos el nombre del vendedor
    : userQuery.data?.username || seller?.name || `Vendedor ${sellerId}`; // si no, usuario logueado / fallback

  // Calcular totales generales usando la métrica correcta por marca
  const totalTarget = brandsWithTargets.reduce((sum, brand) => {
    const target = parseFloat(seller?.target?.[brand.id] || "0");
    return sum + target;
  }, 0);

  const totalSold = brandsWithTargets.reduce((sum, brand) => {
    const sales = brandSales[brand.id];
    if (!sales) return sum;

    const usedUnits = isRelativeBrand(brand.id)
      ? sales.totalRelativeQuantity
      : sales.totalQuantity;

    return sum + usedUnits;
  }, 0);

  const totalPercentage = calculatePercentage(totalSold, totalTarget);

  if (isLoadingSeller || isLoadingBrands || isLoadingDocs) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-3" />
        <p className="text-lg font-bold text-gray-700">Cargando datos...</p>
      </div>
    );
  }

  if (!sellerId) {
    return (
      <div className="p-4 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-xl p-6 flex items-center gap-4 max-w-md">
          <AlertCircle className="w-10 h-10 text-red-500 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-red-700">Error</h3>
            <p className="text-sm text-red-600">
              No se encontró ID de vendedor
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(totalPercentage);

  return (
    <PrivateRoute requiredRoles={["VENDEDOR", "ADMINISTRADOR"]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-6 mt-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-blue-500 text-black rounded-b-3xl shadow-2xl p-4 mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            {/* Info del vendedor */}
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{displayName}</h1>
                <p className="text-white/80 text-xs">ID: {seller?.id}</p>
              </div>
            </div>

            <h2 className="text-lg font-bold mb-4">📊 Objetivos de Venta</h2>

            {/* Indicador de carga */}
            {isLoadingBrandData && (
              <div className="bg-white/20 backdrop-blur-lg rounded-xl p-3 mb-3 flex items-center gap-2 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-semibold">Cargando datos...</span>
              </div>
            )}

            {/* Total General */}
            <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border-2 border-white/30">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-xs opacity-90">Objetivo</span>
                  </div>
                  <span className="text-xl font-bold block">
                    {formatNumber(totalTarget)}
                  </span>
                  <span className="text-xs opacity-75">Cant. Relativa</span>
                </div>

                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs opacity-90">Vendidas</span>
                  </div>
                  <span className="text-xl font-bold block">
                    {formatNumber(totalSold)}
                  </span>
                  <span className="text-xs opacity-75">Cant. Relativa</span>
                </div>
              </div>

              {/* Barra de progreso total */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progreso</span>
                  <span className="font-bold">{totalPercentage}%</span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-6 overflow-hidden backdrop-blur-sm">
                  <div
                    className="h-6 transition-all duration-1000 flex items-center justify-end pr-2"
                    style={getGradientStyle(totalPercentage)}
                  >
                    {totalPercentage > 10 && (
                      <span className="text-white text-xs font-bold">
                        {totalPercentage}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mensaje motivacional */}
              <div className="text-center text-xs">
                {totalPercentage >= 100 && "🎉 ¡Objetivo cumplido!"}
                {totalPercentage >= 80 &&
                  totalPercentage < 100 &&
                  "💪 ¡Casi lo logras!"}
                {totalPercentage >= 50 &&
                  totalPercentage < 80 &&
                  "📈 ¡Buen progreso!"}
                {totalPercentage < 50 && "🚀 ¡Vamos! Aún hay tiempo"}
              </div>
            </div>
          </div>
        </div>

        {/* Cards por marca */}
        <div className="px-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white rounded-lg shadow-md">
              <Package className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Por Marcas</h3>
          </div>

          {brandsWithTargets.map((brand) => {
            const target = parseFloat(seller?.target?.[brand.id] || "0");
            const sales = brandSales[brand.id] || {
              totalAmount: 0,
              totalQuantity: 0,
              totalRelativeQuantity: 0,
            };

            // 👉 Métrica que se usa para objetivo / progreso
            const usedUnits = isRelativeBrand(brand.id)
              ? sales.totalRelativeQuantity
              : sales.totalQuantity;

            const percentage = calculatePercentage(usedUnits, target);
            const isExpanded = expandedBrands[brand.id];
            const hasData = brandSales[brand.id] !== undefined;
            const brandStatus = getStatusColor(percentage);
            const missingUnits = Math.max(0, target - usedUnits);

            return (
              <div
                key={brand.id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200 ${
                  !hasData ? "opacity-50" : ""
                }`}
              >
                {/* Header de la card */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      {brand.images && (
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-1.5 flex items-center justify-center shadow flex-shrink-0">
                          <img
                            src={brand.images}
                            alt={brand.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base text-gray-900 truncate">
                          {brand.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="font-mono">{brand.id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      {hasData ? (
                        <>
                          <div
                            className={`text-2xl font-bold ${brandStatus.text}`}
                          >
                            {formatNumber(usedUnits)}
                          </div>
                          <div className="text-xs text-gray-500 font-semibold whitespace-nowrap">
                            de {formatNumber(target)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {isRelativeBrand(brand.id) ? "Litros" : "unidades"}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detalles expandibles */}
                  {isExpanded && hasData && (
                    <div className="mb-3 space-y-2 bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-700 font-medium flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Artículos vendidos
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 block">
                            {Math.round(sales.totalQuantity)}
                          </span>
                          <span className="text-xs text-gray-500">
                            unidades
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-700 font-medium flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          Cantidad en $
                        </span>
                        <span className="font-bold text-gray-900 text-sm">
                          {formatCurrency(sales.totalAmount)}
                        </span>
                      </div>
                      <div className="h-px bg-gray-300 my-1"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-700 font-medium flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" />
                          Objetivo de unidades
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 block">
                            {formatNumber(target)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {isRelativeBrand(brand.id) ? "Litros" : "unidades"}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-700 font-medium">
                          📊 Faltan para el objetivo
                        </span>
                        <div className="text-right">
                          <span
                            className={`font-bold text-sm block ${
                              missingUnits > 0
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            {missingUnits > 0
                              ? formatNumber(missingUnits)
                              : "✓"}
                          </span>
                          {missingUnits > 0 && (
                            <span className="text-xs text-gray-500">
                              {isRelativeBrand(brand.id)
                                ? "Litros"
                                : "unidades"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Barra de progreso */}
                  {hasData && (
                    <>
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1 text-gray-600">
                          <span className="font-semibold">Progreso</span>
                          <span className="font-bold">{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden shadow-inner">
                          <div
                            className="h-5 transition-all duration-1000 flex items-center justify-end pr-1.5"
                            style={getGradientStyle(percentage)}
                          >
                            {percentage > 15 && (
                              <span className="text-white text-xs font-bold">
                                {percentage}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botón expandir */}
                      <button
                        onClick={() => toggleBrand(brand.id)}
                        className="w-full flex items-center justify-center gap-1 text-gray-600 hover:text-purple-600 hover:bg-purple-50 py-2 rounded-lg transition-all font-semibold text-sm"
                      >
                        <span>{isExpanded ? "Ver menos" : "Ver detalles"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* Footer con porcentaje */}
                {hasData && (
                  <div
                    className={`bg-gradient-to-r ${brandStatus.bg} text-white text-center py-2.5 font-bold shadow-inner`}
                  >
                    <div className="flex items-center justify-center gap-1.5 text-sm">
                      {percentage >= 100 && <span>🎉</span>}
                      {percentage >= 80 && percentage < 100 && <span>💪</span>}
                      {percentage >= 50 && percentage < 80 && <span>📈</span>}
                      {percentage < 50 && <span>🚀</span>}
                      <span>{percentage}% completado</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {brandsWithTargets.length === 0 && (
          <div className="mx-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-xl p-6 text-center border-2 border-yellow-200">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-yellow-800 mb-1">
              Sin objetivos
            </h3>
            <p className="text-sm text-yellow-700">
              No hay objetivos configurados
            </p>
          </div>
        )}
      </div>
    </PrivateRoute>
  );
};

// 👈 IMPORTANTE: el default export tiene que ser el componente, NO el tipo
export default SalesTargetsPage;
