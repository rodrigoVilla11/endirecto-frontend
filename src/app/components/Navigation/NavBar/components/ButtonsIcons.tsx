import React, { useEffect, useState } from "react";
import { GiUsaFlag } from "react-icons/gi";
import {
  MdFullscreen,
  MdHome,
  MdNotifications,
  MdNotificationsOff,
  MdShoppingCart,
} from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa";
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

  const [animateCart, setAnimateCart] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const cartItemCount = customer?.shopping_cart?.length || 0;

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

  useEffect(() => {
    if (selectedClientId) {
      refetchCustomer();
    }
  }, [selectedClientId, refetchCustomer]);

  // Efecto para animar el carrito y mostrar el tick de confirmación
  useEffect(() => {
    if (cartItemCount > 0) {
      setAnimateCart(true);
      setShowTick(true);
      const cartTimer = setTimeout(() => setAnimateCart(false), 500); // Duración de la animación de carrito
      const tickTimer = setTimeout(() => setShowTick(false), 1000); // Duración del tick
      return () => {
        clearTimeout(cartTimer);
        clearTimeout(tickTimer);
      };
    }
  }, [cartItemCount]);

  return (
    <div className="w-60 flex items-center justify-between text-2xl text-white relative">
      <MdNotificationsOff className="cursor-pointer text-red-600" />
      <GiUsaFlag className="cursor-pointer" />
      <MdFullscreen className="cursor-pointer" />
      {selectedClientId && (
        <div className="relative">
          <MdShoppingCart
            className={`cursor-pointer ${animateCart ? "animate-bounce" : ""}`}
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

      {/* Tick de confirmación */}
      {showTick && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-500 text-5xl animate-pulse">
          <FaCheckCircle />
        </div>
      )}
    </div>
  );
};

export default ButtonsIcons;
