"use client";
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import { useCreateMarketingMutation } from "@/redux/services/marketingApi";
import React, { useState } from "react";
import { FaTrashCan } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";

const CreateHeaderComponent = ({ closeModal }: { closeModal: () => void }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    header: {
      enable: false,
      img: "",
      url: "",
    },
  });

  const [errors, setErrors] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [createMarketing, { isLoading: isLoadingCreate, isSuccess, isError }] =
    useCreateMarketingMutation();
  const [uploadImage, { isLoading: isLoadingUpload }] = useUploadImageMutation();

  const [selectedHomeFile, setSelectedHomeFile] = useState<File | null>(null);
  const [homeUploadResponse, setHomeUploadResponse] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedHomeFile(event.target.files[0]);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      header: {
        ...prevForm.header,
        [name]: value,
      },
    }));
  };

  const handleUploadHome = async () => {
    if (selectedHomeFile) {
      try {
        const response = await uploadImage(selectedHomeFile).unwrap();
        setHomeUploadResponse(response.url);
        setForm((prevForm) => ({
          ...prevForm,
          header: {
            ...prevForm.header,
            img: response.url,
          },
        }));
        setUploadError("");
      } catch (err) {
        console.error("Error uploading home image:", err);
        setUploadError(t("createHeader.uploadError"));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMarketing(form).unwrap();
      setSuccessMessage(t("createHeader.success"));
      setTimeout(() => {
        closeModal();
      }, 2000);
    } catch (err) {
      console.error("Error creating the Banner:", err);
    }
  };

  const handleRemoveImage = () => {
    setHomeUploadResponse("");
    setForm((prevForm) => ({
      ...prevForm,
      header: {
        ...prevForm.header,
        img: "",
      },
    }));
  };

  const handleToggleEnable = () => {
    setForm((prevForm) => ({
      ...prevForm,
      header: {
        ...prevForm.header,
        enable: !prevForm.header.enable,
      },
    }));
  };

  const isSubmitDisabled =
    isLoadingCreate || !form.header.url || !form.header.img;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-3">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 md:p-7">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">
            {t("createHeader.title")}
          </h2>
          <button
            onClick={closeModal}
            className="bg-gray-200 hover:bg-gray-300 rounded-full h-8 w-8 flex justify-center items-center transition"
          >
            <IoMdClose className="text-lg text-gray-700" />
          </button>
        </div>

        <form
          className="flex flex-col gap-6"
          onSubmit={handleSubmit}
        >
          {/* Zona superior: URL + toggle enable */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* URL (ocupa 2 columnas en desktop) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("createHeader.urlPlaceholder")}
              </label>
              <input
                name="url"
                value={form.header.url}
                placeholder={t("createHeader.urlPlaceholder")}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Enable */}
            <div className="flex flex-col justify-end md:items-start gap-1">
              <span className="text-sm font-medium text-gray-700">
                {t("createHeader.enableLabel")}
              </span>
              <button
                type="button"
                onClick={handleToggleEnable}
                className={`inline-flex items-center justify-center border border-gray-300 rounded-full px-4 py-2 text-xs font-semibold text-white transition ${
                  form.header.enable ? "bg-emerald-600" : "bg-red-500"
                }`}
              >
                {form.header.enable ? t("createHeader.on") : t("createHeader.off")}
              </button>
            </div>
          </div>

          {/* Imagen */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("createHeader.imageLabel")}
                </label>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleUploadHome}
                    disabled={isLoadingUpload || !selectedHomeFile}
                    className={`sm:w-auto w-full sm:flex-none rounded-md px-4 py-2 text-xs font-semibold text-white transition ${
                      isLoadingUpload || !selectedHomeFile
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {isLoadingUpload
                      ? t("createHeader.uploading")
                      : t("createHeader.uploadPrompt")}
                  </button>
                </div>
                {uploadError && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {uploadError}
                  </span>
                )}
              </div>

              {/* Preview imagen */}
              <div className="flex-shrink-0 w-full md:w-64">
                {homeUploadResponse ? (
                  <div className="relative">
                    <img
                      src={homeUploadResponse}
                      alt={t("createHeader.homeImageAlt")}
                      className="w-full h-32 md:h-40 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500 rounded-full p-1 shadow"
                    >
                      <FaTrashCan className="text-xs" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-32 md:h-40 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400">
                    {t("createHeader.homeImageAlt")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-400 hover:bg-gray-500 rounded-md px-4 py-2 text-sm text-white font-medium transition"
            >
              {t("createHeader.cancel")}
            </button>
            <button
              type="submit"
              className={`rounded-md px-4 py-2 text-sm text-white font-medium transition ${
                isSubmitDisabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              disabled={isSubmitDisabled}
            >
              {isLoadingCreate ? t("createHeader.saving") : t("createHeader.save")}
            </button>
          </div>

          {/* Mensajes */}
          {isSuccess && (
            <p className="text-sm text-emerald-600 mt-2">
              {t("createHeader.success")}
            </p>
          )}
          {isError && (
            <p className="text-sm text-red-500 mt-2">
              {t("createHeader.error")}
            </p>
          )}
          {successMessage && (
            <p className="text-sm text-emerald-600 mt-1">{successMessage}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateHeaderComponent;
