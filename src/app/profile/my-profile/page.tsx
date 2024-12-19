"use client";
import React, { useEffect, useState } from "react";
import Header from "@/app/components/components/Header";
import { FaKey, FaTrashCan } from "react-icons/fa6";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useAuth } from "@/app/context/AuthContext";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import { useClient } from "@/app/context/ClientContext";
import {
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
} from "@/redux/services/customersApi";
import { FaCheckCircle } from "react-icons/fa";
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";

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
  const [updateCustomer, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateCustomerMutation();
  const [showTick, setShowTick] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [logo, setLogo] = useState("");

  const [profileImg, setProfileImg] = useState("");
  const [selectedFileProfile, setSelectedFileProfile] = useState<File | null>(
    null
  );
  const [uploadResponseProfile, setUploadResponseProfile] =
    useState<string>("");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadResponses, setUploadResponses] = useState<string[]>([]);

  console.log("selectedFiles", selectedFiles);
  console.log("uploadResponses", uploadResponses);
  console.log("selectedFileProfile", selectedFileProfile);
  console.log("uploadResponseProfile", uploadResponseProfile);

  const [
    uploadImage,
    {
      isLoading: isLoadingUpload,
      isSuccess: isSuccessUpload,
      isError: isErrorUpload,
    },
  ] = useUploadImageMutation();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleFileChangeProfile = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFileProfile(event.target.files[0]);
    }
  };

  const handleUploadProfile = async () => {
    if (selectedFileProfile) {
      try {
        const response = await uploadImage(selectedFileProfile).unwrap();
        setUploadResponseProfile(response.url);
      } catch (err) {
        console.error("Error uploading image:", err);
      }
    } else {
      console.error("No file selected");
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length > 0) {
      try {
        const responses = await Promise.all(
          selectedFiles.map(async (file) => {
            const response = await uploadImage(file).unwrap();
            return response.url;
          })
        );
        setUploadResponses((prevResponses) => [...prevResponses, ...responses]);
      } catch (err) {
        console.error("Error uploading images:", err);
      }
    } else {
      console.error("No files selected");
    }
  };

  useEffect(() => {
    if (selectedClientId && data) {
      setEmail(data?.email);
      setPhone(data?.phone);
      // Prioriza el link de Cloudinary si existe
      setLogo(uploadResponses[0] || data?.logo);
      refetch();
    }
  }, [selectedClientId, data, uploadResponses]);

  useEffect(() => {
    if (isSuccess) {
      setShowTick(true);
      setTimeout(() => {
        setShowTick(false);
      }, 2000);
    }
  }, [isSuccess]);

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

  const handleRemoveImage = (index: number) => {
    setUploadResponses((prevResponses) =>
      prevResponses.filter((_, i) => i !== index)
    );
  };

  const handleRemoveImageProfile = () => {
    setUploadResponseProfile("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      id: data?.id || "",
      email: email,
      phone: phone,
      logo: uploadResponses[0] || data?.logo || "",
      profileImg: uploadResponseProfile || data?.profileImg || "",
    };

    await updateCustomer(payload);
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
              <form onSubmit={handleSubmit} className="space-y-6">
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
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Teléfonos:
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="p-4 bg-white rounded-md shadow-md">
                    <label className="flex flex-col gap-4">
                      <span className="text-lg font-semibold">Images</span>
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileChange}
                          className="border border-gray-300 rounded-md p-2 w-full md:w-auto"
                        />
                        <button
                          type="button"
                          onClick={handleUpload}
                          disabled={isLoadingUpload}
                          className={`rounded-md px-4 py-2 text-white transition ${
                            isLoadingUpload
                              ? "bg-gray-500 cursor-not-allowed"
                              : "bg-success hover:bg-success-dark"
                          }`}
                        >
                          {isLoadingUpload ? "Uploading..." : "Upload Images"}
                        </button>
                      </div>
                      {isSuccessUpload && (
                        <div className="mt-2 text-sm text-green-600 font-medium">
                          Images uploaded successfully!
                        </div>
                      )}
                      {isErrorUpload && (
                        <div className="mt-2 text-sm text-red-600 font-medium">
                          Error uploading images.
                        </div>
                      )}
                      <div className="border rounded-md p-4 mt-4">
                        <table className="min-w-full table-auto border-collapse border border-gray-300">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-gray-300 p-2 text-left">
                                Image
                              </th>
                              <th className="border border-gray-300 p-2 text-left">
                                Link
                              </th>
                              <th className="border border-gray-300 p-2 text-center">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadResponses.map((image, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 p-2">
                                  <img
                                    src={image}
                                    alt="brand_image"
                                    className="h-10 w-auto rounded-md"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <a
                                    href={image}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    {image.length > 30
                                      ? `${image.substring(0, 30)}...`
                                      : image}
                                  </a>
                                </td>
                                <td className="border border-gray-300 p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="text-red-500 hover:text-red-700 transition"
                                  >
                                    <FaTrashCan className="inline-block" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </label>
                  </div>

                  <div className="p-4 bg-white rounded-md shadow-md">
                    <label className="flex flex-col gap-4">
                      <span className="text-lg font-semibold">
                        Profile Image
                      </span>
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileChangeProfile}
                          className="border border-gray-300 rounded-md p-2 w-full md:w-auto"
                        />
                        <button
                          type="button"
                          onClick={handleUploadProfile}
                          disabled={isLoadingUpload}
                          className={`rounded-md px-4 py-2 text-white transition ${
                            isLoadingUpload
                              ? "bg-gray-500 cursor-not-allowed"
                              : "bg-success hover:bg-success-dark"
                          }`}
                        >
                          {isLoadingUpload ? "Uploading..." : "Upload Images"}
                        </button>
                      </div>
                      {isSuccessUpload && (
                        <div className="mt-2 text-sm text-green-600 font-medium">
                          Images uploaded successfully!
                        </div>
                      )}
                      {isErrorUpload && (
                        <div className="mt-2 text-sm text-red-600 font-medium">
                          Error uploading images.
                        </div>
                      )}
                      <div className="border rounded-md p-4 mt-4">
                        <table className="min-w-full table-auto border-collapse border border-gray-300">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-gray-300 p-2 text-left">
                                Image
                              </th>
                              <th className="border border-gray-300 p-2 text-left">
                                Link
                              </th>
                              <th className="border border-gray-300 p-2 text-center">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 p-2">
                                <img
                                  src={uploadResponseProfile}
                                  alt="brand_image"
                                  className="h-10 w-auto rounded-md"
                                />
                              </td>
                              <td className="border border-gray-300 p-2">
                                <a
                                  href={uploadResponseProfile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                >
                                  {uploadResponseProfile.length > 30
                                    ? `${uploadResponseProfile.substring(
                                        0,
                                        30
                                      )}...`
                                    : uploadResponseProfile}
                                </a>
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImageProfile()}
                                  className="text-red-500 hover:text-red-700 transition"
                                >
                                  <FaTrashCan className="inline-block" />
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </label>
                  </div>

                  {/* Notifications checkbox */}
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

                  {/* Additional fields from the last file */}
                  <div>
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
                      Lista de Precios:
                    </label>
                    <input
                      type="text"
                      value={data?.price_list_id}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-block py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md disabled:bg-gray-400"
                >
                  {isUpdating ? "Actualizando..." : "Actualizar Información"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="w-full mx-auto p-6">
            <div className="bg-white shadow-md rounded-md p-6 space-y-4 flex flex-col justify-center">
              <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                <span className="text-gray-600 font-medium">Id:</span>
                <span className="text-gray-800 font-mono">{userData?._id}</span>
              </div>

              <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                <span className="text-gray-600 font-medium">Nombre:</span>
                <span className="text-gray-800">{userData?.username}</span>
              </div>

              <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                <span className="text-gray-600 font-medium">Rol:</span>
                <span className="text-gray-800">{userData?.role}</span>
              </div>

              <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                <span className="text-gray-600 font-medium">
                  Correo Electrónico:
                </span>
                <span className="text-gray-800">{userData?.email}</span>
              </div>

              <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                <span className="text-gray-600 font-medium">Sucursal:</span>
                <span className="text-gray-800">{userData?.branch}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      {showTick && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-500 text-5xl animate-pulse">
          <FaCheckCircle />
        </div>
      )}
    </PrivateRoute>
  );
};

export default Page;
