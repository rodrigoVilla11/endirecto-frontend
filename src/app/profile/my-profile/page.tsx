import React from "react";
import Input from "@/app/components/components/Input";
import Header from "@/app/components/components/Header";
import { FaKey } from "react-icons/fa6";

const page = () => {

  const headerBody = {
    buttons: [{
        logo: <FaKey />,
        title: "Change Password",
      },],
    filters: [
      {
        content: <Input placeholder={"Search..."} />,
      },
    ],
    results: "1 Results",
  };

  return (
    <div className="gap-4">
      <h3 className="font-bold p-4">MY PROFILE</h3>
      <Header headerBody={headerBody} />
     
    </div>
  );
};

export default page;
