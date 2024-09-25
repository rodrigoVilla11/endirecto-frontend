"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { IoMdPin } from "react-icons/io";
import ButtonOnOff from "../components/components/ButtonOnOff";
import { useCountCrmQuery, useGetCrmPagQuery } from "@/redux/services/crmApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { useGetCollectionsQuery } from "@/redux/services/collectionsApi";
import PrivateRoute from "../context/PrivateRoutes";

const Page = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const { data: collectionData } = useGetCollectionsQuery(null);

  const { data, error, isLoading, refetch } = useGetCrmPagQuery({
    page,
    limit,
  });

  const { data: countCrmData } = useCountCrmQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData = data?.map((crm) => {
    const customer = customersData?.find((data) => data.id == crm.customer_id);
    const seller = sellersData?.find((data) => data.id == crm.seller_id);
    const collection = collectionData?.find(
      (data) => data._id == crm.seller_id
    );

    return {
      key: crm._id,
      seller: seller?.name,
      customer: customer?.name,
      type: crm.type,
      date: crm.date,
      collection: collection?.amount,
      // order_id?: string; FALTA AGREGAR
      amount: collection?.amount,
      status: crm.status,
      gps: crm.gps,
    };
  });

  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    { name: "Seller", key: "seller" },
    { name: "Customer", key: "customer" },
    { name: "Type", key: "type" },
    { name: "Date", key: "date" },
    { name: "Payment", key: "payment" },
    { name: "Order", key: "order" },
    { name: "Amount", key: "amount" },
    { name: "Status", key: "status" },
    { name: "GPS", key: "gps" },
  ];
  const headerBody = {
    buttons: [
      {
        logo: <IoMdPin />,
        title: "View On Map",
      },
    ],
    filters: [
      {
        content: <ButtonOnOff title={"Contacted"} />,
      },
      {
        content: <ButtonOnOff title={"Not Contacted"} />,
      },
      {
        content: <Input placeholder={"Date From dd/mm/aaaa"} />,
      },
      {
        content: <Input placeholder={"Date To dd/mm/aaaa"} />,
      },
      {
        content: (
          <select>
            <option value="order">STATUS</option>
          </select>
        ),
      },
      {
        content: (
          <select>
            <option value="order">TYPE</option>
          </select>
        ),
      },
    ],
    results: `${countCrmData || 0} Results`,
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countCrmData || 0) / limit)) {
      setPage(page + 1);
    }
  };

  return (
    <PrivateRoute>
      <div className="gap-4">
        <h3 className="font-bold p-4">CRM</h3>
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
            Page {page} of {Math.ceil((countCrmData || 0) / limit)}
          </p>
          <button
            onClick={handleNextPage}
            disabled={page === Math.ceil((countCrmData || 0) / limit)}
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
