'use client'
import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";

const page = () => {
  const { data, error, isLoading, refetch } = useGetBranchesQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;
   console.log(data)
  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "Name", key: "name" },
    { name: "Address", key: "address" },
    { name: "PC", key: "pc" },
    { name: "Phone", key: "phone" },
    { name: "WhatsApp", key: "whatsapp" },
    { name: "GPS", key: "gps" },
    { name: "Schedules", key: "schedules" },
    { name: "Budget Mails", key: "budget-mails" },
    { name: "Payment Mails", key: "payment-mails" },
    { name: "Payment Summaries Mails", key: "payment-summaries-mails" },
    { name: "Contacts Mails", key: "contacts-mails" },
    { name: "Orders Mails", key: "orders-mails" },
    { name: "Pending Mails", key: "pending-mails" },
    { name: "Profile Mails", key: "profile-mails" },
    { name: "System Mails", key: "system-mails" },
  ];
  const headerBody = {
    buttons: [],
    filters: [
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "1 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">BRANCHES</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} />
    </div>
  );
};

export default page;
