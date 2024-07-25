import React from "react";
import { CgProfile } from "react-icons/cg";
import { CiMenuKebab } from "react-icons/ci";
import { FiMapPin } from "react-icons/fi";
import { AiOutlineDownload } from "react-icons/ai";
import Buttons from "@/app/components/components/Buttons";
import Input from "@/app/components/components/Input";
import ButtonOnOff from "@/app/components/components/ButtonOnOff";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";

const page = () => {
  const tableHeader = [
    {
      component: <CgProfile className="text-center text-xl" />,
      key: "profile",
    },
    { name: "Customer", key: "customer" },
    { name: "Name", key: "name" },
    { name: "Address", key: "address" },
    { name: "Payment Condition", key: "payment-condition" },
    { name: "Status Account", key: "status-account" },
    { name: "Expired Debt", key: "expired-debt" },
    { name: "Use Days WEB (%)", key: "use-days-web" },
    { name: "Pendings With Stock", key: "pendings-with-stock" },
    { name: "Articles on Cart", key: "articles-on-cart" },
    { name: "GPS", key: "gps" },
    { component: <CiMenuKebab className="text-center text-xl" />, key: "menu" },
  ];
  const headerBody = {
    buttons: [
      {
        logo: <FiMapPin/>,
        title: "View On Map",
      },
      {
        logo: <AiOutlineDownload/>,
        title: "Download",
      },
    ],
    filters: [
      {
        content: <Buttons title={"Seller"} />,
      },
      {
        content: <Input placeholder={"Search..."}/>,
      },
      {
        content: <ButtonOnOff title={"Debt"}/>
       
      },
      {
        content: <ButtonOnOff title={"Expired D."}/>
      },
    ],
    results: "2203 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="text-bold p-4">PAYMENTS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} />
    </div>
  );
};

export default page;
