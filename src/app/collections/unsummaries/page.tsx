"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import {
  useCountCollectionQuery,
  useGetCollectionsPagQuery,
} from "@/redux/services/collectionsApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { format } from "date-fns";
import PrivateRoute from "@/app/context/PrivateRoutes";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const status = "CHARGED";
  const { data: sellersData } = useGetSellersQuery(null);
  const [searchParams, setSearchParams] = useState({
    seller_id: "",
  });

  const { data, error, isLoading, refetch } = useGetCollectionsPagQuery({
    page,
    limit,
    status,
    seller_id: searchParams.seller_id,
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
      branch: branch?.name || "NOT FOUND",
      seller: seller?.name || "NOT FOUND",
      date: collection.date
        ? format(new Date(collection.date), "dd/MM/yyyy HH:mm")
        : "N/A",
      value: "PESOS",
      amount: collection.amount,
    };
  });

  const tableHeader = [
    { name: "Branch", key: "branch" },
    { name: "Seller", key: "seller" },
    { name: "Date", key: "date" },
    { name: "Value", key: "value" },
    { name: "Amount", key: "amount" },
  ];
  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <select
            value={searchParams.seller_id}
            onChange={(e) =>
              setSearchParams({ ...searchParams, seller_id: e.target.value })
            }
          >
            <option value="">Seller...</option>
            {sellersData?.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.name}
              </option>
            ))}
          </select>
        ),
      },
    ],
    secondSection: { title: "Total", amount: "$ 0,00" },
    results: `${data?.length || 0} Results`,
  };
  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countCollectionsData || 0) / limit))
      setPage(page + 1);
  };

  return (
    <PrivateRoute>
      <div className="gap-4">
        <h3 className="font-bold p-4">COLLECTIONS UNSUMMARIES</h3>
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
