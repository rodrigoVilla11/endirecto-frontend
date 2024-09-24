import React from "react";
import Header from "@/app/components/components/Header";
import { FaKey } from "react-icons/fa6";

const Page = () => {
  const headerBody = {
    buttons: [
      {
        logo: <FaKey />,
        title: "Change Password",
      },
    ],
    filters: [],
    results: "",
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">MY PROFILE</h3>
      <Header headerBody={headerBody} />
      <div className="h-auto m-5 bg-white p-4 flex flex-col justify-between text-sm gap-8">
        <p>Id: <span className="font-bold">5ea961d5-756d-4c51-bebb-2f9204b01846</span></p>
        <p>Name: <span className="font-bold">Rodrigo Villarreal</span></p>
        <p>Role: <span className="font-bold">ADMINISTRADOR</span></p>
        <p>Email: <span className="font-bold">rodrigo@gmail.com</span></p>
        <p>Branch: <span className="font-bold">001 - DEP YRIGOYEN</span></p>
        {//AGREGAR MAS INFO PARA CUANDO SE SELECCIONA EL CLIENTE
        }
      </div>
    </div>
  );
};

export default Page;
