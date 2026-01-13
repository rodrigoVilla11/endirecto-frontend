import { useClient } from "@/app/context/ClientContext";
import {
  useGetArticlesQuery,
  useUpdateArticleMutation,
} from "@/redux/services/articlesApi";
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import React, { useEffect, useState } from "react";
import { FaTrashCan } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";

type UpdateArticleComponentProps = {
  articleId: string;
  closeModal: () => void;
  onUpdateSuccess?: () => void;
};

const UpdateArticleComponent = ({
  articleId,
  closeModal,
  onUpdateSuccess,
}: UpdateArticleComponentProps) => {
  const { t } = useTranslation();
  const { selectedClientId } = useClient();
  const encodedId = encodeURIComponent(articleId);
  const {
    data: customer,
    error: customerError,
    isLoading: isCustomerLoading,
    refetch,
  } = useGetCustomerByIdQuery(
    { id: selectedClientId || "" },
    { skip: !selectedClientId }
  );
  const {
    data: articlesData,
    isLoading: isArticleLoading,
    error: articleError,
    refetch: refetchArticles,
  } = useGetArticlesQuery(
    {
      page: 1,
      limit: 1,
      articleId: articleId,
      priceListId: customer?.price_list_id ?? "3",
    },
    {
      skip: !articleId,
    }
  );

  const article = articlesData?.articles?.[0];

  const [updateArticle, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateArticleMutation();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadResponses, setUploadResponses] = useState<string[]>([]);
  const [
    uploadImage,
    {
      isLoading: isLoadingUpload,
      isSuccess: isSuccessUpload,
      isError: isErrorUpload,
      error: errorUpload,
    },
  ] = useUploadImageMutation();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleUpload = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) event.preventDefault();

    if (selectedFiles.length === 0) {
      console.error(t("noFilesSelected"));
      return;
    }

    try {
      const responses = await Promise.all(
        selectedFiles.map(async (file) => {
          const response = await uploadImage(file).unwrap();
          console.log(response);
          return response.secure_url;
        })
      );

      setUploadResponses((prevResponses) => [...prevResponses, ...responses]);
      setSelectedFiles([]);
    } catch (err) {
      console.error(t("errorUploadingImages"), err);
    }
  };

  const [form, setForm] = useState({
    id: "",
    name: "",
    supplier_code: "",
    description: "",
    images: [] as string[],
  });

  useEffect(() => {
    if (!articleId) return;

    if (article) {
      setForm({
        id: article.id ?? "",
        name: article.name ?? "",
        supplier_code: article.supplier_code ?? "",
        description: article.description ?? "",
        images: article.images ?? [],
      });
    }
  }, [articleId, article]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "images") {
      setForm((prevForm) => ({
        ...prevForm,
        [name]: value.split(",").map((item) => item.trim()),
      }));
    } else {
      setForm((prevForm) => ({
        ...prevForm,
        [name]: value,
      }));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedForm = {
        ...form,
        images: [...form.images, ...uploadResponses],
        id: encodedId,
      };

      await updateArticle(updatedForm).unwrap();
      await refetch();

      if (onUpdateSuccess) {
        onUpdateSuccess();
      }

      setTimeout(() => {
        closeModal();
      }, 100);
    } catch (err) {
      console.error(t("errorUpdatingArticle"), err);
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm((prevForm) => ({
      ...prevForm,
      images: prevForm.images.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-scroll scrollbar-hide">
        {/* Título y botón de cierre */}
        <div className="flex justify-between">
          <h2 className="text-lg mb-4">{t("updateArticleTitle")}</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
          >
            <IoMdClose />
          </button>
        </div>

        {/* Formulario */}
        <form className="flex flex-col gap-4" onSubmit={handleUpdate}>
          <label className="flex flex-col">
            {t("idLabel")}:
            <input
              name="id"
              value={form.id}
              placeholder={t("idPlaceholder")}
              readOnly
              className="border border-black rounded-md p-2 bg-gray-200"
            />
          </label>

          <label className="flex flex-col">
            {t("supplierCodeLabel")}:
            <input
              name="supplier_code"
              readOnly
              value={form.supplier_code}
              placeholder={t("supplierCodePlaceholder")}
              onChange={handleChange}
              className="border border-black rounded-md p-2 bg-gray-200"
            />
          </label>

          <label className="flex flex-col">
            {t("descriptionLabel")}:
            <textarea
              name="description"
              readOnly
              value={form.description}
              placeholder={t("descriptionPlaceholder")}
              onChange={handleChange}
              className="border border-black rounded-md p-2 bg-gray-200"
            />
          </label>

          <label className="flex flex-col">
            {t("imagesLabel")}:
            <div className="flex justify-between p-1">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
              <button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 && isLoadingUpload}
                className={`rounded-md p-2 text-white ${
                  isLoadingUpload ? "bg-gray-500" : "bg-success"
                }`}
              >
                {isLoadingUpload ? t("uploading") : t("uploadImagesButton")}
              </button>

              {isSuccessUpload && <div>{t("imagesUploadedSuccess")}</div>}
              {isErrorUpload && <div>{t("errorUploadingImages")}</div>}
            </div>
            <div className="border rounded-md p-2 overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr>
                    <th>{t("image")}</th>
                    <th>{t("link")}</th>
                    <th>
                      <FaTrashCan />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {form.images.map((image, index) => (
                    <tr key={index}>
                      <td>
                        <img
                          src={image}
                          alt={t("brandImageAlt")}
                          className="h-10"
                        />
                      </td>
                      <td>
                        <a
                          href={image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500"
                        >
                          {image}
                        </a>
                      </td>
                      <td>
                        <div className="flex justify-center items-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="text-red-500"
                          >
                            <FaTrashCan />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
              {t("cancel")}
            </button>
            <button
              type="submit"
              className={`rounded-md p-2 text-white ${
                isUpdating ? "bg-gray-500" : "bg-success"
              }`}
              disabled={isUpdating}
            >
              {isUpdating ? t("updating") : t("update")}
            </button>
          </div>

          {isSuccess && (
            <p className="text-green-500">{t("articleUpdatedSuccess")}</p>
          )}
          {isError && (
            <p className="text-red-500">{t("errorUpdatingArticle")}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default UpdateArticleComponent;
