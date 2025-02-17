"use client";
import { useAuth } from "@/app/context/AuthContext";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import React from "react";
import { useTranslation } from "react-i18next";

const Header = () => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();
  const { data, error, isLoading, refetch } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });
  const { userData } = useAuth();

  // Verificación de datos disponibles solo cuando se cumple la condición
  const firstLetter = selectedClientId
    ? data?.name?.charAt(0) || "" // Se asigna una letra vacía si 'data' no tiene valor
    : userData?.username?.charAt(0) || ""; // Se asigna una letra vacía si 'userData' no tiene valor

  const displayName = selectedClientId ? data?.name : userData?.username;
  const userRole = userData?.role ? userData.role.toUpperCase() : t("noRoleAvailable"); // Asegura que haya un valor para el rol

  return (
    <div className="bg-white shadow-sm mx-2 sm:mx-5 p-4 sm:p-10 mt-12 sm:mt-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* User Profile Section */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
            {data?.profileImg ? (
              <img
                src={data.profileImg}
                className="rounded-full h-16 w-16 sm:h-20 sm:w-20"
              />
            ) : (
              <p className="text-2xl font-semibold text-white">{firstLetter}</p>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-sm text-gray-600 break-words">
              {t("welcomeMessage")}
            </span>
            <h1 className="text-xl font-bold text-gray-900">
              {displayName || t("noNameAvailable")}
            </h1>
            <p className="text-sm text-gray-500">
              {userRole} {selectedClientId && <p>&nbsp;({data?.id})</p>}
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="flex gap-6 w-full sm:w-auto justify-start sm:justify-end">
          {selectedClientId && (
            <div className="flex flex-col items-center">
              <span className="text-2xl font-semibold">
                {data?.shopping_cart.length}
              </span>
              <span className="text-sm text-gray-600 text-center">
                {t("itemsInCart")}
              </span>
            </div>
          )}

          <div className="flex flex-col items-center">
            <span className="text-2xl font-semibold">
              {selectedClientId && data?.notifications_id.length}
            </span>
            <span className="text-sm text-gray-600 text-center">
              {t("notifications")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
