"use client";
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import {
  useGetMarketingByIdQuery,
  useUpdateMarketingMutation,
} from "@/redux/services/marketingApi";
import React, { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { FaTrashCan } from "react-icons/fa6";
import { useTranslation } from "react-i18next";

type UpdateBannerComponentProps = {
  marketingId: string;
  closeModal: () => void;
};

type FormState = {
  _id: string;
  headers: {
    name: string;
    sequence: number;
    enable: boolean;
    homeWeb: string;
    url: string;
  };
};

const UpdateBannerComponent = ({
  marketingId,
  closeModal,
}: UpdateBannerComponentProps) => {
  const { t } = useTranslation();
  const { data: header, error, isLoading } = useGetMarketingByIdQuery({ id: marketingId });
  const [updateMarketing, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateMarketingMutation();

  const [form, setForm] = useState<FormState>({
    _id: "",
    headers: {
      name: "",
      sequence: 0,
      enable: false,
      homeWeb: "",
      url: "",
    },
  });

  const [selectedHomeFile, setSelectedHomeFile] = useState<File | null>(null);
  const [homeUploadResponse, setHomeUploadResponse] = useState<string>("");

  const [
    uploadImage,
    { isLoading: isLoadingUpload, isSuccess: isSuccessUpload, isError: isErrorUpload },
  ] = useUploadImageMutation();

  useEffect(() => {
    if (header) {
      setForm({
        _id: header._id,
        headers: {
          name: header.headers.name,
          sequence: header.headers.sequence,
          enable: header.headers.enable,
          homeWeb: header.headers.homeWeb,
          url: header.headers.url,
        },
      });
    }
  }, [header]);

  const handleHomeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedHomeFile(event.target.files[0]);
    }
  };

  const handleUploadHome = async () => {
    if (selectedHomeFile) {
      try {
        const response = await uploadImage(selectedHomeFile).unwrap();
        setHomeUploadResponse(response.url);
      } catch (err) {
        console.error("Error uploading home image:", err);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      headers: {
        ...prevForm.headers,
        [name]: name === "sequence" ? Number(value) : value,
      },
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedForm = {
        ...form,
        headers: {
          ...form.headers,
          homeWeb: homeUploadResponse || form.headers.homeWeb,
        },
      };
      await updateMarketing(updatedForm).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating the banner:", err);
    }
  };

  const handleRemoveImage = (imageType: "homeWeb" | "headerWeb") => {
    setForm((prevForm) => ({
      ...prevForm,
      headers: {
        ...prevForm.headers,
        [imageType]: "",
      },
    }));
  };

  if (isLoading) return <p>{t("updateBanner.loading")}</p>;
  if (error) return <p>{t("updateBanner.fetchError")}</p>;

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">{t("updateBanner.title")}</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>

      <form className="grid grid-cols-2 gap-4" onSubmit={handleUpdate}>
        <div className="flex flex-col gap-2">
          <label className="flex flex-col text-sm">
            {t("updateBanner.name")}:
            <input
              name="name"
              value={form.headers.name}
              placeholder={t("updateBanner.namePlaceholder")}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-1 text-sm"
            />
          </label>

          <label className="flex flex-col text-sm">
            {t("updateBanner.sequence")}:
            <input
              type="number"
              name="sequence"
              value={form.headers.sequence}
              onChange={handleChange}
              placeholder={t("updateBanner.sequencePlaceholder")}
              className="border border-gray-300 rounded-md p-1 text-sm"
            />
          </label>

          <label className="flex flex-col text-sm">
            {t("updateBanner.enable")}:
            <button
              type="button"
              onClick={() =>
                setForm((prevForm) => ({
                  ...prevForm,
                  headers: {
                    ...prevForm.headers,
                    enable: !prevForm.headers.enable,
                  },
                }))
              }
              className={`p-1 rounded-md text-sm ${
                form.headers.enable
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {form.headers.enable ? t("updateBanner.enabled") : t("updateBanner.disabled")}
            </button>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex flex-col text-sm">
            {t("updateBanner.homeImage")}:
            <input
              type="file"
              accept="image/*"
              onChange={handleHomeFileChange}
            />
            <button
              type="button"
              onClick={handleUploadHome}
              disabled={isLoadingUpload}
              className="mt-1 bg-blue-500 text-white rounded-md p-1 text-sm"
            >
              {isLoadingUpload ? t("updateBanner.uploading") : t("updateBanner.uploadImage")}
            </button>
            {form.headers.homeWeb && (
              <div className="flex items-center gap-2 mt-1">
                <img
                  src={form.headers.homeWeb}
                  alt={t("updateBanner.homeImageAlt")}
                  className="h-20 w-full rounded-md"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage("homeWeb")}
                  className="text-red-500 text-sm"
                >
                  <FaTrashCan />
                </button>
              </div>
            )}
          </label>
        </div>

        <label className="flex flex-col text-sm col-span-2">
          {t("updateBanner.url")}:
          <textarea
            name="url"
            value={form.headers.url}
            placeholder={t("updateBanner.urlPlaceholder")}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-1 text-sm"
          />
        </label>

        <div className="col-span-2 flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-400 rounded-md p-2 text-white text-sm"
          >
            {t("updateBanner.cancel")}
          </button>
          <button
            type="submit"
            className={`rounded-md p-2 text-white text-sm ${
              isUpdating ? "bg-gray-500" : "bg-success"
            }`}
            disabled={isUpdating}
          >
            {isUpdating ? t("updateBanner.updating") : t("updateBanner.update")}
          </button>
        </div>

        {isSuccess && (
          <p className="col-span-2 text-green-500 text-sm">
            {t("updateBanner.success")}
          </p>
        )}
        {isError && (
          <p className="col-span-2 text-red-500 text-sm">
            {t("updateBanner.error")}
          </p>
        )}
      </form>
    </div>
  );
};

export default UpdateBannerComponent;
