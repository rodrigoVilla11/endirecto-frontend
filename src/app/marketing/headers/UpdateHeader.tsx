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

type UpdateHeaderComponentProps = {
  marketingId: string;
  closeModal: () => void;
};

type FormState = {
  _id: string;
  header: {
    enable: boolean;
    img: string;
    url: string;
  };
};

const UpdateHeaderComponent = ({
  marketingId,
  closeModal,
}: UpdateHeaderComponentProps) => {
  const { t } = useTranslation();
  const { data: header, error, isLoading } = useGetMarketingByIdQuery({ id: marketingId });
  const [updateMarketing, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateMarketingMutation();

  const [form, setForm] = useState<FormState>({
    _id: "",
    header: {
      enable: false,
      img: "",
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
        header: {
          enable: header.header.enable,
          img: header.header.img,
          url: header.header.url,
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
        console.error(t("updateHeader.uploadingError"), err);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      header: {
        ...prevForm.header,
        [name]: name === "sequence" ? Number(value) : value,
      },
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedForm = {
        ...form,
        header: {
          ...form.header,
          img: homeUploadResponse || form.header.img,
        },
      };
      await updateMarketing(updatedForm).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("updateHeader.updateErrorLog"), err);
    }
  };

  const handleRemoveImage = () => {
    setForm((prevForm) => ({
      ...prevForm,
      header: {
        ...prevForm.header,
        img: "",
      },
    }));
  };

  if (isLoading) return <p>{t("updateHeader.loading")}</p>;
  if (error) return <p>{t("updateHeader.fetchError")}</p>;

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">{t("updateHeader.title")}</h2>
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
            {t("updateHeader.enableLabel")}:
            <button
              type="button"
              onClick={() =>
                setForm((prevForm) => ({
                  ...prevForm,
                  header: {
                    ...prevForm.header,
                    enable: !prevForm.header.enable,
                  },
                }))
              }
              className={`p-1 rounded-md text-sm ${
                form.header.enable ? "bg-green-500 text-white" : "bg-red-500 text-white"
              }`}
            >
              {form.header.enable ? t("updateHeader.enabled") : t("updateHeader.disabled")}
            </button>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex flex-col text-sm">
            {t("updateHeader.imageLabel")}:
            <input type="file" accept="image/*" onChange={handleHomeFileChange} />
            <button
              type="button"
              onClick={handleUploadHome}
              disabled={isLoadingUpload}
              className="mt-1 bg-blue-500 text-white rounded-md p-1 text-sm"
            >
              {isLoadingUpload ? t("updateHeader.uploading") : t("updateHeader.uploadPrompt")}
            </button>
            {form.header.img && (
              <div className="flex items-center gap-2 mt-1">
                <img
                  src={form.header.img}
                  alt={t("updateHeader.homeImageAlt")}
                  className="h-20 w-full rounded-md"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage()}
                  className="text-red-500 text-sm"
                >
                  <FaTrashCan />
                </button>
              </div>
            )}
          </label>
        </div>

        <label className="flex flex-col text-sm col-span-2">
          {t("updateHeader.urlLabel")}:
          <textarea
            name="url"
            value={form.header.url}
            placeholder={t("updateHeader.urlPlaceholder")}
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
            {t("updateHeader.cancel")}
          </button>
          <button
            type="submit"
            className={`rounded-md p-2 text-white text-sm ${
              isUpdating ? "bg-gray-500" : "bg-success"
            }`}
            disabled={isUpdating}
          >
            {isUpdating ? t("updateHeader.updating") : t("updateHeader.update")}
          </button>
        </div>

        {isSuccess && (
          <p className="col-span-2 text-green-500 text-sm">
            {t("updateHeader.success")}
          </p>
        )}
        {isError && (
          <p className="col-span-2 text-red-500 text-sm">
            {t("updateHeader.error")}
          </p>
        )}
      </form>
    </div>
  );
};

export default UpdateHeaderComponent;
