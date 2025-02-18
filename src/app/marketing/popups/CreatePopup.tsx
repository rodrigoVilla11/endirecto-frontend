"use client";
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import { useCreateMarketingMutation } from "@/redux/services/marketingApi";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { FaTrashCan } from "react-icons/fa6";
import { useTranslation } from "react-i18next";

const CreatePopupComponent = ({ closeModal }: { closeModal: () => void }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    popups: {
      name: "",
      sequence: 0,
      location: "",
      enable: false,
      web: "",
      url: "",
      visualization: 0,
    },
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [
    uploadImage,
    { isLoading: isLoadingUpload },
  ] = useUploadImageMutation();

  const [createMarketing, { isLoading: isLoadingCreate, isSuccess, isError }] =
    useCreateMarketingMutation();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      try {
        const response = await uploadImage(selectedFile).unwrap();
        setUploadedImages((prevImages) => [...prevImages, response.url]);
        setForm((prevForm) => ({
          ...prevForm,
          popups: {
            ...prevForm.popups,
            web: response.url,
          },
        }));
        setSelectedFile(null); // Clear the selected file after upload
      } catch (err) {
        console.error(t("createPopup.uploadError"), err);
      }
    } else {
      console.error(t("createPopup.noFileSelected"));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      popups: {
        ...prevForm.popups,
        [name]:
          name === "sequence" || name === "visualization"
            ? Number(value)
            : value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMarketing(form).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("createPopup.createError"), err);
    }
  };

  const handleToggleEnable = () => {
    setForm((prevForm) => ({
      ...prevForm,
      popups: {
        ...prevForm.popups,
        enable: !prevForm.popups.enable,
      },
    }));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[600px]">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">{t("createPopup.title")}</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-8 w-8 flex justify-center items-center"
          >
            <IoMdClose className="text-lg" />
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            {/* Form Inputs */}
            <div className="flex flex-col">
              <label className="flex flex-col mb-2">
                {t("createPopup.nameLabel")}:
                <input
                  name="name"
                  value={form.popups.name}
                  placeholder={t("createPopup.namePlaceholder")}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-400"
                />
              </label>

              <label className="flex flex-col mb-2">
                {t("createPopup.sequenceLabel")}:
                <input
                  type="number"
                  name="sequence"
                  value={form.popups.sequence}
                  placeholder={t("createPopup.sequencePlaceholder")}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-400"
                />
              </label>

              <label className="flex flex-col mb-2">
                {t("createPopup.locationLabel")}:
                <input
                  name="location"
                  value={form.popups.location}
                  placeholder={t("createPopup.locationPlaceholder")}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-400"
                />
              </label>

              <div className="flex flex-col">
                <label>{t("createPopup.enableLabel")}:</label>
                <button
                  type="button"
                  onClick={handleToggleEnable}
                  className={`border border-gray-300 rounded-md p-2 text-white w-24 ${
                    form.popups.enable ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {form.popups.enable ? t("createPopup.on") : t("createPopup.off")}
                </button>
              </div>
            </div>

            {/* Upload Section */}
            <div className="flex flex-col">
              <label className="flex flex-col text-sm">
                {t("createPopup.imageLabel")}:
                <div className="flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isLoadingUpload || !selectedFile}
                    className="ml-2 bg-blue-500 text-white rounded-md px-4 py-2"
                  >
                    {isLoadingUpload ? t("createPopup.uploading") : t("createPopup.uploadPrompt")}
                  </button>
                </div>
              </label>

              {/* Images Table */}
              <h3 className="text-md font-semibold mt-4 mb-2">
                {t("createPopup.uploadedImagesTitle")}
              </h3>
              <table className="min-w-full border border-gray-300 rounded-md">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 w-1/4 text-center">
                      {t("createPopup.imageColumn")}
                    </th>
                    <th className="border border-gray-300 p-2 text-center">
                      {t("createPopup.urlColumn")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {uploadedImages.length > 0 ? (
                    uploadedImages.map((image, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 p-2 text-center">
                          <img
                            src={image}
                            alt={t("createPopup.uploadedAlt")}
                            className="h-16 w-16 object-cover mx-auto"
                          />
                        </td>
                        <td className="border border-gray-300 p-2 break-all text-center">
                          <a
                            href={image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline"
                          >
                            {image}
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={2}
                        className="border border-gray-300 p-2 text-center text-gray-500"
                      >
                        {t("createPopup.noImages")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-400 rounded-md p-2 text-white"
            >
              {t("createPopup.cancel")}
            </button>
            <button
              type="submit"
              className={`rounded-md p-2 text-white ${isLoadingCreate ? "bg-gray-500" : "bg-green-500"}`}
              disabled={isLoadingCreate}
            >
              {isLoadingCreate ? t("createPopup.saving") : t("createPopup.save")}
            </button>
          </div>
        </form>

        {/* Messages */}
        {isSuccess && (
          <p className="text-green-500 mt-4">{t("createPopup.success")}</p>
        )}
        {isError && <p className="text-red-500 mt-4">{t("createPopup.error")}</p>}
      </div>
    </div>
  );
};

export default CreatePopupComponent;
