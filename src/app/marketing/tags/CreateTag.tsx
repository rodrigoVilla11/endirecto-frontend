"use client";
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import { useCreateMarketingMutation } from "@/redux/services/marketingApi";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { FaTrashCan } from "react-icons/fa6";
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

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-auto">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">{t("createTag.title")}</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-8 w-8 flex justify-center items-center"
            aria-label={t("createTag.closeModal")}
          >
            <IoMdClose className="text-lg" />
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex flex-col mb-2">
                {t("createTag.nameLabel")}:
                <input
                  name="name"
                  value={form.tags.name}
                  placeholder={t("createTag.namePlaceholder")}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-400"
                />
              </label>

              <div className="flex flex-col mb-2">
                <label>{t("createTag.enableLabel")}:</label>
                <button
                  type="button"
                  onClick={handleToggleEnable}
                  className={`border border-gray-300 rounded-md p-2 text-white w-24 ${
                    form.tags.enable ? "bg-green-500" : "bg-red-500"
                  }`}
                  aria-pressed={form.tags.enable}
                >
                  {form.tags.enable ? t("createTag.on") : t("createTag.off")}
                </button>
              </div>
            </div>

            <div>
              <label className="flex flex-col mb-2">
                {t("createTag.imageLabel")}:
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isLoadingUpload}
                    className="ml-2 bg-blue-500 text-white rounded-md px-4 py-2"
                    aria-busy={isLoadingUpload}
                  >
                    {isLoadingUpload ? t("createTag.uploading") : t("createTag.uploadPrompt")}
                  </button>
                </div>
              </label>

              <label className="flex flex-col mb-2">
                {t("createTag.urlLabel")}:
                <input
                  name="url"
                  value={form.tags.url}
                  placeholder={t("createTag.urlPlaceholder")}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-400"
                />
              </label>
            </div>
          </div>

          {/* Display uploaded image and URL */}
          <div className="mt-4">
            <h3 className="text-md font-semibold mb-2">{t("createTag.uploadedImagesTitle")}</h3>
            {uploadedImageUrl ? (
              <table className="min-w-full border border-gray-300 rounded-md">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 w-1/4 text-center">
                      {t("createTag.imageColumn")}
                    </th>
                    <th className="border border-gray-300 p-2 text-center">
                      {t("createTag.urlColumn")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2 text-center">
                      <img
                        src={uploadedImageUrl}
                        alt={t("createTag.uploadedAlt")}
                        className="h-16 w-16 object-cover mx-auto"
                      />
                    </td>
                    <td className="border border-gray-300 p-2 break-all text-center">
                      <a
                        href={uploadedImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        {uploadedImageUrl}
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center">{t("createTag.noImageUploaded")}</p>
            )}
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-400 rounded-md p-2 text-white"
            >
              {t("createTag.cancel")}
            </button>
            <button
              type="submit"
              className={`rounded-md p-2 text-white ${
                isLoadingCreate ||
                !form.tags.name ||
                !form.tags.url ||
                !form.tags.image
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-blue-600"
              }`}
              disabled={
                isLoadingCreate ||
                !form.tags.name ||
                !form.tags.url ||
                !form.tags.image
              }
            >
              {isLoadingCreate ? t("createTag.saving") : t("createTag.save")}
            </button>
          </div>

          {isSuccess && (
            <p className="text-green-500 mt-2">{t("createTag.success")}</p>
          )}
          {isError && (
            <p className="text-red-500 mt-2">{t("createTag.error")}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateTagComponent;
