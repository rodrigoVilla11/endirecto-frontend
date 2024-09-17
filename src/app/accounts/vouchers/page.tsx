'use client'
import React, { useState } from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { useCountCustomersQuery, useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetDocumentsPagQuery, useGetDocumentsQuery } from "@/redux/services/documentsApi";

const page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { data, error, isLoading, refetch } = useGetDocumentsPagQuery({
    page,
    limit,
  });
  const { data: countDocumentsData } = useCountCustomersQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  
  const tableData = data?.map((document) => {
    const customer = customersData?.find((data) => data.id == document.customer_id)
    const seller = sellersData?.find((data) => data.id == document.seller_id)

    return {
      key: document.id,
      id: <IoInformationCircleOutline className="text-center text-xl" />,
      customer: customer ? `${customer?.id} - ${customer?.name}` : "NOT FOUND",
      type: document.type,
      number: document.number,
      date: document.date,
      amount: document.amount,
      balance: document.amount,
      expiration: document.expiration_date,
      logistic: document.expiration_status,
      seller: seller?.name || "NOT FOUND"
    };
  });

  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    { name: "Type", key: "type" }, 
    { name: "Number", key: "number" },
    { name: "Date", key: "date" },
    { name: "Amount", key: "amount" },
    { name: "Balance", key: "balance" },
    { name: "Expiration", key: "expiration" },
    { name: "Logistic", key: "logistic" },
    { name: "Seller", key: "seller" },

  ];
  const headerBody = {
    buttons: [
      {
        logo: <AiOutlineDownload/>,
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
        content: <Input placeholder={"Search..."}/>,
      }
    ],
    results: `${countDocumentsData || 0} Results`,
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
    <div className="gap-4">
      <h3 className="font-bold p-4">VOUCHERS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData}/>
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
  );
};

export default page;
