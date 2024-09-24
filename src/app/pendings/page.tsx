import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaShoppingCart } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";

const Page = () => {
  const tableData = [{}]
  const tableHeader = [
    { name: "Brand", key: "brand" },
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: "Article", key: "article" },
    { name: "Quantity", key: "quantity" },
    { name: "Price Unit", key: "price-unit" },
    { name: "Order", key: "order" },
    { name: "Date", key: "date" },
    { name: "Stock", key: "stock" },
    {
      component: <FaShoppingCart className="text-center text-xl" />,
      key: "shopping-cart",
    },
    {
      component: <FaTrashCan className="text-center text-xl" />,
      key: "trash-can",
    },
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
            <option value="order">STOCK</option>
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
      <h3 className="font-bold p-4">PENDINGS</h3>
      <Header headerBody={headerBody} />
      <Table headers={tableHeader} data={tableData}/>
    </div>
  );
};

export default Page;
