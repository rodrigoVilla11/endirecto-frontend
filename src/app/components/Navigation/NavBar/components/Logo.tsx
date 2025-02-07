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
        src={selectedClientId ? data?.logo :"https://res.cloudinary.com/db7kbwl5n/image/upload/v1727811015/Mask_group_1_grmoph.png"}
        alt="logo-navbar"
        className={`${
          isOpen ? "h-28 w-full object-contain pl-4 pt-2" : "h-20 w-full object-contain" 
        } transition-all duration-300`}
      />
    </div>
  );
};

export default Logo;
