"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useGetSellerByIdQuery } from "@/redux/services/sellersApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { 
  useGetDocumentIdsBySellerQuery 
} from "@/redux/services/documentsApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useGetSumsByIdsAndBrandQuery } from "@/redux/services/documentsDetailsApi";

const SalesTargetsPage = () => {
  const { userData } = useAuth();
  const sellerId = userData?.seller_id;

  // Calcular fechas del mes actual
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
  
  const startDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
  const endDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;

  // Queries
  const { data: seller, isLoading: isLoadingSeller } = useGetSellerByIdQuery(
    { id: sellerId! },
    { skip: !sellerId }
  );
  
  const { data: brands, isLoading: isLoadingBrands } = useGetBrandsQuery(null);
  
  const { data: documentIds, isLoading: isLoadingDocs } = useGetDocumentIdsBySellerQuery(
    {
      seller_id: sellerId!,
      startDate,
      endDate,
    },
    { skip: !sellerId }
  );

  const [activeBrandIndex, setActiveBrandIndex] = useState(0);
  const [brandSales, setBrandSales] = useState<{
    [brandId: string]: {
      totalAmount: number;
      totalQuantity: number;
      totalRelativeQuantity: number;
    };
  }>({});
  const [expandedBrands, setExpandedBrands] = useState<{[key: string]: boolean}>({});

  // Filtrar marcas con objetivo
  const brandsWithTargets = brands?.filter(brand => {
    const target = parseFloat(seller?.target?.[brand.id] || "0");
    return target > 0;
  }) || [];

  // Query para la marca actual
  const currentBrand = brandsWithTargets[activeBrandIndex];
  const { data: currentBrandSums, isLoading: isLoadingCurrentBrand } = useGetSumsByIdsAndBrandQuery(
    documentIds && currentBrand
      ? {
          ids: documentIds,
          brand_id: currentBrand.id,
        }
      : skipToken
  );

  // Guardar los resultados en el estado cuando se obtienen
  useEffect(() => {
    if (currentBrandSums && currentBrand) {
      setBrandSales(prev => ({
        ...prev,
        [currentBrand.id]: {
          totalAmount: currentBrandSums.totalAmount || 0,
          totalQuantity: currentBrandSums.totalQuantity || 0,
          totalRelativeQuantity: currentBrandSums.totalRelativeQuantity || 0,
        }
      }));

      // Pasar a la siguiente marca si hay más
      if (activeBrandIndex < brandsWithTargets.length - 1) {
        setTimeout(() => {
          setActiveBrandIndex(prev => prev + 1);
        }, 100); // Pequeño delay para evitar sobrecarga
      }
    }
  }, [currentBrandSums, currentBrand, activeBrandIndex, brandsWithTargets.length]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
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
      background: "linear-gradient(90deg, #ef4444 0%, #facc15 50%, #22c55e 100%)",
    };
  };

  const toggleBrand = (brandId: string) => {
    setExpandedBrands(prev => ({
      ...prev,
      [brandId]: !prev[brandId]
    }));
  };

  // Calcular totales generales
  const totalTarget = brandsWithTargets.reduce((sum, brand) => {
    const target = parseFloat(seller?.target?.[brand.id] || "0");
    return sum + target;
  }, 0);

  const totalSold = Object.values(brandSales).reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );

  const totalPercentage = calculatePercentage(totalSold, totalTarget);

  // Verificar si todavía está cargando datos
  const isLoadingBrandData = activeBrandIndex < brandsWithTargets.length - 1 || isLoadingCurrentBrand;

  if (isLoadingSeller || isLoadingBrands || isLoadingDocs) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando datos iniciales...</div>
      </div>
    );
  }

  if (!sellerId) {
    return (
      <div className="p-4">
        <div className="bg-red-100 text-red-700 p-4 rounded">
          No se encontró ID de vendedor
        </div>
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["VENDEDOR", "ADMINISTRADOR"]}>
      <div className="min-h-screen bg-gray-100 p-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 text-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {seller?.name} - {seller?.id}
          </h1>
          <h2 className="text-3xl font-bold mb-4">Objetivos mensuales de venta</h2>
          
          {/* Indicador de carga */}
          {isLoadingBrandData && (
            <div className="bg-white/20 backdrop-blur rounded-xl p-2 mb-2 text-center text-sm">
              Cargando datos de marcas... ({activeBrandIndex + 1}/{brandsWithTargets.length})
            </div>
          )}
          
          {/* Total General */}
          <div className="bg-white/20 backdrop-blur rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg">Objetivo de venta</span>
              <span className="text-2xl font-bold">{formatCurrency(totalTarget)}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg">Vendido</span>
              <span className="text-2xl font-bold">{formatCurrency(totalSold)}</span>
            </div>
            
            {/* Barra de progreso total */}
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className="h-6 transition-all duration-500"
                style={getGradientStyle(totalPercentage)}
              />
            </div>
            <div className="text-center text-xl font-bold mt-2">
              {totalPercentage}%
            </div>
          </div>
        </div>

        {/* Cards por marca */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-700 mb-2">Por marcas</h3>
          
          {brandsWithTargets.map((brand) => {
            const target = parseFloat(seller?.target?.[brand.id] || "0");
            const sales = brandSales[brand.id] || {
              totalAmount: 0,
              totalQuantity: 0,
              totalRelativeQuantity: 0,
            };
            const percentage = calculatePercentage(sales.totalAmount, target);
            const isExpanded = expandedBrands[brand.id];
            const hasData = brandSales[brand.id] !== undefined;

            return (
              <div
                key={brand.id}
                className={`bg-white rounded-xl shadow-md overflow-hidden ${!hasData ? 'opacity-50' : ''}`}
              >
                {/* Header de la card */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {brand.images && (
                        <img
                          src={brand.images}
                          alt={brand.name}
                          className="h-12 w-12 object-contain"
                        />
                      )}
                      <div>
                        <div className="font-bold text-lg">{brand.name}</div>
                        <div className="text-sm text-gray-500">{brand.id}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {hasData ? (
                        <>
                          <div className="text-green-600 font-bold">
                            {formatCurrency(sales.totalAmount)}
                          </div>
                          <div className="text-gray-600 text-sm">
                            /{formatCurrency(target)}
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-400 text-sm">Cargando...</div>
                      )}
                    </div>
                  </div>

                  {/* Detalles expandibles */}
                  {isExpanded && hasData && (
                    <div className="mb-3 space-y-2 text-sm bg-gray-50 p-3 rounded">
                      <div className="flex justify-between">
                        <span>Cantidad de artículos vendidos</span>
                        <span className="font-semibold">
                          {Math.round(sales.totalQuantity)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Objetivo de venta de la marca</span>
                        <span className="font-semibold">
                          {formatCurrency(target)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Barra de progreso */}
                  {hasData && (
                    <>
                      <div className="mb-2">
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div
                            className="h-4 transition-all duration-500"
                            style={getGradientStyle(percentage)}
                          />
                        </div>
                      </div>

                      {/* Botón expandir */}
                      <button
                        onClick={() => toggleBrand(brand.id)}
                        className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900"
                      >
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    </>
                  )}
                </div>

                {/* Footer con porcentaje */}
                {hasData && (
                  <div className={`${
                    percentage >= 100 ? 'bg-green-500' :
                    percentage >= 80 ? 'bg-yellow-500' :
                    percentage >= 50 ? 'bg-orange-500' : 'bg-red-500'
                  } text-white text-center py-2 font-bold`}>
                    {percentage}%
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {brandsWithTargets.length === 0 && (
          <div className="bg-yellow-100 text-yellow-700 p-4 rounded-xl text-center">
            No hay objetivos configurados para este vendedor
          </div>
        )}
      </div>
    </PrivateRoute>
  );
};

export default SalesTargetsPage;