import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { IoInformationCircleOutline } from "react-icons/io5";
import { IoMdPin } from "react-icons/io";
import ButtonOnOff from "../components/components/ButtonOnOff";

const page = () => {
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
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "936 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">CRM</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} />
    </div>
  );
};

export default page;
