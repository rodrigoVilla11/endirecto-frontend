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
import i18n from "i18next"; // Asegúrate de tener i18n configurado en tu proyecto
import ReactCountryFlag from "react-country-flag";

const ButtonsIcons = ({ isMobile }: any) => {
  const { selectedClientId } = useClient();

  const {
    data: customer,
    error: customerError,
    isLoading: isCustomerLoading,
    refetch: refetchCustomer,
  } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { refetchOnMountOrArgChange: true }
  );

  const router = useRouter();

  const [animateCart, setAnimateCart] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");

  const cartItemCount = customer?.shopping_cart
    ? [...new Set(customer?.shopping_cart.map((item) => item))].length
    : 0;

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

  // Función para alternar el idioma y cambiar la bandera
  const handleLanguageToggle = () => {
    const newLanguage = currentLanguage === "en" ? "es" : "en";
    setCurrentLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  return (
    <div className="w-60 flex items-center justify-end gap-4 sm:justify-between text-2xl text-white relative">
      {!isMobile && (
        <MdNotificationsOff className="cursor-pointer text-red-600" />
      )}
      {!isMobile && (
        <button
          onClick={handleLanguageToggle}
          className="cursor-pointer text-xl"
        >
          {currentLanguage === "es" ? (
            <ReactCountryFlag
              countryCode="AR"
              svg
              style={{ width: "1em", height: "1em" }}
              title="Argentina"
            />
          ) : (
            <ReactCountryFlag
              countryCode="US"
              svg
              style={{ width: "1em", height: "1em" }}
              title="Estados Unidos"
            />
          )}
        </button>
      )}
      {!isMobile && <MdFullscreen className="cursor-pointer" />}
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

      {showTick && (
        <div
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-500 text-5xl animate-pulse"
          style={{ zIndex: 9999 }} // Añadido z-index alto
        >
          <FaCheckCircle />
        </div>
      )}
    </div>
  );
};

export default ButtonsIcons;
