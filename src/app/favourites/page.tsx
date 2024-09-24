import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaImage, FaShoppingCart } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";

const Page = () => {
  const tableHeader = [
    { name: "Brand", key: "brand" },
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: "Article", key: "article" },
    { name: "Price", key: "price" },
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
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "1 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">FAVOURITES</h3>
      <Header headerBody={headerBody} />
      {/* <Table headers={tableHeader} /> */}
    </div>
  );
};

export default Page;
