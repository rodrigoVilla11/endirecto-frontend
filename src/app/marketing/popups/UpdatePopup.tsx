"use client";
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import {
  useGetMarketingByIdQuery,
  useUpdateMarketingMutation,
} from "@/redux/services/marketingApi";
import React, { useEffect, useState } from "react";
import { FaTrashCan } from "react-icons/fa6";
import { useTranslation } from "react-i18next";

type UpdatePopupComponentProps = {
  marketingId: string;
  closeModal: () => void;
};

type FormState = {
  _id: string;
  popups: {
    name: string;
    sequence: number;
    location: string;
    enable: boolean;
    web: string;
    url: string;
    visualization: number;
  };
};

const UpdatePopupComponent = ({
  marketingId,
  closeModal,
}: UpdatePopupComponentProps) => {
  const { t } = useTranslation();
  const { data: popup, error, isLoading } = useGetMarketingByIdQuery({ id: marketingId });
  const [updateMarketing, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateMarketingMutation();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<string>("");

  const [uploadImage, { isLoading: isLoadingUpload }] = useUploadImageMutation();

  const [form, setForm] = useState<FormState>({
    _id: "",
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

  useEffect(() => {
    if (popup) {
      setForm({
        _id: popup._id,
        popups: {
          name: popup.popups.name,
          sequence: popup.popups.sequence,
          location: popup.popups.location,
          enable: popup.popups.enable,
          web: popup.popups.web,
          url: popup.popups.url,
          visualization: popup.popups.visualization,
        },
      });
    }
  }, [popup]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      try {
        const response = await uploadImage(selectedFile).unwrap();
        setUploadResponse(response.url);
      } catch (err) {
        console.error(t("updatePopup.uploadingError"), err);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedForm = {
        ...form,
        popups: {
          ...form.popups,
          web: uploadResponse || form.popups.web,
        },
      };
      await updateMarketing(updatedForm).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("updatePopup.updateErrorLog"), err);
    }
  };

  const handleRemoveImage = () => {
    setForm((prevForm) => ({
      ...prevForm,
      popups: {
        ...prevForm.popups,
        web: "",
      },
    }));
    setUploadResponse("");
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

  if (isLoading) return <p>{t("updatePopup.loading")}</p>;
  if (error) return <p>{t("updatePopup.fetchError")}</p>;

  return (
    <div className="bg-white rounded-2xl p-6">
      <h2 className="text-lg mb-4">{t("updatePopup.title")}</h2>
      <form className="grid grid-cols-2 gap-4" onSubmit={handleUpdate}>
        <div className="flex flex-col gap-2">
          <label className="flex flex-col text-sm">
            {t("updatePopup.nameLabel")}:
            <input
              name="name"
              value={form.popups.name}
              placeholder={t("updatePopup.namePlaceholder")}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-1"
            />
          </label>

          <label className="flex flex-col text-sm">
            {t("updatePopup.sequenceLabel")}:
            <input
              type="number"
              name="sequence"
              value={form.popups.sequence}
              placeholder={t("updatePopup.sequencePlaceholder")}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-1"
            />
          </label>

          <label className="flex flex-col text-sm">
            {t("updatePopup.locationLabel")}:
            <input
              name="location"
              value={form.popups.location}
              placeholder={t("updatePopup.locationPlaceholder")}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-1"
            />
          </label>

          <label className="flex flex-col text-sm">
            {t("updatePopup.enableLabel")}:
            <button
              type="button"
              onClick={handleToggleEnable}
              className={`p-1 rounded-md text-sm ${
                form.popups.enable ? "bg-green-500 text-white" : "bg-red-500 text-white"
              }`}
            >
              {form.popups.enable ? t("updatePopup.enabled") : t("updatePopup.disabled")}
            </button>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex flex-col text-sm">
            {t("updatePopup.webImageLabel")}:
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button
              type="button"
              onClick={handleUpload}
              disabled={isLoadingUpload}
              className="mt-1 bg-blue-500 text-white rounded-md p-1 text-sm"
            >
              {isLoadingUpload ? t("updatePopup.uploading") : t("updatePopup.uploadPrompt")}
            </button>
            {form.popups.web && (
              <div className="flex items-center gap-2 mt-1">
                <img src={form.popups.web} alt={t("updatePopup.webImageAlt")} className="h-16 w-16 rounded-md" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-red-500 text-sm"
                >
                  <FaTrashCan />
                </button>
              </div>
            )}
          </label>
        </div>

        <label className="flex flex-col text-sm col-span-2">
          {t("updatePopup.urlLabel")}:
          <textarea
            name="url"
            value={form.popups.url}
            placeholder={t("updatePopup.urlPlaceholder")}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-1"
          />
        </label>

        <div className="col-span-2 flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-400 rounded-md p-2 text-white text-sm"
          >
            {t("updatePopup.cancel")}
          </button>
          <button
            type="submit"
            className={`rounded-md p-2 text-white text-sm ${isUpdating ? "bg-gray-500" : "bg-success"}`}
            disabled={isUpdating}
          >
            {isUpdating ? t("updatePopup.updating") : t("updatePopup.update")}
          </button>
        </div>

        {isSuccess && (
          <p className="col-span-2 text-green-500 text-sm">
            {t("updatePopup.success")}
          </p>
        )}
        {isError && (
          <p className="col-span-2 text-red-500 text-sm">
            {t("updatePopup.error")}
          </p>
        )}
      </form>
    </div>
  );
};

export default UpdatePopupComponent;
