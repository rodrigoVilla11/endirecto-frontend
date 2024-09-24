"use client";
import React, { useState } from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { MdOutlineEmail } from "react-icons/md";
import { FaRegFilePdf } from "react-icons/fa6";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import {
  useCountCollectionQuery,
  useGetCollectionsPagQuery,
  useUpdateCollectionMutation,
} from "@/redux/services/collectionsApi";
import { FaPlus } from "react-icons/fa";
import Modal from "@/app/components/components/Modal";
import CreatePaymentComponent from "./CreatePayment";
import { format } from "date-fns";

enum status {
  "PENDING" = "PENDING",
  SENDED = "SENDED",
  SUMMARIZED = "SUMMARIZED",
  CHARGED = "CHARGED",
  CANCELED = "CANCELED",
}

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [updateCollection, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateCollectionMutation();
  const [searchQuery, setSearchQuery] = useState("");

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);

  const { data, error, isLoading, refetch } = useGetCollectionsPagQuery({
    page,
    limit,
    query: searchQuery,
  });
  const { data: countCollectionsData } = useCountCollectionQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const handleChangeStatus = async (
    collectionId: string,
    newStatus: status
  ) => {
    try {
      await updateCollection({
        _id: collectionId,
        status: newStatus,
      }).unwrap();
      refetch(); // Refrescar los datos después de la actualización
    } catch (error) {
      console.error("Error al actualizar el estado de la colección:", error);
    }
  };

  const tableData = data?.map((collection) => {
    const customer = customersData?.find(
      (data) => data.id == collection.customer_id
    );
    const seller = sellersData?.find((data) => data.id == collection.seller_id);

    return {
      key: collection._id,
      detail: <IoInformationCircleOutline className="text-center text-xl" />,
      email: <MdOutlineEmail className="text-center text-xl" />,
      pdf: <FaRegFilePdf className="text-center text-xl" />,
      customer: customer ? `${customer?.id} - ${customer?.name}` : "NOT FOUND",
      number: collection.number,
      date: collection.date
        ? format(new Date(collection.date), "dd/MM/yyyy HH:mm")
        : "N/A",
      amount: collection.amount,
      status: collection.status,
      changeStatus: (
        <select
          value={collection.status}
          onChange={(e) =>
            handleChangeStatus(collection._id, e.target.value as status)
          }
        >
          <option value="">Change Status</option>
          {Object.values(status).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      ),
      seller: seller?.name || "NOT FOUND",
    };
  });

  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    {
      component: <MdOutlineEmail className="text-center text-xl" />,
      key: "mail",
    },
    {
      component: <FaRegFilePdf className="text-center text-xl" />,
      key: "pdf",
    },
    { name: "Customer", key: "customer" },
    { name: "Number", key: "number" },
    { name: "Date", key: "date" },
    { name: "Amount", key: "amount" },
    { name: "Status", key: "status" },
    { name: "Change Status", key: "change-status" },
    { name: "Seller", key: "seller" },
  ];

  const headerBody = {
    buttons: [
      {
        logo: <FaPlus />,
        title: "New",
        onClick: openCreateModal,
      },
      {
        logo: <AiOutlineDownload />,
        title: "Download",
      },
    ],
    filters: [
      {
        content: <Input placeholder={"Date From dd/mm/aaaa"} />,
      },
      {
        content: <Input placeholder={"Date To dd/mm/aaaa"} />,
      },
      {
        content: (
          <select>
            <option value="Status...">Status...</option>
          </select>
        ),
      },
      {
        content: (
          <Input
            placeholder={"Search..."}
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            onKeyDown={(e: any) => {
              if (e.key === "Enter") {
                refetch();
              }
            }}
          />
        ),
      },
    ],
    results: searchQuery
      ? `${data?.length || 0} Results`
      : `${countCollectionsData || 0} Results`,
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countCollectionsData || 0) / limit)) {
      setPage(page + 1);
    }
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">PAYMENTS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData} />

      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CreatePaymentComponent closeModal={closeCreateModal} />
      </Modal>

      <div className="flex justify-between items-center p-4">
        <button
          onClick={handlePreviousPage}
          disabled={page === 1}
          className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <p>
          Page {page} of {Math.ceil((countCollectionsData || 0) / limit)}
        </p>
        <button
          onClick={handleNextPage}
          disabled={page === Math.ceil((countCollectionsData || 0) / limit)}
          className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Page;
