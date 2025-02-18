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
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import { useTranslation } from "react-i18next";
import { FaCheckCircle } from "react-icons/fa";

const Page = () => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();
  const { userData } = useAuth();

  const [receiveNotifications, setReceiveNotifications] = useState(false);
  const { data: branchsData } = useGetBranchesQuery(null);
  const { data, isLoading, refetch } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const branch = branchsData?.find((d) => d.id === userData?.branch);
  const [updateCustomer, { isLoading: isUpdating, isSuccess }] =
    useUpdateCustomerMutation();
  const [showTick, setShowTick] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [logo, setLogo] = useState("");
  const [profileImg, setProfileImg] = useState("");
  const [selectedFileProfile, setSelectedFileProfile] = useState<File | null>(null);
  const [uploadResponseProfile, setUploadResponseProfile] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File | null>(null);
  const [uploadResponses, setUploadResponses] = useState<string>("");

  const [
    uploadImage,
    { isLoading: isLoadingUpload, isSuccess: isSuccessUpload, isError: isErrorUpload },
  ] = useUploadImageMutation();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFiles(event.target.files[0]);
    }
  };

  const handleFileChangeProfile = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        console.error(t("profile.uploadError"), err);
      }
    } else {
      console.error(t("profile.noFileSelected"));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles) {
      try {
        const responses = await uploadImage(selectedFiles).unwrap();
        setUploadResponses(responses.url);
      } catch (err) {
        console.error(t("profile.uploadError"), err);
      }
    } else {
      console.error(t("profile.noFileSelected"));
    }
  };

  useEffect(() => {
    if (selectedClientId && data) {
      setEmail(data?.email);
      setPhone(data?.phone);
      setLogo(data?.logo);
      setProfileImg(data?.profileImg);
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
        title: t("profile.changePassword"),
      },
    ],
    filters: [],
    results: "",
  };

  const handleRemoveImage = async () => {
    setUploadResponses("");
    const payload = {
      id: data?.id || "",
      logo: "",
    };
    await updateCustomer(payload);
    refetch();
  };

  const handleRemoveImageProfile = async () => {
    setUploadResponseProfile("");
    const payload = {
      id: data?.id || "",
      profileImg: "",
    };
    await updateCustomer(payload);
    refetch();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: data?.id || "",
      email: email,
      phone: phone,
      logo: uploadResponses || data?.logo || "",
      profileImg: uploadResponseProfile || data?.profileImg || "",
      receive_notifications: receiveNotifications,
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
        <h3 className="font-bold p-4">{t("profile.title")}</h3>
        <Header headerBody={headerBody} />
        {selectedClientId ? (
          <div className="w-full mx-auto p-6">
            <div className="bg-white shadow-md rounded-md p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("profile.id")}
                    </label>
                    <input
                      type="text"
                      value={data?.id}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("profile.name")}
                    </label>
                    <input
                      type="text"
                      value={data?.name}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("profile.email")}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("profile.phone")}
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"
                    />
                  </div>
                  {/* Images Section */}
                  <div className="p-4 bg-white rounded-md shadow-md">
                    <label className="flex flex-col gap-4">
                      <span className="text-lg font-semibold">
                        {t("profile.images")}
                      </span>
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
                          {isLoadingUpload
                            ? t("profile.uploading")
                            : t("profile.uploadImages")}
                        </button>
                      </div>
                      {isSuccessUpload && (
                        <div className="mt-2 text-sm text-green-600 font-medium">
                          {t("profile.imagesUploadedSuccess")}
                        </div>
                      )}
                      {isErrorUpload && (
                        <div className="mt-2 text-sm text-red-600 font-medium">
                          {t("profile.errorUploadingImages")}
                        </div>
                      )}
                      <div className="border rounded-md p-4 mt-4">
                        <table className="min-w-full table-auto border-collapse border border-gray-300">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-gray-300 p-2 text-left">
                                {t("profile.table.image")}
                              </th>
                              <th className="border border-gray-300 p-2 text-left">
                                {t("profile.table.link")}
                              </th>
                              <th className="border border-gray-300 p-2 text-center">
                                {t("profile.table.action")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {data?.logo ? (
                              <tr className="hover:bg-gray-50">
                                <td className="border border-gray-300 p-2">
                                  <img
                                    src={data?.logo}
                                    alt=""
                                    className="h-10 w-auto rounded-md"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <a
                                    href={data?.logo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    {data?.logo.length > 30
                                      ? `${data?.logo.substring(0, 30)}...`
                                      : data?.logo}
                                  </a>
                                </td>
                                <td className="border border-gray-300 p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage()}
                                    className="text-red-500 hover:text-red-700 transition"
                                  >
                                    <FaTrashCan className="inline-block" />
                                  </button>
                                </td>
                              </tr>
                            ) : (
                              <tr className="hover:bg-gray-50">
                                <td className="border border-gray-300 p-2">
                                  <img
                                    src={uploadResponses}
                                    alt=""
                                    className="h-10 w-auto rounded-md"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <a
                                    href={uploadResponses}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    {uploadResponses.length > 30
                                      ? `${uploadResponses.substring(0, 30)}...`
                                      : uploadResponses}
                                  </a>
                                </td>
                                <td className="border border-gray-300 p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage()}
                                    className="text-red-500 hover:text-red-700 transition"
                                  >
                                    <FaTrashCan className="inline-block" />
                                  </button>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </label>
                  </div>
                  {/* Profile Image Section */}
                  <div className="p-4 bg-white rounded-md shadow-md">
                    <label className="flex flex-col gap-4">
                      <span className="text-lg font-semibold">
                        {t("profile.profileImage")}
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
                          {isLoadingUpload
                            ? t("profile.uploading")
                            : t("profile.uploadImages")}
                        </button>
                      </div>
                      {isSuccessUpload && (
                        <div className="mt-2 text-sm text-green-600 font-medium">
                          {t("profile.imagesUploadedSuccess")}
                        </div>
                      )}
                      {isErrorUpload && (
                        <div className="mt-2 text-sm text-red-600 font-medium">
                          {t("profile.errorUploadingImages")}
                        </div>
                      )}
                      <div className="border rounded-md p-4 mt-4">
                        <table className="min-w-full table-auto border-collapse border border-gray-300">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-gray-300 p-2 text-left">
                                {t("profile.table.image")}
                              </th>
                              <th className="border border-gray-300 p-2 text-left">
                                {t("profile.table.link")}
                              </th>
                              <th className="border border-gray-300 p-2 text-center">
                                {t("profile.table.action")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 p-2">
                                <img
                                  src={uploadResponseProfile || data?.profileImg}
                                  alt=""
                                  className="h-10 w-auto rounded-md"
                                />
                              </td>
                              <td className="border border-gray-300 p-2">
                                <a
                                  href={uploadResponseProfile || data?.profileImg}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                >
                                  {data?.profileImg
                                    ? data?.profileImg.length > 30
                                      ? `${data?.profileImg.substring(0, 30)}...`
                                      : data?.profileImg
                                    : uploadResponseProfile.length > 30
                                    ? `${uploadResponseProfile.substring(0, 30)}...`
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
                  {/* Notifications */}
                  <div className="col-span-2 flex items-center">
                    <label className="block text-sm font-medium text-gray-700 mr-4">
                      {t("profile.receiveNotifications")}
                    </label>
                    <input
                      type="checkbox"
                      checked={receiveNotifications}
                      onChange={() => setReceiveNotifications(!receiveNotifications)}
                      className="h-6 w-6 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  {/* Additional Data */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("profile.paymentCondition")}
                    </label>
                    <input
                      type="text"
                      value={data?.payment_condition_id}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("profile.cuit")}
                    </label>
                    <input
                      type="text"
                      value={data?.cuit}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t("profile.address")}
                    </label>
                    <input
                      type="text"
                      value={data?.address}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("profile.locality")}
                    </label>
                    <input
                      type="text"
                      value={data?.locality}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("profile.state")}
                    </label>
                    <input
                      type="text"
                      value={data?.state}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("profile.priceList")}
                    </label>
                    <input
                      type="text"
                      value={data?.price_list_id}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-block py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md disabled:bg-gray-400"
                >
                  {isUpdating ? t("profile.updating") : t("profile.updateInformation")}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="w-full mx-auto p-6">
            <div className="bg-white shadow-md rounded-md p-6 space-y-4 flex flex-col justify-center">
              <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                <span className="text-gray-600 font-medium">{t("profile.id")}</span>
                <span className="text-gray-800 font-mono">{userData?._id}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                <span className="text-gray-600 font-medium">{t("profile.name")}</span>
                <span className="text-gray-800">{userData?.username}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                <span className="text-gray-600 font-medium">{t("profile.role")}</span>
                <span className="text-gray-800">{userData?.role}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                <span className="text-gray-600 font-medium">{t("profile.email")}</span>
                <span className="text-gray-800">{userData?.email}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                <span className="text-gray-600 font-medium">{t("profile.branch")}</span>
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
