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
        setUploadResponses((prevResponses) => [
          ...prevResponses,
          ...responses,
        ]);
      } catch (err) {
        console.error("Error uploading images:", err);
      }
    } else {
      console.error("No files selected");
    }
  };

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
    <div className="bg-white rounded-2xl p-6 shadow-xl max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {t("updateBrand.title")}
        </h2>
        <button
          onClick={closeModal}
          className="bg-gray-200 hover:bg-gray-300 rounded-full h-8 w-8 flex justify-center items-center transition"
        >
          <IoMdClose className="text-gray-700" />
        </button>
      </div>

      <form className="flex flex-col gap-6" onSubmit={handleUpdate}>
        {/* Sección principal: datos de la marca */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-xl p-4 bg-gray-50">
          <div className="space-y-3">
            <label className="flex flex-col text-sm">
              <span className="font-medium text-gray-700 mb-1">
                {t("updateBrand.label.id")}:
              </span>
              <input
                name="id"
                value={form.id}
                placeholder={t("updateBrand.label.id")}
                readOnly
                className="border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700 text-sm"
              />
            </label>

            <label className="flex flex-col text-sm">
              <span className="font-medium text-gray-700 mb-1">
                {t("updateBrand.label.name")}:
              </span>
              <input
                name="name"
                value={form.name}
                placeholder={t("updateBrand.label.name")}
                onChange={handleChange}
                readOnly
                className="border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700 text-sm"
              />
            </label>
          </div>

          <div className="space-y-3">
            <label className="flex flex-col text-sm h-full">
              <span className="font-medium text-gray-700 mb-1">
                {t("updateBrand.label.sequence")}:
              </span>
              <textarea
                name="sequence"
                value={form.sequence}
                placeholder={t("updateBrand.label.sequence")}
                onChange={handleChange}
                className="border border-gray-300 rounded-md px-3 py-2 h-full min-h-[80px] text-sm resize-y"
              />
            </label>
          </div>
        </div>

        {/* Sección imágenes */}
        <div className="border rounded-xl p-4 bg-gray-50 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                {t("updateBrand.label.images")}
              </h3>
              <p className="text-xs text-gray-500">
                {t("updateBrand.imagesHelper") ||
                  "Subí una imagen para la marca. Solo se usará la primera subida."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="text-xs"
              />
              <button
                onClick={handleUpload}
                disabled={isLoadingUpload}
                className={`rounded-md px-3 py-2 text-xs font-semibold text-white ${
                  isLoadingUpload
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
                type="button"
              >
                {isLoadingUpload
                  ? t("updateBrand.uploading")
                  : t("updateBrand.uploadImages")}
              </button>
            </div>
          </div>

          {isSuccessUpload && (
            <div className="text-xs text-emerald-600">
              {t("updateBrand.uploadSuccess")}
            </div>
          )}
          {isErrorUpload && (
            <div className="text-xs text-red-500">
              {t("updateBrand.uploadError")}
            </div>
          )}

          <div className="border rounded-lg overflow-hidden bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-xs text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">
                    {t("updateBrand.table.image")}
                  </th>
                  <th className="px-3 py-2 text-left">
                    {t("updateBrand.table.link")}
                  </th>
                  <th className="px-3 py-2 text-center w-10">
                    <FaTrashCan />
                  </th>
                </tr>
              </thead>
              <tbody>
                {form.images ? (
                  <tr className="border-t">
                    <td className="px-3 py-2 align-middle">
                      <img
                        src={form.images}
                        alt="brand_image"
                        className="h-10 rounded border border-gray-200 object-contain"
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <a
                        href={form.images}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all text-xs"
                      >
                        {form.images}
                      </a>
                    </td>
                    <td className="px-3 py-2 text-center align-middle">
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-red-500 hover:text-red-600"
                      >
                        <FaTrashCan />
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-3 text-center text-xs text-gray-400"
                    >
                      {t("updateBrand.noImage") || "Sin imagen asignada"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-400 hover:bg-gray-500 rounded-md px-4 py-2 text-sm text-white font-medium"
          >
            {t("updateBrand.cancel")}
          </button>
          <button
            type="submit"
            className={`rounded-md px-4 py-2 text-sm text-white font-medium ${
              isUpdating ? "bg-gray-500 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
            disabled={isUpdating}
          >
            {isUpdating
              ? t("updateBrand.updating")
              : t("updateBrand.update")}
          </button>
        </div>

        {isSuccess && (
          <p className="text-sm text-emerald-600 mt-1">
            {t("updateBrand.updatedSuccess")}
          </p>
        )}
        {isError && (
          <p className="text-sm text-red-500 mt-1">
            {t("updateBrand.updatedError")}
          </p>
        )}
      </form>
    </div>
  );
};

export default UpdateBrandComponent;
