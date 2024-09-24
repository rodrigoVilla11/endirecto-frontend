'use client'
import React, { useState } from "react";
import { AiOutlineDownload } from "react-icons/ai";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaRegFilePdf } from "react-icons/fa";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useCountCollectionQuery, useGetCollectionsPagQuery } from "@/redux/services/collectionsApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { format } from "date-fns";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const status = "SUMMARIZED"
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
    { name: "Seller", key: "seller" }
  ];
  const headerBody = {
    buttons: [],
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
            <option value="status">SELLER</option>
          </select>
        ),
      },
      {
        content: <Input placeholder={"Search..."}/>,
      }
    ],
    results:  `${data?.length || 0} Results`,
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">COLLECTIONS SUMMARIES</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData} />
    </div>
  );
};

export default Page;
