"use client";
import React, { useState, useEffect } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import { IoMdMenu } from "react-icons/io";
import { FaCheck } from "react-icons/fa";
import PrivateRoute from "@/app/context/PrivateRoutes";
import {
  useCreateCustomersItemsMutation,
  useGetCustomersItemsByCustomerQuery,
  useUpdateCustomersItemsMutation,
} from "@/redux/services/customersItemsApi";
import { useClient } from "@/app/context/ClientContext";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useGetItemsQuery } from "@/redux/services/itemsApi";
import Table from "@/app/components/components/Table";
import Modal from "@/app/components/components/Modal";
import UpdateMassive from "./UpdateMassive";
import { useTranslation } from "react-i18next";

const Page = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const { selectedClientId } = useClient();

  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [createCustomersItems] = useCreateCustomersItemsMutation();
  const [updateCustomersItems] = useUpdateCustomersItemsMutation();

  const openUpdateModal = () => {
    setUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    refetch();
  };

  // Obtención de los items
  const { data: items = [] } = useGetItemsQuery(null);

  const {
    data: customersItems = [],
    isLoading,
    refetch,
  } = useGetCustomersItemsByCustomerQuery(
    selectedClientId ? { customer_id: selectedClientId } : skipToken
  );

  const [editedMargins, setEditedMargins] = useState<{ [key: string]: number }>({});

  // Estado para controlar la animación de guardado por cada registro
  const [savedStatus, setSavedStatus] = useState<{ [key: string]: boolean }>({});

  const tableHeader = [
    { name: t("page1.table.item"), key: "item", important: true },
    { name: t("page1.table.margin"), key: "margin", important: true },
  ];

  const headerBody = {
    buttons: [
      {
        logo: <IoMdMenu />,
        title: t("page1.header.massiveChange"),
        onClick: openUpdateModal,
      },
    ],
    filters: [
      {
        content: <Input placeholder={t("page1.header.searchPlaceholder")} />,
      },
    ],
    results: t("page1.header.results", { count: customersItems.length }),
  };

  useEffect(() => {
    if (
      !isLoading &&
      customersItems &&
      items &&
      selectedClientId
    ) {
      const missingItems = items.filter(
        (item) => !customersItems.some((ci) => ci.item_id === item.id)
      );

      if (missingItems.length > 0) {
        Promise.all(
          missingItems.map((item) =>
            createCustomersItems({
              margin: 0,
              item_id: item.id,
              customer_id: selectedClientId,
            })
          )
        ).then(() => {
          refetch(); // Refetch después de crear los ítems
        });
      }
    }
  }, [customersItems, items, selectedClientId, createCustomersItems, isLoading, refetch]);

  const handleMarginChange = (id: string, value: number) => {
    setEditedMargins((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSave = async (id: string) => {
    const updatedMargin = editedMargins[id];

    if (isNaN(updatedMargin) || updatedMargin < 0) {
      alert(t("page1.invalidMarginAlert"));
      return;
    }

    try {
      await updateCustomersItems({
        _id: id,
        margin: updatedMargin,
      }).unwrap();

      // Limpiamos el valor editado para este registro
      setEditedMargins((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      // Activamos la animación para este registro
      setSavedStatus((prev) => ({ ...prev, [id]: true }));
      refetch();

      // Desactivamos la animación después de 2 segundos
      setTimeout(() => {
        setSavedStatus((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (error) {
      console.error("Error al actualizar el margin", error);
    }
  };

  const tableData =
    customersItems?.map((customerItem) => {
      const item = items?.find((data) => data.id === customerItem.item_id);
      return {
        key: customerItem._id,
        item: item ? item.name : t("page1.table.unknown"),
        margin: (
          <div className="flex items-center justify-center space-x-2">
            <input
              type="number"
              value={editedMargins[customerItem._id] ?? customerItem.margin}
              onChange={(e) =>
                handleMarginChange(
                  customerItem._id,
                  parseFloat(e.target.value)
                )
              }
              className="w-16 text-center border border-gray-300 rounded-md"
            />
            <button
              onClick={() => handleSave(customerItem._id)}
              className="px-3 py-1 bg-blue-500 text-white rounded-md"
            >
              {t("page1.table.save")}
            </button>
            {savedStatus[customerItem._id] && (
              <FaCheck className="text-green-500 animate-fade-out" />
            )}
          </div>
        ),
      };
    }) || [];

  if (!selectedClientId) {
    return <div className="flex justify-center items-center">{t("page1.selectClient")}</div>;
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
        <h3 className="font-bold p-4">{t("page1.title")}</h3>
        <Header headerBody={headerBody} />
        {!isLoading && customersItems.length > 0 && (
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
