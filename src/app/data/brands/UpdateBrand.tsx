import {
  useGetBrandByIdQuery,
  useUpdateBrandMutation,
} from "@/redux/services/brandsApi";
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import React, { useEffect, useState } from "react";
import { FaTrashCan } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";

type UpdateBrandComponentProps = {
  brandId: string;
  closeModal: () => void;
};

const UpdateBrandComponent = ({
  brandId,
  closeModal,
}: UpdateBrandComponentProps) => {
  const { t } = useTranslation();

  const {
    data: brand,
    error,
    isLoading,
    refetch,
  } = useGetBrandByIdQuery({ id: brandId });
  const [updateBrand, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateBrandMutation();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadResponses, setUploadResponses] = useState<string[]>([]);
  const [
    uploadImage,
    {
      isLoading: isLoadingUpload,
      isSuccess: isSuccessUpload,
      isError: isErrorUpload,
    },
  ] = useUploadImageMutation();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length > 0) {
      try {
        const responses = await Promise.all(
          selectedFiles.map(async (file) => {
            const response = await uploadImage(file).unwrap();
            return response.url;
          })
        );
        setUploadResponses((prevResponses) => [...prevResponses, ...responses]);
      } catch (err) {
        console.error("Error uploading images:", err);
      }
    } else {
      console.error("No files selected");
    }
  };

  const [form, setForm] = useState({
    id: "",
    images: "" as string,
    sequence: "",
    name: "",
  });

  useEffect(() => {
    refetch();
    if (brand) {
      setForm({
        id: brand.id ?? "",
        name: brand.name ?? "",
        images: brand.images ?? "",
        sequence: brand.sequence ?? "",
      });
    }
  }, [refetch, brand]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: checked,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedForm = {
        ...form,
        images: uploadResponses.length > 0 ? uploadResponses[0] : form.images,
      };
      await updateBrand(updatedForm).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating the brand:", err);
    }
  };

  const handleRemoveImage = () => {
    setForm((prevForm) => ({
      ...prevForm,
      images: "",
    }));
  };

  if (isLoading) return <p>{t("updateBrand.loading")}</p>;
  if (error) return <p>{t("updateBrand.errorFetchingBrand")}</p>;

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">{t("updateBrand.title")}</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleUpdate}>
        <label className="flex flex-col">
          {t("updateBrand.label.id")}:
          <input
            name="id"
            value={form.id}
            placeholder={t("updateBrand.label.id")}
            readOnly
            className="border border-black rounded-md p-2 bg-gray-200"
          />
        </label>

        <label className="flex flex-col">
          {t("updateBrand.label.name")}:
          <input
            name="name"
            value={form.name}
            placeholder={t("updateBrand.label.name")}
            onChange={handleChange}
            readOnly
            className="border border-black rounded-md p-2 bg-gray-200"
          />
        </label>

        <label className="flex flex-col">
          {t("updateBrand.label.sequence")}:
          <textarea
            name="sequence"
            value={form.sequence}
            placeholder={t("updateBrand.label.sequence")}
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          {t("updateBrand.label.images")}:
          <div className="mb-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
            <button
              onClick={handleUpload}
              disabled={isLoadingUpload}
              className={`rounded-md p-2 text-white ${
                isLoadingUpload ? "bg-gray-500" : "bg-success"
              }`}
              type="button"
            >
              {isLoadingUpload
                ? t("updateBrand.uploading")
                : t("updateBrand.uploadImages")}
            </button>
            {isSuccessUpload && (
              <div>{t("updateBrand.uploadSuccess")}</div>
            )}
            {isErrorUpload && <div>{t("updateBrand.uploadError")}</div>}
          </div>
          <div className="border rounded-md p-2">
            <table className="min-w-full table-auto">
              <thead>
                <tr>
                  <th>{t("updateBrand.table.image")}</th>
                  <th>{t("updateBrand.table.link")}</th>
                  <th>
                    <FaTrashCan />
                  </th>
                </tr>
              </thead>
              <tbody>
                {form.images && (
                  <tr>
                    <td>
                      <img
                        src={form.images}
                        alt="brand_image"
                        className="h-10"
                      />
                    </td>
                    <td>
                      <a
                        href={form.images}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500"
                      >
                        {form.images}
                      </a>
                    </td>
                    <td>
                      <div className="flex justify-center items-center">
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="text-red-500"
                        >
                          <FaTrashCan />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </label>

        <div className="flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-400 rounded-md p-2 text-white"
          >
            {t("updateBrand.cancel")}
          </button>
          <button
            type="submit"
            className={`rounded-md p-2 text-white ${
              isUpdating ? "bg-gray-500" : "bg-success"
            }`}
            disabled={isUpdating}
          >
            {isUpdating ? t("updateBrand.updating") : t("updateBrand.update")}
          </button>
        </div>

        {isSuccess && (
          <p className="text-green-500">{t("updateBrand.updatedSuccess")}</p>
        )}
        {isError && (
          <p className="text-red-500">{t("updateBrand.updatedError")}</p>
        )}
      </form>
    </div>
  );
};

export default UpdateBrandComponent;
