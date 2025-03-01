import { useClient } from "@/app/context/ClientContext";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import React from "react";

const Logo = () => {
  const { isOpen } = useSideMenu();
  const { selectedClientId } = useClient();
  const { data, error, isLoading, refetch } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });
  return (
    <div>
      <img
        src={selectedClientId && data?.logo ? data?.logo :"http://res.cloudinary.com/dw3folb8p/image/upload/v1735302458/in36sypq4u5ryxvpy9tc.png"}
        alt="logo-navbar"
        className={`${
          isOpen ? "h-28 w-full object-contain pl-4 pt-2" : "h-10 w-full object-contain" 
        } transition-all duration-300`}
      />
    </div>
  );
};

export default Logo;
