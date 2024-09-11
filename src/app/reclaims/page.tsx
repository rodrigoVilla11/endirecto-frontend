"use client"
import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { AiOutlineDownload } from "react-icons/ai";
import { FaPlus } from "react-icons/fa";
import { FaPencil, FaTrashCan } from "react-icons/fa6";
import { useGetReclaimsQuery } from "@/redux/services/reclaimsApi";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetUsersQuery } from "@/redux/services/usersApi";

const page = () => {
  const { data: branchData } = useGetBranchesQuery(null);
  const { data: customerData } = useGetCustomersQuery(null);
  const { data: userData } = useGetUsersQuery(null);
  const { data, error, isLoading, refetch } = useGetReclaimsQuery(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  const tableData = data?.map((reclaim) => {
    const branch = branchData?.find((data) => data.id == reclaim.branch_id)
    const customer = customerData?.find((data) => data.id == reclaim.customer_id)
    const user = userData?.find((data) => data._id == reclaim.user_id)


    return {
      key: reclaim._id,
      info: <IoInformationCircleOutline className="text-center text-xl" />,
      id: reclaim.id,
      status: reclaim.status,
      type: reclaim.reclaims_type_id,
      description: reclaim.description,
      customer: customer?.name,
      user: user?.username,
      branch: branch?.name,
      data: reclaim.date,
      edit: <FaPencil className="text-center text-lg" />,
      erase: <FaTrashCan className="text-center text-lg" />,
    };
  });
  const tableHeader = [
    {
      component: <IoInformationCircleOutline className="text-center text-xl" />,
      key: "info",
    },
    { name: "Number", key: "number" },
    { name: "Status", key: "status" },
    { name: "Type", key: "type" },
    { name: "Description", key: "description" },
    { name: "Customer", key: "customer" },
    { name: "User", key: "user" },
    { name: "Branch", key: "branch" },
    { name: "Date", key: "date" },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];
  const headerBody = {
    buttons: [
      {
        logo: <FaPlus />,
        title: "New",
      },
      {
        logo: <AiOutlineDownload />,
        title: "Download",
      },
    ],
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
      {
        content: <Input placeholder={"Number"} />,
      },
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "0 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">RECLAIMS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData}/>
    </div>
  );
};

export default page;
