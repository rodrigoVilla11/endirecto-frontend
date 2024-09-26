"use client";
import React, { useState } from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaRegFilePdf } from "react-icons/fa";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import {
  useCountCollectionQuery,
  useGetCollectionsPagQuery,
} from "@/redux/services/collectionsApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { format } from "date-fns";
import PrivateRoute from "@/app/context/PrivateRoutes";
import DatePicker from "react-datepicker";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const status = "SUMMARIZED";
  const { data: sellersData } = useGetSellersQuery(null);

  const [searchParams, setSearchParams] = useState({
    seller_id: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
  });

  const { data, error, isLoading, refetch } = useGetCollectionsPagQuery({
    page,
    limit,
    status,
    startDate: searchParams.startDate ? searchParams.startDate.toISOString() : undefined,
    endDate: searchParams.endDate ? searchParams.endDate.toISOString() : undefined,
    seller_id: searchParams.seller_id
  });
  const { data: countCollectionsData } = useCountCollectionQuery(null);
  const { data: branchData } = useGetBranchesQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData = data?.map((collection) => {
    const branch = branchData?.find((data) => data.id == collection.branch_id);
    const seller = sellersData?.find((data) => data.id == collection.seller_id);

    return {
      key: collection._id,
      info: <AiOutlineDownload className="text-center text-xl" />,
      pdf: <FaRegFilePdf className="text-center text-xl" />,
      number: collection.number,
      date: collection.date
        ? format(new Date(collection.date), "dd/MM/yyyy HH:mm")
        : "N/A",
      payment: "PESOS",
      amount: collection.amount,
      status: collection.status,
      notes: collection.notes,
      seller: seller?.name || "NOT FOUND",
    };
  });

  const tableHeader = [
    {
      component: <AiOutlineDownload className="text-center text-xl" />,
      key: "info",
    },
    {
      component: <FaRegFilePdf className="text-center text-xl" />,
      key: "pdf",
    },
    { name: "Number", key: "number" },
    { name: "Date", key: "date" },
    { name: "Payment", key: "payment" },
    { name: "Amount", key: "amount" },
    { name: "Status", key: "status" },
    { name: "Notes", key: "notes" },
    { name: "Seller", key: "seller" },
  ];
  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <DatePicker
            selected={searchParams.startDate}
            onChange={(date) => setSearchParams({ ...searchParams, startDate: date })}
            placeholderText="Date From"
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
      {
        content: (
          <DatePicker
            selected={searchParams.endDate}
            onChange={(date) => setSearchParams({ ...searchParams, endDate: date })}
            placeholderText="Date To"
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded p-2"
          />
        ),
      },
      {
        content: (
          <select
            value={searchParams.seller_id}
            onChange={(e) => setSearchParams({ ...searchParams, seller_id: e.target.value })}
          >
            <option value="">Seller...</option>
            {sellersData?.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.name}
              </option>
            ))}
          </select>
        ),
      }
      
    ],
    results: `${data?.length || 0} Results`,
  };
  
  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countCollectionsData || 0) / limit)) setPage(page + 1);
  };

  return (
    <PrivateRoute>
      <div className="gap-4">
        <h3 className="font-bold p-4">COLLECTIONS SUMMARIES</h3>
        <Header headerBody={headerBody} />
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
            Page {page} of {Math.ceil((countCollectionsData || 0) / limit)}
          </p>
          <button
            onClick={handleNextPage}
            disabled={page >= Math.ceil((countCollectionsData || 0) / limit)}
            className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </PrivateRoute>
  );
};

export default Page;
