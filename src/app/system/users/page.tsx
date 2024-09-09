"use client";
import Header from "@/app/components/components/Header";
import Input from "@/app/components/components/Input";
import Table from "@/app/components/components/Table";
import { useGetUsersQuery } from "@/redux/services/usersApi";
import React from "react";
import { FaPlus } from "react-icons/fa6";
import { FaPencil, FaTrashCan } from "react-icons/fa6";

const page = () => {
  const { data, error, isLoading, refetch } = useGetUsersQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;
  const tableData = data?.map((user) => ({
    key: user._id,
    id: user._id,
    name: user.username,
    email: user.email,
    role: user.role,
    branch: user.branch,
    zone: user.zone,
    edit: <FaPencil className="text-center text-lg" />,
    erase: <FaTrashCan className="text-center text-lg" />
  }));
  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "User", key: "user" },
    { name: "Email", key: "email" },
    { name: "Role", key: "role" },
    { name: "Branch", key: "branch" },
    { name: "Salesman", key: "salesman" },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];
  const headerBody = {
    buttons: [
      {
        logo: <FaPlus />,
        title: "New",
      },
    ],
    filters: [
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: `${data?.length} Results`,
  };

  return (
    <div className="gap-4">
      <h3 className="text-bold p-4">USERS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData} />
    </div>
  );
};

export default page;
