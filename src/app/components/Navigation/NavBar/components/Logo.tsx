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

  const logoUrl =
    selectedClientId && data?.logo
      ? data.logo
      : "http://res.cloudinary.com/dw3folb8p/image/upload/v1735302458/in36sypq4u5ryxvpy9tc.png";

  return (
    <div className="flex items-center group z-40">
      <div className="rounded-2xl p-3 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
        <img
          src="endirecto.png"
          alt="logo-navbar"
          className="h-16 object-contain"
        />
      </div>
    </div>
  );
};

export default Logo;
