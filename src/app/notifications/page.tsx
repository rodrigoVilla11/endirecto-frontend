"use client"
import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaDownload } from "react-icons/fa";
import { useGetNotificationsQuery } from "@/redux/services/notificationsApi";
import { useGetBrandsQuery } from "@/redux/services/brandsApi";
import { format } from 'date-fns';

const page = () => {
  const { data: brandsData } = useGetBrandsQuery(null);
  const { data, error, isLoading, refetch } = useGetNotificationsQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData = data?.map((notification) => {
    const brand = brandsData?.find((data) => data.id == notification.brand_id)
    return {
      key: notification._id,
      brand: brand?.name,
      type: notification.type,
      title: notification.title,
      description: notification.description,
      validity: format(new Date(notification.schedule_to), 'dd/MM/yyyy HH:mm'),
      date: format(new Date(notification.schedule_from), 'dd/MM/yyyy HH:mm'),
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
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "1 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">NOTIFICATIONS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData}/>
    </div>
  );
};

export default page;
