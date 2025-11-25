import { useClient } from "@/app/context/ClientContext";
import { useSideMenu } from "@/app/context/SideMenuContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useMobile } from "@/app/context/ResponsiveContext";
import React from "react";

const Logo = () => {
  const { isOpen } = useSideMenu();
  const { selectedClientId } = useClient();
  const { isMobile } = useMobile();
  
  const { data, error, isLoading } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { skip: !selectedClientId }
  );

  const logoUrl = selectedClientId && data?.logo 
    ? data.logo 
    : "http://res.cloudinary.com/dw3folb8p/image/upload/v1735302458/in36sypq4u5ryxvpy9tc.png";

  return (
    <div className="flex items-center justify-center">
      <img
        src={logoUrl}
        alt="Logo"
        className={`${
          isMobile 
            ? "h-8 w-auto" 
            : isOpen 
              ? "h-14 w-full object-contain px-4" 
              : "h-10 w-auto"
        } transition-all duration-300 object-contain`}
      />
    </div>
  );
};

export default Logo;