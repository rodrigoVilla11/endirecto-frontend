"use client"
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useCountCollectionQuery, useGetCollectionsPagQuery } from "@/redux/services/collectionsApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { format } from "date-fns";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const status = "CHARGED"
  const { data: sellersData } = useGetSellersQuery(null);

  const { data, error, isLoading, refetch } = useGetCollectionsPagQuery({
    page,
    limit,
    status
  });
  const { data: countCollectionsData } = useCountCollectionQuery(null);
  const { data: branchData } = useGetBranchesQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData = data?.map((collection) => {
    const branch = branchData?.find(
      (data) => data.id == collection.branch_id
    );
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
    buttons: [
    ],
    filters: [
     
      {
        content: <Input placeholder={"Search..."}/>,
      },
      {
        content: (
          <select>
            <option value="status">SELLER</option>
          </select>
        ),
      },
    ],
    secondSection: {title: "Total", amount: "$ 0,00"},
    results: `${data?.length || 0} Results`,
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">COLLECTIONS UNSUMMARIES</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData}/>
    </div>
  );
};

export default Page;
