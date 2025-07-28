"use client";
import React, { useState, useEffect } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import { FaImage, FaCheck } from "react-icons/fa";
import { IoMdMenu } from "react-icons/io";
import PrivateRoute from "@/app/context/PrivateRoutes";
import {
  useCreateCustomersBrandsMutation,
  useGetCustomersBrandsByCustomerQuery,
  useUpdateCustomersBrandsMutation,
} from "@/redux/services/customersBrandsApi";
import { useClient } from "@/app/context/ClientContext";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import Table from "@/app/components/components/Table";
import Modal from "@/app/components/components/Modal";
import UpdateMassive from "./UpdateMassive";
import { useTranslation } from "react-i18next";

const Page = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const { selectedClientId } = useClient();
  const { data: brands } = useGetBrandsQuery(null);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [
    createCustomersBrands,
    { isLoading: isLoadingCreate, isSuccess, isError },
  ] = useCreateCustomersBrandsMutation();
  const [updateCustomersBrands, { isLoading: isUpdating }] =
    useUpdateCustomersBrandsMutation();

  // Estado para controlar la animación de "guardado" por cada registro
  const [savedStatus, setSavedStatus] = useState<{ [key: string]: boolean }>(
    {}
  );

  const openUpdateModal = () => {
    setUpdateModalOpen(true);
  };
  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    refetch();
  };

  const {
    data: customersBrands = [],
    error,
    isLoading,
    refetch,
  } = useGetCustomersBrandsByCustomerQuery(
    selectedClientId ? { customer_id: selectedClientId } : skipToken
  );

  const [editedMargins, setEditedMargins] = useState<{ [key: string]: number }>(
    {}
  );

  const tableHeader = [
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: t("page.table.brand"), key: "brand", important: true },
    { name: t("page.table.margin"), key: "margin", important: true },
  ];

  const headerBody = {
    buttons: [
      {
        logo: <IoMdMenu />,
        title: t("page.header.massiveChange"),
        onClick: openUpdateModal,
      },
    ],
    filters: [
      {
        content: <Input placeholder={t("page.header.searchPlaceholder")} />,
      },
    ],
    results: t("page.header.results"),
  };

  useEffect(() => {
    const addMissingBrands = async () => {
      if (!isLoading && customersBrands && brands && selectedClientId) {
        const brandsToCreate = brands.filter(
          (brand) => !customersBrands.some((item) => item.brand_id === brand.id)
        );

        if (brandsToCreate.length > 0) {
          await Promise.all(
            brandsToCreate.map((brand) =>
              createCustomersBrands({
                margin: 50,
                brand_id: brand.id,
                customer_id: selectedClientId,
              })
            )
          );

          // Espera que se creen antes de hacer el refetch
          refetch();
        }
      }
    };

    addMissingBrands();
  }, [
    isLoading,
    customersBrands.length,
    brands,
    selectedClientId,
    createCustomersBrands,
  ]);

  const handleMarginChange = (id: string, value: number) => {
    setEditedMargins((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSave = (id: string) => {
    const updatedMargin = editedMargins[id];
    updateCustomersBrands({
      _id: id,
      margin: updatedMargin,
    })
      .then(() => {
        // Activa la animación para este registro
        setSavedStatus((prev) => ({ ...prev, [id]: true }));
        refetch();
        // Después de 2 segundos, se oculta el ícono
        setTimeout(() => {
          setSavedStatus((prev) => ({ ...prev, [id]: false }));
        }, 2000);
      })
      .catch((error) => {
        console.error("Error al actualizar el margin", error);
      });
  };

const tableData =
  customersBrands
    ?.map((customersBrand) => {
      const brand = brands?.find((data) => data.id === customersBrand.brand_id);
      if (!brand) return null; // ❌ si no hay brand, no renderizamos nada

      return {
        key: customersBrand._id,
        image: (
          <div className="flex justify-center items-center">
            {brand.images ? (
              <img
                src={brand.images}
                alt={brand.name}
                className="h-10 w-10 object-cover"
              />
            ) : (
              t("page.table.noImage")
            )}
          </div>
        ),
        brand: brand.name,
        margin: (
          <div className="flex items-center justify-center space-x-2">
            <input
              type="number"
              value={editedMargins[customersBrand._id] ?? customersBrand.margin}
              onChange={(e) =>
                handleMarginChange(
                  customersBrand._id,
                  parseFloat(e.target.value)
                )
              }
              className="w-16 text-center border border-gray-300 rounded-md"
            />
            <button
              onClick={() => handleSave(customersBrand._id)}
              className="px-3 py-1 bg-blue-500 text-white rounded-md"
            >
              Save
            </button>
            {savedStatus[customersBrand._id] && (
              <FaCheck className="text-green-500 animate-fade-out" />
            )}
          </div>
        ),
      };
    })
    .filter(Boolean) || [];

  if (!selectedClientId) {
    return <div>{t("page.selectClient")}</div>;
  }

  return (
    <PrivateRoute
      requiredRoles={[
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ]}
    >
      <div className="gap-4">
        <h3 className="font-bold p-4">{t("page.title")}</h3>
        <Header headerBody={headerBody} />
        {!isLoading && customersBrands.length > 0 && (
          <Table headers={tableHeader} data={tableData} />
        )}
      </div>
      <Modal isOpen={isUpdateModalOpen} onClose={closeUpdateModal}>
        {selectedClientId && (
          <UpdateMassive
            customer_id={selectedClientId}
            closeModal={closeUpdateModal}
          />
        )}
      </Modal>
      {/* Agrega estilos para la animación */}
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
