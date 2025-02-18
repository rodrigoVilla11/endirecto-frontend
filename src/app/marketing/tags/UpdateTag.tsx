import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import {
  useGetMarketingByIdQuery,
  useUpdateMarketingMutation,
} from "@/redux/services/marketingApi";
import React, { useEffect, useState } from "react";
import { FaTrashCan } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";

type UpdateTagComponentProps = {
  marketingId: string;
  closeModal: () => void;
};

type FormState = {
  _id: string;
  tags: {
    name: string;
    enable: boolean;
    image: string;
    url: string;
  };
};

const UpdateTagComponent = ({ marketingId, closeModal }: UpdateTagComponentProps) => {
  const { t } = useTranslation();

  const { data: tag, error, isLoading } = useGetMarketingByIdQuery({ id: marketingId });

  const [updateMarketing, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateMarketingMutation();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<string>("");

  const [
    uploadImage,
    { isLoading: isLoadingUpload, isSuccess: isSuccessUpload, isError: isErrorUpload },
  ] = useUploadImageMutation();

  const [form, setForm] = useState<FormState>({
    _id: "",
    tags: {
      name: "",
      enable: false,
      image: "",
      url: "",
    },
  });

  useEffect(() => {
    if (tag) {
      setForm({
        _id: tag._id,
        tags: {
          name: tag.tags.name,
          enable: tag.tags.enable,
          image: tag.tags.image,
          url: tag.tags.url,
        },
      });
    }
  }, [tag]);

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
        console.error("Error uploading image:", err);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      tags: {
        ...prevForm.tags,
        [name]: value,
      },
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedForm = {
        ...form,
        tags: {
          ...form.tags,
          image: uploadResponse || form.tags.image,
        },
      };

      await updateMarketing(updatedForm).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating the Tag:", err);
    }
  };

  const handleRemoveImage = () => {
    setForm((prevForm) => ({
      ...prevForm,
      tags: {
        ...prevForm.tags,
        image: "",
      },
    }));
    setUploadResponse("");
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

  if (isLoading) return <p>{t("loading")}</p>;
  if (error) return <p>{t("error_loading")}</p>;

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">{t("update_tag")}</h2>
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
            {t("name")}:
            <input
              name="name"
              value={form.tags.name}
              placeholder={t("tag_name")}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-1 text-sm"
            />
          </label>

          <label className="flex flex-col text-sm">
            {t("enable")}:
            <button
              type="button"
              onClick={handleToggleEnable}
              className={`p-1 rounded-md text-sm ${
                form.tags.enable ? "bg-green-500 text-white" : "bg-red-500 text-white"
              }`}
            >
              {form.tags.enable ? t("enabled") : t("disabled")}
            </button>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex flex-col text-sm">
            {t("image")}:
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button
              type="button"
              onClick={handleUpload}
              disabled={isLoadingUpload}
              className="mt-1 bg-blue-500 text-white rounded-md p-1 text-sm"
            >
              {isLoadingUpload ? t("uploading") : t("upload_image")}
            </button>
            {form.tags.image && (
              <div className="flex items-center gap-2 mt-1">
                <img src={form.tags.image} alt="Tag Image" className="h-16 w-auto rounded-md" />
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
          {t("url")}:
          <textarea
            name="url"
            value={form.tags.url}
            placeholder={t("tag_url")}
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
            {t("cancel")}
          </button>
          <button
            type="submit"
            className={`rounded-md p-2 text-white text-sm ${isUpdating ? "bg-gray-500" : "bg-success"}`}
            disabled={isUpdating}
          >
            {isUpdating ? t("updating") : t("update")}
          </button>
        </div>

        {isSuccess && <p className="col-span-2 text-green-500 text-sm">{t("success_update")}</p>}
        {isError && <p className="col-span-2 text-red-500 text-sm">{t("error_update")}</p>}
      </form>
    </div>
  );
};

export default UpdateTagComponent;
