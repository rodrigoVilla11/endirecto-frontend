import { useAuth } from "@/app/context/AuthContext";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import React from "react";

const Header = () => {
  const { selectedClientId, setSelectedClientId } = useClient();
  const { data, error, isLoading, refetch } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });
  const { userData } = useAuth();
  console.log(userData)

  const firstLetter = selectedClientId ? data?.name.charAt(0) : userData?.username.charAt(0)

  return (
    <div className="h-44 mx-5 bg-white  p-10 flex justify-between">
      <div className="flex items-center gap-4">
        <div className="rounded-full h-14 w-14 bg-secondary text-white flex justify-center items-center text-xl">
          <p>{firstLetter}</p>
        </div>
        <div>
          <p className="text-sm">
            Welcome to Distribuidora Mayorista de Autopiezas
          </p>
          <p className="text-lg mt-4">
            {selectedClientId ? data?.name : userData?.username}
          </p>
          <p className="text-sm">{userData?.role.toUpperCase()}</p>
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
