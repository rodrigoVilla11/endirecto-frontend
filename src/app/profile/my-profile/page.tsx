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
import { ImageIcon, Upload, User } from "lucide-react";

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
  const [selectedFileProfile, setSelectedFileProfile] = useState<File | null>(
    null
  );
  const [uploadResponseProfile, setUploadResponseProfile] =
    useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File | null>(null);
  const [uploadResponses, setUploadResponses] = useState<string>("");

  const [
    uploadImage,
    {
      isLoading: isLoadingUpload,
      isSuccess: isSuccessUpload,
      isError: isErrorUpload,
    },
  ] = useUploadImageMutation();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFiles(event.target.files[0]);
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

  // ¿es admin?

  useEffect(() => {
    if (selectedClientId && data) {
      setEmail(data?.email);
      setPhone(data?.phone);
      setLogo(data?.logo);
      setProfileImg(data?.profileImg);
      refetch();
    }
  }, [selectedClientId, data, uploadResponses, refetch]);

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
        <h3 className="font-bold p-4 text-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          {t("profile.title")}
        </h3>
        <Header headerBody={headerBody} />
        {selectedClientId ? (
          <div className="w-full mx-auto p-6">
            <div className="bg-gradient-to-br from-white to-gray-50 shadow-2xl rounded-3xl p-8 border-2 border-gray-200">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ID */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      🆔 {t("profile.id")}
                    </label>
                    <input
                      type="text"
                      value={data?.id}
                      disabled
                      className="w-full border-2 border-gray-300 rounded-xl shadow-sm px-4 py-3 bg-gray-100 text-gray-600 font-medium"
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      👤 {t("profile.name")}
                    </label>
                    <input
                      type="text"
                      value={data?.name}
                      disabled
                      className="w-full border-2 border-gray-300 rounded-xl shadow-sm px-4 py-3 bg-gray-100 text-gray-600 font-medium"
                    />
                  </div>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      📧 {t("profile.email")}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-xl shadow-sm px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>
                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      📱 {t("profile.phone")}
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-xl shadow-sm px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>

                  {/* Logo Section */}
                  <div className="p-6 bg-white rounded-2xl shadow-lg border-2 border-gray-200">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-purple-600" />
                        <span className="text-lg font-bold text-gray-900">
                          {t("profile.images")}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-purple-500 transition-colors text-center">
                            <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                            <span className="text-sm text-gray-600 font-medium">
                              {selectedFiles?.name || t("profile.selectFile")}
                            </span>
                          </div>
                        </label>

                        <button
                          type="button"
                          onClick={handleUpload}
                          disabled={isLoadingUpload}
                          className={`px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                            isLoadingUpload
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          }`}
                        >
                          {isLoadingUpload ? "⏳" : "📤"}{" "}
                          {isLoadingUpload
                            ? t("profile.uploading")
                            : t("profile.uploadImages")}
                        </button>
                      </div>

                      {isSuccessUpload && (
                        <div className="p-3 bg-green-50 border-2 border-green-300 rounded-xl">
                          <p className="text-sm text-green-700 font-semibold text-center">
                            ✅ {t("profile.imagesUploadedSuccess")}
                          </p>
                        </div>
                      )}

                      {isErrorUpload && (
                        <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl">
                          <p className="text-sm text-red-700 font-semibold text-center">
                            ❌ {t("profile.errorUploadingImages")}
                          </p>
                        </div>
                      )}

                      {(data?.logo || uploadResponses) && (
                        <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                          <div className="flex items-center gap-4">
                            <img
                              src={data?.logo || uploadResponses}
                              alt="Logo"
                              className="h-20 w-20 rounded-xl object-cover border-2 border-gray-300"
                            />
                            <div className="flex-1 min-w-0">
                              <a
                                href={data?.logo || uploadResponses}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm truncate block"
                              >
                                {(data?.logo || uploadResponses).length > 40
                                  ? `${(
                                      data?.logo || uploadResponses
                                    ).substring(0, 40)}...`
                                  : data?.logo || uploadResponses}
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <FaTrashCan className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Image Section */}
                  <div className="p-6 bg-white rounded-2xl shadow-lg border-2 border-gray-200">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-600" />
                        <span className="text-lg font-bold text-gray-900">
                          {t("profile.profileImage")}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChangeProfile}
                            className="hidden"
                          />
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-purple-500 transition-colors text-center">
                            <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                            <span className="text-sm text-gray-600 font-medium">
                              {selectedFileProfile?.name ||
                                t("profile.selectFile")}
                            </span>
                          </div>
                        </label>

                        <button
                          type="button"
                          onClick={handleUploadProfile}
                          disabled={isLoadingUpload}
                          className={`px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                            isLoadingUpload
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          }`}
                        >
                          {isLoadingUpload ? "⏳" : "📤"}{" "}
                          {isLoadingUpload
                            ? t("profile.uploading")
                            : t("profile.uploadImages")}
                        </button>
                      </div>

                      {isSuccessUpload && (
                        <div className="p-3 bg-green-50 border-2 border-green-300 rounded-xl">
                          <p className="text-sm text-green-700 font-semibold text-center">
                            ✅ {t("profile.imagesUploadedSuccess")}
                          </p>
                        </div>
                      )}

                      {isErrorUpload && (
                        <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl">
                          <p className="text-sm text-red-700 font-semibold text-center">
                            ❌ {t("profile.errorUploadingImages")}
                          </p>
                        </div>
                      )}

                      {(uploadResponseProfile || data?.profileImg) && (
                        <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                          <div className="flex items-center gap-4">
                            <img
                              src={uploadResponseProfile || data?.profileImg}
                              alt="Profile"
                              className="h-20 w-20 rounded-full object-cover border-2 border-gray-300"
                            />
                            <div className="flex-1 min-w-0">
                              <a
                                href={uploadResponseProfile || data?.profileImg}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm truncate block"
                              >
                                {(() => {
                                  const url =
                                    uploadResponseProfile ||
                                    data?.profileImg ||
                                    "";
                                  return url.length > 40
                                    ? `${url.substring(0, 40)}...`
                                    : url;
                                })()}
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveImageProfile}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <FaTrashCan className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Additional Fields - Read Only */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      💳 {t("profile.paymentCondition")}
                    </label>
                    <input
                      type="text"
                      value={data?.payment_condition_id}
                      disabled
                      className="w-full border-2 border-gray-300 rounded-xl shadow-sm px-4 py-3 bg-gray-100 text-gray-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      🏢 {t("profile.cuit")}
                    </label>
                    <input
                      type="text"
                      value={data?.cuit}
                      disabled
                      className="w-full border-2 border-gray-300 rounded-xl shadow-sm px-4 py-3 bg-gray-100 text-gray-600 font-medium"
                    />
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      📍 {t("profile.address")}
                    </label>
                    <input
                      type="text"
                      value={data?.address}
                      disabled
                      className="w-full border-2 border-gray-300 rounded-xl shadow-sm px-4 py-3 bg-gray-100 text-gray-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      🏙️ {t("profile.locality")}
                    </label>
                    <input
                      type="text"
                      value={data?.locality}
                      disabled
                      className="w-full border-2 border-gray-300 rounded-xl shadow-sm px-4 py-3 bg-gray-100 text-gray-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      🗺️ {t("profile.state")}
                    </label>
                    <input
                      type="text"
                      value={data?.state}
                      disabled
                      className="w-full border-2 border-gray-300 rounded-xl shadow-sm px-4 py-3 bg-gray-100 text-gray-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      💰 {t("profile.priceList")}
                    </label>
                    <input
                      type="text"
                      value={data?.price_list_id}
                      disabled
                      className="w-full border-2 border-gray-300 rounded-xl shadow-sm px-4 py-3 bg-gray-100 text-gray-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      👨‍💼 {t("profile.seller")}
                    </label>
                    <input
                      type="text"
                      value={data?.seller_id}
                      disabled
                      className="w-full border-2 border-gray-300 rounded-xl shadow-sm px-4 py-3 bg-gray-100 text-gray-600 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white font-bold rounded-2xl hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl text-lg"
                >
                  {isUpdating
                    ? "⏳ " + t("profile.updating")
                    : "💾 " + t("profile.updateInformation")}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="w-full mx-auto p-6">
            <div className="bg-gradient-to-br from-white to-gray-50 shadow-2xl rounded-3xl p-8 border-2 border-gray-200 space-y-6">
              <InfoRow
                icon="🆔"
                label={t("profile.id")}
                value={userData?._id}
              />
              <InfoRow
                icon="👤"
                label={t("profile.name")}
                value={userData?.username}
              />
              <InfoRow
                icon="🎭"
                label={t("profile.role")}
                value={userData?.role}
              />
              <InfoRow
                icon="📧"
                label={t("profile.email")}
                value={userData?.email}
              />
              <InfoRow
                icon="🏢"
                label={t("profile.branch")}
                value={userData?.branch}
              />
            </div>
          </div>
        )}
      </div>
      {showTick && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-500 text-6xl animate-pulse z-50">
          <FaCheckCircle />
        </div>
      )}
    </PrivateRoute>
  );
};
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-colors">
      <span className="text-3xl">{icon}</span>
      <div className="flex-1">
        <span className="block text-sm text-gray-600 font-semibold">
          {label}
        </span>
        <span className="block text-gray-900 font-bold">{value || "—"}</span>
      </div>
    </div>
  );
}
export default Page;
