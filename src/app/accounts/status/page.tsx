"use client";
import React, { useEffect, useState } from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import {
  useCountDocumentsQuery,
  useGetDocumentsPagQuery,
  useSumAmountsQuery,
} from "@/redux/services/documentsApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import PrivateRoute from "@/app/context/PrivateRoutes";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useClient } from "@/app/context/ClientContext";
import { FaPlus } from "react-icons/fa";
import Modal from "@/app/components/components/Modal";
import CreateInstanceComponent from "./CreateInstance";
import Instance from "./Instance";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedClientId } = useClient();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [customer_id, setCustomer_id] = useState("");

  const { data, error, isLoading, refetch } = useGetDocumentsPagQuery({
    page,
    limit,
    query: searchQuery,
    startDate: startDate ? startDate.toISOString() : undefined,
    endDate: endDate ? endDate.toISOString() : undefined,
    customer_id,
  });

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    refetch();
  };

  useEffect(() => {
    if (selectedClientId) {
      setCustomer_id(selectedClientId);
      refetch;
    } else {
      setCustomer_id("");
      refetch;
    }
  }, [selectedClientId]);
  const { data: countDocumentsData } = useCountDocumentsQuery(null);
  const { data: sumAmountsData } = useSumAmountsQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  
  const tableData = data?.map((document) => {
    const customer = customersData?.find(
      (data) => data.id == document.customer_id
    );
    const seller = sellersData?.find((data) => data.id == document.seller_id);

    return {
      key: document.id,
      id: (
        <div className="flex justify-center items-center">
          <IoInformationCircleOutline className="text-center text-xl" />
        </div>
      ),
      customer: customer ? `${customer?.id} - ${customer?.name}` : "NOT FOUND",
      type: document.type,
      number: document.number,
      date: document.date,
      amount: document.amount,
      balance: document.amount,
      expiration: document.expiration_date,
      logistic: document.expiration_status,
      seller: seller?.name || "NOT FOUND",
    };
  });

  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    { name: "Customer", key: "customer" },
    { name: "Type", key: "type" },
    { name: "Number", key: "number" },
    { name: "Date", key: "date" },
    { name: "Amount", key: "amount" },
    { name: "Balance", key: "balance" },
    { name: "Expiration", key: "expiration" },
    { name: "Logistic", key: "logistic" },
    { name: "Seller", key: "seller" },
  ];

  const sumAmountsDataFilter = tableData?.reduce((acc, document) => {
    const amount = parseFloat(document.amount);
    return acc + amount;
  }, 0);
  const formatedSumAmountFilter = sumAmountsDataFilter?.toLocaleString(
    "es-ES",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
  const formatedSumAmount = sumAmountsData?.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const headerBody = {
    buttons: [
      {
        logo: <AiOutlineDownload />,
        title: "Download",
      },
      { logo: <FaPlus />, title: "New Instance", onClick: openCreateModal },
    ],
    filters: [
      {
        content: (
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Date From"
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
      {
        content: (
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="Date To"
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
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
    secondSection: {
      title: "Total Owed",
      amount: selectedClientId
        ? `$ ${formatedSumAmountFilter}`
        : `$ ${formatedSumAmount}`,
    },
    results: searchQuery
      ? `${data?.length || 0} Results`
      : `${countDocumentsData || 0} Results`,
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countDocumentsData || 0) / limit)) {
      setPage(page + 1);
    }
  };

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
        <h3 className="font-bold p-4">STATUS</h3>
        <Header headerBody={headerBody} />
        <Instance selectedClientId={selectedClientId}/>
        <Table headers={tableHeader} data={tableData} />

        <div className="flex justify-between items-center p-4">
          <button
            onClick={handlePreviousPage}
            disabled={page === 1}
            className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <p>
            Page {page} of {Math.ceil((countDocumentsData || 0) / limit)}
          </p>
          <button
            onClick={handleNextPage}
            disabled={page === Math.ceil((countDocumentsData || 0) / limit)}
            className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <CreateInstanceComponent closeModal={closeCreateModal} />
      </Modal>
    </PrivateRoute>
  );
};

export default Page;
