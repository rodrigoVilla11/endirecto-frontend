"use client";
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import { useCreateMarketingMutation } from "@/redux/services/marketingApi";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";

const CreateTagComponent = ({ closeModal }: { closeModal: () => void }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    tags: {
      name: "",
      enable: false,
      image: "",
      url: "",
    },
  });

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const [uploadImage, { isLoading: isLoadingUpload }] = useUploadImageMutation();
  const [createMarketing, { isLoading: isLoadingCreate, isSuccess, isError }] =
    useCreateMarketingMutation();

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedImageFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (selectedImageFile) {
      try {
        const response = await uploadImage(selectedImageFile).unwrap();
        setUploadedImageUrl(response.url);
        setForm((prevForm) => ({
          ...prevForm,
          tags: {
            ...prevForm.tags,
            image: response.url,
          },
        }));
      } catch (err) {
        console.error(t("createTag.uploadError"), err);
      }
    } else {
      console.error(t("createTag.noFileSelected"));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      tags: {
        ...prevForm.tags,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMarketing(form).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("createTag.createError"), err);
    }
  };

  const handleToggleEnable = () => {
    setForm((prevForm) => ({
      ...prevForm,
      tags: {
        ...prevForm.tags,
        enable: !prevForm.tags.enable,
      },
    }));
  };

  const isSubmitDisabled =
    isLoadingCreate ||
    !form.tags.name ||
    !form.tags.url ||
    !form.tags.image;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-3">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 md:p-7">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">
            {t("createTag.title")}
          </h2>
          <button
            onClick={closeModal}
            className="bg-gray-200 hover:bg-gray-300 rounded-full h-8 w-8 flex justify-center items-center transition"
            aria-label={t("createTag.closeModal")}
          >
            <IoMdClose className="text-gray-700 text-lg" />
          </button>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Datos principales + Imagen / URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Columna izquierda: nombre + enable */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("createTag.nameLabel")}
                </label>
                <input
                  name="name"
                  value={form.tags.name}
                  placeholder={t("createTag.namePlaceholder")}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <span className="block text-sm font-medium text-gray-700">
                  {t("createTag.enableLabel")}
                </span>
                <button
                  type="button"
                  onClick={handleToggleEnable}
                  className={`inline-flex items-center justify-center border border-gray-300 rounded-full px-4 py-2 text-xs font-semibold text-white transition ${
                    form.tags.enable ? "bg-emerald-600" : "bg-red-500"
                  }`}
                  aria-pressed={form.tags.enable}
                >
                  {form.tags.enable ? t("createTag.on") : t("createTag.off")}
                </button>
              </div>
            </div>

            {/* Columna derecha: imagen + url */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("createTag.imageLabel")}
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="block w-full text-xs text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isLoadingUpload}
                    className={`sm:w-auto w-full sm:flex-none bg-blue-500 text-white rounded-md px-4 py-2 text-xs font-semibold transition ${
                      isLoadingUpload
                        ? "opacity-70 cursor-not-allowed"
                        : "hover:bg-blue-600"
                    }`}
                    aria-busy={isLoadingUpload}
                  >
                    {isLoadingUpload
                      ? t("createTag.uploading")
                      : t("createTag.uploadPrompt")}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("createTag.urlLabel")}
                </label>
                <input
                  name="url"
                  value={form.tags.url}
                  placeholder={t("createTag.urlPlaceholder")}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Preview imagen subida */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              {t("createTag.uploadedImagesTitle")}
            </h3>

            {uploadedImageUrl ? (
              <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
                <div className="flex-shrink-0">
                  <img
                    src={uploadedImageUrl}
                    alt={t("createTag.uploadedAlt")}
                    className="h-20 w-20 rounded-md object-cover border border-gray-300"
                  />
                </div>
                <div className="flex-1 w-full">
                  <p className="text-xs text-gray-600 mb-1">
                    {t("createTag.urlColumn")}
                  </p>
                  <a
                    href={uploadedImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline break-all"
                  >
                    {uploadedImageUrl}
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center">
                {t("createTag.noImageUploaded")}
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 mt-1">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-400 hover:bg-gray-500 rounded-md px-4 py-2 text-sm text-white font-medium transition"
            >
              {t("createTag.cancel")}
            </button>
            <button
              type="submit"
              className={`rounded-md px-4 py-2 text-sm text-white font-medium transition ${
                isSubmitDisabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={isSubmitDisabled}
            >
              {isLoadingCreate ? t("createTag.saving") : t("createTag.save")}
            </button>
          </div>

          {isSuccess && (
            <p className="text-sm text-emerald-600 mt-1">
              {t("createTag.success")}
            </p>
          )}
          {isError && (
            <p className="text-sm text-red-500 mt-1">
              {t("createTag.error")}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateTagComponent;
