"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaDownload } from "react-icons/fa";
import {
  useCountNotificationsQuery,
  useGetNotificationsPagQuery,
  useGetNotificationsQuery,
} from "@/redux/services/notificationsApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { format } from "date-fns";
import PrivateRoute from "../context/PrivateRoutes";

const Page = () => {
  const { data: brandsData } = useGetBrandsQuery(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: countNotificationsData } = useCountNotificationsQuery(null);

  const { data, error, isLoading, refetch } = useGetNotificationsPagQuery({
    page,
    limit,
    query: searchQuery,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData = data?.map((notification) => {
    const brand = brandsData?.find((data) => data.id == notification.brand_id);
    return {
      key: notification._id,
      brand: brand?.name,
      type: notification.type,
      title: notification.title,
      description: notification.description,
      validity: format(new Date(notification.schedule_to), "dd/MM/yyyy HH:mm"),
      date: format(new Date(notification.schedule_from), "dd/MM/yyyy HH:mm"),
      download: <FaDownload className="text-center text-xl" />,
    };
  });
  const tableHeader = [
    { name: "Brand", key: "brand" },
    { name: "Type", key: "type" },
    { name: "Title", key: "title" },
    { name: "Description", key: "description" },
    { name: "Validity", key: "validity" },
    { name: "Date", key: "date" },
    {
      component: <FaDownload className="text-center text-xl" />,
      key: "download",
    },
  ];
  const headerBody = {
    buttons: [],
    filters: [
      {
        content: (
          <select>
            <option value="order">TYPE</option>
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
      : `${countNotificationsData || 0} Results`,
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < Math.ceil((countNotificationsData || 0) / limit)) {
      setPage(page + 1);
    }
  };

  return (
    <PrivateRoute>
      <div className="gap-4">
        <h3 className="font-bold p-4">NOTIFICATIONS</h3>
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
            Page {page} of {Math.ceil((countNotificationsData || 0) / limit)}
          </p>
          <button
            onClick={handleNextPage}
            disabled={page === Math.ceil((countNotificationsData || 0) / limit)}
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
