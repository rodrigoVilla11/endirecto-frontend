import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import Table from "@/app/components/components/Table";
import { FaTrashCan } from "react-icons/fa6";
import ButtonOnOff from "@/app/components/components/ButtonOnOff";
import { FaImage, FaShoppingCart } from "react-icons/fa";
import PrivateRoute from "@/app/context/PrivateRoutes";

const Page = () => {
  const tableHeader = [
    { name: "Included", key: "included" },
    { name: "Date", key: "date" },
    { name: "Brand", key: "brand" },
    {
      component: <FaImage className="text-center text-xl" />,
      key: "image",
    },
    { name: "Article", key: "article" },
    { name: "Stock", key: "stock" },
    { name: "Netprice", key: "netprice" },
    { name: "Quantity", key: "quantity" },
    { name: "Total", key: "total" },
    {
      component: <FaTrashCan className="text-center text-xl" />,
      key: "trash-can",
    },
  ];
  const headerBody = {
    buttons: [
      {
        logo: <FaTrashCan />,
        title: "Empty Cart 'ORDER'",
      },
      {
        logo: <FaShoppingCart />,
        title: "Close 'ORDER'",
      },
    ],
    filters: [
      {
        // content: <ButtonOnOff title={"Select All"} />,
      },
      {
        content: (
          <select>
            <option value="order">ORDER</option>
            <option value="budget">BUDGET</option>
          </select>
        ),
      },
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    secondSection: { title: "Total Without Taxes", amount: "$ 0,00" },
    results: "0 Results",
  };

  return (
    <PrivateRoute
      requiredRoles={[
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ]}
    >
      <div className="gap-4">
        <h3 className="font-bold p-4">CART</h3>
        <Header headerBody={headerBody} />
        {/* <Table headers={tableHeader} /> */}
      </div>
    </PrivateRoute>
  );
};

export default Page;
