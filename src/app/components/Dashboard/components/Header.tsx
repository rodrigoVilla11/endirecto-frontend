"use client";
import { useAuth } from "@/app/context/AuthContext";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useGetUserByIdQuery } from "@/redux/services/usersApi";
import React from "react";
import { useTranslation } from "react-i18next";
import { FaShoppingCart } from "react-icons/fa";
import { IoNotificationsOutline } from "react-icons/io5";

const Header = () => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();
  const { userData } = useAuth();

  const { data, isLoading } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { skip: !selectedClientId }
  );

  const userQuery = useGetUserByIdQuery(
    { id: userData?._id || "" },
    { skip: !userData?._id }
  );

  const firstLetter = selectedClientId
    ? data?.name?.charAt(0) || ""
    : userData?.username?.charAt(0) || "";

  const displayName = selectedClientId ? data?.name : userData?.username;
  const userRole = userData?.role
    ? userData.role.toUpperCase()
    : t("noRoleAvailable");

  const cartCount = selectedClientId ? data?.shopping_cart?.length || 0 : 0;

  const unreadNotifications = selectedClientId
    ? data?.notifications?.filter((n: any) => !n.read).length || 0
    : userQuery.data?.notifications?.filter((n: any) => !n.read).length || 0;

  return (
    <div className="mx-4 sm:mx-8 mt-16 sm:mt-10">
      <div className=" mb-4 rounded-2xl bg-white/80 backdrop-blur shadow-md border border-gray-100 px-5 py-4 sm:px-8 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* Perfil */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white text-2xl font-semibold ring-2 ring-gray-200">
              {selectedClientId && data?.profileImg ? (
                <img
                  src={data.profileImg}
                  className="rounded-full w-full h-full object-cover"
                  alt="profile-img"
                />
              ) : (
                <span>{firstLetter}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm text-gray-500">
              {t("welcomeMessage")}
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              {isLoading
                ? "…"
                : displayName || t("noNameAvailable")}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-700 uppercase tracking-wide">
                {userRole}
              </span>
              {selectedClientId && data?.id && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  ID: {data.id}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 w-full sm:w-auto justify-start sm:justify-end">
          {selectedClientId && (
            <div className="flex flex-col items-center min-w-[80px]">
              <div className="flex items-center gap-1 text-gray-700">
                <FaShoppingCart className="text-sm" />
                <span className="text-xl font-semibold">
                  {cartCount}
                </span>
              </div>
              <span className="mt-0.5 text-xs sm:text-sm text-gray-500 text-center">
                {t("itemsInCart")}
              </span>
            </div>
          )}

          <div className="flex flex-col items-center min-w-[80px]">
            <div className="flex items-center gap-1 text-gray-700">
              <IoNotificationsOutline className="text-lg" />
              <span className="text-xl font-semibold">
                {unreadNotifications}
              </span>
            </div>
            <span className="mt-0.5 text-xs sm:text-sm text-gray-500 text-center">
              {t("notifications")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
