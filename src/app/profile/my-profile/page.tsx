"use client";
import React, { useState } from "react";
import Header from "@/app/components/components/Header";
import { FaKey } from "react-icons/fa6";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useAuth } from "@/app/context/AuthContext";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";

const Page = () => {
  const { selectedClientId } = useClient();
  const { userData } = useAuth();
  const [receiveNotifications, setReceiveNotifications] = useState(false);
  const { data: branchsData, isLoading: isLoadingBranchs } =
    useGetBranchesQuery(null);
  const { data, error, isLoading, refetch } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });
  const branch = branchsData?.find((data) => data.id === userData?.branch);

  const headerBody = {
    buttons: [
      {
        logo: <FaKey />,
        title: "Change Password",
      },
    ],
    filters: [],
    results: "",
  };

  return (
    <PrivateRoute
      requiredRoles={[
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ]}
    >
      <div className="gap-4">
        <h3 className="font-bold p-4">MY PROFILE</h3>
        <Header headerBody={headerBody} />
        {selectedClientId ? (
          <div className="w-full mx-auto p-6">
            <div className="bg-white shadow-md rounded-md p-6">
              <form className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Id:
                    </label>
                    <input
                      type="text"
                      value={data?.id}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nombre:
                    </label>
                    <input
                      type="text"
                      value={data?.name}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Correos Electrónicos:
                    </label>
                    <button
                      type="button"
                      className="mt-1 px-4 py-2 bg-green-500 text-white rounded-md"
                    >
                      +
                    </button>
                    <input
                      type="text"
                      value={data?.email}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Teléfonos:
                    </label>
                    <button
                      type="button"
                      className="mt-1 px-4 py-2 bg-green-500 text-white rounded-md"
                    >
                      +
                    </button>
                    <input
                      type="text"
                      value={data?.phone}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Logotipo (150 KB):
                    </label>
                    <input
                      type="file"
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Imágenes (3072 KB):
                    </label>
                    <input
                      type="file"
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div className="col-span-2 flex items-center">
                    <label className="block text-sm font-medium text-gray-700 mr-4">
                      Recibir Notificaciones:
                    </label>
                    <input
                      type="checkbox"
                      checked={receiveNotifications}
                      onChange={() =>
                        setReceiveNotifications(!receiveNotifications)
                      }
                      className="h-6 w-6 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Condición de Pago:
                    </label>
                    <input
                      type="text"
                      value={data?.payment_condition_id}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      CUIT:
                    </label>
                    <input
                      type="text"
                      value={data?.cuit}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Dirección:
                    </label>
                    <input
                      type="text"
                      value={data?.address}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Localidad:
                    </label>
                    <input
                      type="text"
                      value={data?.locality}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Provincia:
                    </label>
                    <input
                      type="text"
                      value={data?.state}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Código Postal:
                    </label>
                    <input
                      type="text"
                      value=""
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Lista de Precios:
                    </label>
                    <input
                      type="text"
                      value={data?.price_list_id}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Vendedor:
                    </label>
                    <input
                      type="text"
                      value={data?.seller_id}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Sucursal:
                    </label>
                    <input
                      type="text"
                      value={data?.branch_id}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Aceptar
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div>
            <div className="h-auto m-5 bg-white p-4 flex flex-col justify-between text-sm gap-8">
              <p>
                Id: <span className="font-bold">{userData?._id}</span>
              </p>
              <p>
                Name: <span className="font-bold">{userData?.username}</span>
              </p>
              <p>
                Role:{" "}
                <span className="font-bold">
                  {userData?.role?.toUpperCase()}
                </span>
              </p>
              <p>
                Email: <span className="font-bold">{userData?.email}</span>
              </p>
              <p>
                Branch:{" "}
                <span className="font-bold">
                  {branch
                    ? branch.name
                    : isLoadingBranchs
                    ? "Loading branch..."
                    : "Branch not found"}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </PrivateRoute>
  );
};

export default Page;
