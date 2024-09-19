"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage } from "react-icons/fa";
import {
  useCountPricesListsQuery,
  useGetPricesListPagQuery,
} from "@/redux/services/pricesListsApi";

const page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data, error, isLoading, refetch } = useGetPricesListPagQuery({
    page,
    limit,
  });
  const { data: countPricesListsData } = useCountPricesListsQuery(null);

  const tableData =
    data?.map((priceList) => ({
      key: priceList.id,
      image: priceList?.name,
      brand: priceList?.name,
      excel: priceList?.id,
      txt: priceList?.id,

    })) || [];

  const tableHeader = [
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: "Brand", key: "brand" },
    { name: "File EXCEL", key: "excel" },
    { name: "File TXT", key: "txt" },
  ];
  const headerBody = {
    buttons: [],
    filters: [
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: `${countPricesListsData || 0} Results`,
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countPricesListsData || 0) / limit)) {
      setPage(page + 1);
    }
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">PRICES LISTS</h3>
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
          Page {page} of {Math.ceil((countPricesListsData || 0) / limit)}
        </p>
        <button
          onClick={handleNextPage}
          disabled={page === Math.ceil((countPricesListsData || 0) / limit)}
          className="bg-gray-300 hover:bg-gray-400 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default page;
