import React, { useEffect } from "react";
import { GiUsaFlag } from "react-icons/gi";
import {
  MdFullscreen,
  MdHome,
  MdNotifications,
  MdNotificationsOff,
  MdShoppingCart,
} from "react-icons/md";
import { useRouter } from "next/navigation";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";

const ButtonsIcons = () => {
  const { selectedClientId } = useClient();

  const {
    data: customer,
    error: customerError,
    isLoading: isCustomerLoading,
    refetch: refetchCustomer,
  } = useGetCustomerByIdQuery({ id: selectedClientId || "" });

  const router = useRouter();

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

  // Refetch customer data when selectedClientId changes
  useEffect(() => {
    if (selectedClientId) {
      refetchCustomer();
    }
  }, [selectedClientId, refetchCustomer]);

  const cartItemCount = customer?.shopping_cart?.length || 0;

  return (
    <div className="w-60 flex items-center justify-between text-2xl text-white relative">
      <MdNotificationsOff className="cursor-pointer text-red-600" />
      <GiUsaFlag className="cursor-pointer" />
      <MdFullscreen className="cursor-pointer" />
      {selectedClientId && (
        <div className="relative">
          <MdShoppingCart
            className="cursor-pointer"
            onClick={() => handleRedirect("/shopping-cart")}
          />
          {cartItemCount > 0 && (
            <span className="absolute top-3 left-3 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </div>
      )}
      <MdNotifications className="cursor-pointer" />
      <MdHome onClick={() => handleRedirect("/")} className="cursor-pointer" />
    </div>
  );
};

export default ButtonsIcons;
