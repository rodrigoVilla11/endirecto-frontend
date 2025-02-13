"use client";
import React, { useState, useEffect } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import { IoMdMenu } from "react-icons/io";
import PrivateRoute from "@/app/context/PrivateRoutes";
import {
  useCreateCustomersItemsMutation,
  useGetCustomersItemsByCustomerQuery,
  useUpdateCustomersItemsMutation,
} from "@/redux/services/customersItemsApi";
import { useClient } from "@/app/context/ClientContext";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useGetItemsQuery } from "@/redux/services/itemsApi"; // Asegúrate de tener esta consulta
import Table from "@/app/components/components/Table";
import Modal from "@/app/components/components/Modal";
import UpdateMassive from "./UpdateMassive";

const Page = () => {
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

  // Obtención de los items (agregada)
  const { data: items = [] } = useGetItemsQuery(null);

  const {
    data: customersItems = [],
    isLoading,
    refetch,
  } = useGetCustomersItemsByCustomerQuery(
    selectedClientId ? { customer_id: selectedClientId } : skipToken
  );

  const [editedMargins, setEditedMargins] = useState<{ [key: string]: number }>({});

  const tableHeader = [
    { name: "Item", key: "item", important: true },
    { name: "Margin", key: "margin", important: true },
  ];

  const headerBody = {
    buttons: [
      {
        logo: <IoMdMenu />,
        title: "Massive Change",
        onClick: openUpdateModal,
      },
    ],
    filters: [
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: `${customersItems.length} Results`,
  };

  useEffect(() => {
    if (
      !isLoading &&
      customersItems.length === 0 &&
      items.length > 0 &&
      selectedClientId
    ) {
      const missingItems = items.filter(
        (item) =>
          !customersItems.some((ci) => ci.item_id === item.id)
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
  }, [customersItems, items, selectedClientId, createCustomersItems, isLoading]);
  
  
  const handleMarginChange = (id: string, value: number) => {
    setEditedMargins((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSave = async (id: string) => {
    const updatedMargin = editedMargins[id];
  
    if (isNaN(updatedMargin) || updatedMargin < 0) {
      alert("Please enter a valid positive number.");
      return;
    }
  
    try {
      await updateCustomersItems({
        _id: id,
        margin: updatedMargin,
      }).unwrap();
  
      setEditedMargins((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
  
      refetch();
    } catch (error) {
      console.error("Error al actualizar el margin", error);
    }
  };
  
  const tableData =
    customersItems?.map((customerItem) => {
      const item = items?.find((data) => data.id === customerItem.item_id);

      return {
        key: customerItem._id,
        item: item ? item.name : "Unknown", // Ahora estamos trabajando con item.name
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
        <h3 className="font-bold p-4">MARGINS BY ITEM</h3>
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
    </PrivateRoute>
  );
};

export default Page;
