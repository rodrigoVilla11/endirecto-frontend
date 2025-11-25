"use client";
import React, { useState, useEffect } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import { FaCheck } from "react-icons/fa";
import { IoMdMenu } from "react-icons/io";
import PrivateRoute from "@/app/context/PrivateRoutes";
import {
  useGetSellersQuery,
  useUpdateSellerTargetBrandMutation,
} from "@/redux/services/sellersApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import Table from "@/app/components/components/Table";
import { useTranslation } from "react-i18next";
import { useGetUsersQuery } from "@/redux/services/usersApi";

const Page = () => {
  const { t } = useTranslation();
  const [selectedSellerId, setSelectedSellerId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery(null);

  const { data: sellersData, isLoading: isLoadingSellers } =
    useGetSellersQuery(null);
  const { data: brands, isLoading: isLoadingBrands } = useGetBrandsQuery(null);
  const [updateTargetBrand, { isLoading: isUpdating }] =
    useUpdateSellerTargetBrandMutation();

  const [savedStatus, setSavedStatus] = useState<{ [key: string]: boolean }>(
    {}
  );

  const [editedTargets, setEditedTargets] = useState<{
    [sellerId: string]: { [brandId: string]: string };
  }>({});

  const sellers = sellersData || [];
  const users = usersData || [];

  const selectedSeller = sellers.find((s) => s.id === selectedSellerId);

  // 👇 helper para mostrar bien el label del vendedor
  const getSellerLabel = (seller: any) => {
    const user = users.find((u: any) => u.seller_id === seller.id);
    const nameToShow = user?.username || seller.name || seller.id;
    return `${nameToShow} (${seller.id})`;
  };

  const tableHeader = [
    { name: "Marca", key: "brand", important: true },
    { name: "Objetivo Actual", key: "currentTarget", important: true },
    { name: "Nuevo Objetivo", key: "newTarget", important: true },
  ];

  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <select
            value={selectedSellerId}
            onChange={(e) => setSelectedSellerId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            disabled={isLoadingSellers || isLoadingUsers}
          >
            <option value="">Seleccionar Vendedor</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {getSellerLabel(seller)}
              </option>
            ))}
          </select>
        ),
      },
      {
        content: (
          <Input
            placeholder="Buscar marca..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
          />
        ),
      },
    ],
    results: selectedSellerId
      ? "Configurando objetivos"
      : "Seleccione un vendedor",
  };

  // Inicializar targets editados cuando se selecciona un vendedor
  useEffect(() => {
    if (selectedSeller && brands) {
      const initialTargets: { [brandId: string]: string } = {};
      brands.forEach((brand) => {
        initialTargets[brand.id] =
          (selectedSeller.target as Record<string, string | undefined>)?.[
            brand.id
          ] || "0";
      });
      setEditedTargets((prev) => ({
        ...prev,
        [selectedSellerId]: initialTargets,
      }));
    }
  }, [selectedSellerId, selectedSeller, brands]);

  const handleTargetChange = (brandId: string, value: string) => {
    setEditedTargets((prev) => ({
      ...prev,
      [selectedSellerId]: {
        ...prev[selectedSellerId],
        [brandId]: value,
      },
    }));
  };

  const handleSave = async (brandId: string) => {
    if (!selectedSellerId) return;

    const updatedValue = editedTargets[selectedSellerId]?.[brandId] || "0";

    try {
      const result = await updateTargetBrand({
        id: selectedSellerId,
        brand_id: brandId,
        value: updatedValue,
      }).unwrap();

      console.log("Respuesta exitosa:", result);

      setSavedStatus((prev) => ({ ...prev, [brandId]: true }));

      setTimeout(() => {
        setSavedStatus((prev) => ({ ...prev, [brandId]: false }));
      }, 2000);
    } catch (error: any) {
      console.error("Error al actualizar:", error);
      alert(
        `Error al guardar el objetivo: ${error.data?.message || error.message}`
      );
    }
  };

  // Filtrar marcas según búsqueda
  const filteredBrands =
    brands?.filter(
      (brand) =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.id.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const tableData =
    selectedSellerId && selectedSeller
      ? filteredBrands.map((brand) => {
          const currentTarget =
            (selectedSeller.target as Record<string, string | undefined>)?.[
              brand.id
            ] || "0";
          const editedValue =
            editedTargets[selectedSellerId]?.[brand.id] || currentTarget;

          return {
            key: brand.id,
            brand: (
              <div className="flex items-center gap-3">
                {brand.images && (
                  <img
                    src={brand.images}
                    alt={brand.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                )}
                <div>
                  <div className="font-semibold">{brand.name}</div>
                  <div className="text-xs text-gray-500">{brand.id}</div>
                </div>
              </div>
            ),
            currentTarget: (
              <div className="text-center font-semibold">{currentTarget}</div>
            ),
            newTarget: (
              <div className="flex items-center justify-center space-x-2">
                <input
                  type="number"
                  value={editedValue}
                  onChange={(e) => handleTargetChange(brand.id, e.target.value)}
                  className="w-32 text-center border border-gray-300 rounded-md px-2 py-1"
                  placeholder="0"
                />
                <button
                  onClick={() => handleSave(brand.id)}
                  disabled={isUpdating}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                >
                  Guardar
                </button>
                {savedStatus[brand.id] && (
                  <FaCheck className="text-green-500 animate-fade-out" />
                )}
              </div>
            ),
          };
        })
      : [];

  if (isLoadingSellers || isLoadingBrands || isLoadingUsers) {
    return <div className="p-4">Cargando...</div>;
  }

  // usuario asociado al vendedor seleccionado (para el cartel)
  const selectedUser =
    selectedSeller && users.find((u: any) => u.seller_id === selectedSeller.id);

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR", "OPERADOR"]}>
      <div className="gap-4">
        <h3 className="font-bold p-4">Objetivos de Vendedores por Marca</h3>
        <Header headerBody={headerBody} />

        {!selectedSellerId ? (
          <div className="p-8 text-center text-gray-500">
            Seleccione un vendedor para configurar sus objetivos
          </div>
        ) : (
          <>
            <div className="px-4 py-2 bg-blue-50 border-l-4 border-blue-500">
              <p className="text-sm text-gray-700">
                Configurando objetivos para:{" "}
                <span className="font-bold">
                  {selectedUser?.username || selectedSeller?.name} (
                  {selectedSeller?.id})
                </span>
              </p>
            </div>
            <Table headers={tableHeader} data={tableData} />
          </>
        )}
      </div>

      {/* Estilos para la animación */}
      <style jsx>{`
        @keyframes fadeOut {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.5);
          }
        }
        .animate-fade-out {
          animation: fadeOut 2s forwards;
        }
      `}</style>
    </PrivateRoute>
  );
};

export default Page;
