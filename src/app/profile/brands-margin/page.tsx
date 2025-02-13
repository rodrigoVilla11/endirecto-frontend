"use client";
import React, { useState, useEffect } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import { FaImage } from "react-icons/fa";
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

const Page = () => {
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

    const openUpdateModal = () => {
      setUpdateModalOpen(true);
    };
    const closeUpdateModal = () => {
      setUpdateModalOpen(false);
      refetch();
    };

  const {
    data: customersBrands = [], // Inicializa como un array vacío si no hay datos
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
    { name: "Brand", key: "brand", important: true },
    { name: "Margin", key: "margin", important: true },
  ];

  const headerBody = {
    buttons: [
      {
        logo: <IoMdMenu />,
        title: "Massive Change",
        onClick: openUpdateModal
      },
    ],
    filters: [
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "1 Results",
  };

  useEffect(() => {
    if (
      !isLoading &&
      customersBrands.length === 0 &&
      brands &&
      selectedClientId
    ) {
      brands.forEach((brand) => {
        // Verifica si ya existe un customersBrand con esta marca y cliente
        const existingBrand = customersBrands.find(
          (item) => item.brand_id === brand.id
        );

        if (!existingBrand) {
          // Crear una nueva entrada de customersBrands para cada brand que no exista
          createCustomersBrands({
            margin: 50,
            brand_id: brand.id,
            customer_id: selectedClientId,
          });
        }
      });
    }
  }, [
    customersBrands,
    brands,
    selectedClientId,
    createCustomersBrands,
    isLoading,
  ]);

  const handleMarginChange = (id: string, value: number) => {
    setEditedMargins((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSave = (id: string) => {
    const updatedMargin = editedMargins[id];

    // Enviar la actualización a la API
    updateCustomersBrands({
      _id: id,
      margin: updatedMargin,
    })
      .then(() => {
        refetch();
      })
      .catch((error) => {
        console.error("Error al actualizar el margin", error);
      });
  };

  const tableData =
    customersBrands?.map((customersBrand) => {
      const brand = brands?.find((data) => data.id === customersBrand.brand_id);

      return {
        key: customersBrand._id,
        image: (
          <div className="flex justify-center items-center">
            {brand?.images ? (
              <img
                src={brand.images}
                alt={brand.name}
                className="h-10 w-10 object-cover"
              />
            ) : (
              "No Image"
            )}
          </div>
        ),
        brand: brand ? brand.name : "Unknown", // Si no se encuentra la marca, asigna "Unknown"
        margin: (
          <div className="flex items-center justify-center space-x-2">
            <input
              type="number"
              value={editedMargins[customersBrand._id] || customersBrand.margin}
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
          </div>
        ),
      };
    }) || [];

  if (!selectedClientId) {
    return <div>Please select a client</div>;
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
        <h3 className="font-bold p-4">MARGINS BY BRAND</h3>
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
    </PrivateRoute>
  );
};

export default Page;
