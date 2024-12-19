import { useAuth } from "@/app/context/AuthContext";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import React from "react";

const Header = () => {
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
  const userRole = userData?.role?.toUpperCase() || "No role available"; // Asegura que haya un valor para el rol

  return (
    <div className="h-44 mx-5 bg-white p-10 flex justify-between mt-8">
      <div className="flex items-center gap-4">
        <div className="rounded-full h-14 w-14 bg-secondary text-white flex justify-center items-center text-xl">
          {data?.profileImg ? <img src={data.profileImg} className="rounded-full h-14 w-14" /> : <p>{firstLetter}</p>}
        </div>
        <div>
          <p className="text-sm">
            Welcome to Distribuidora Mayorista de Autopiezas
          </p>
          <p className="text-lg mt-4">{displayName || "No Name Available"}</p>{" "}
          {/* Valor por defecto si no hay nombre */}
          <p className="text-sm">{userRole}</p>
        </div>
      </div>
      <div className="w-1/3 flex flex-col justify-center items-center">
        <p className="text-sm">NOTIFICATIONS</p>
        <p className="text-2xl mt-4">0</p>
      </div>
    </div>
  );
};

export default Header;
