import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import { useGetItemByIdQuery, useUpdateItemMutation } from "@/redux/services/itemsApi";
import React, { useEffect, useState } from "react";
import { FaTrashCan } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";

interface Item {
  id: string;
  name: string;
  image: string;
}

interface UpdateItemComponentProps {
  itemId: string;
  closeModal: () => void;
}

const UpdateItemComponent: React.FC<UpdateItemComponentProps> = ({ itemId, closeModal }) => {
  const { t } = useTranslation();
  const { 
    data: item, 
    error: fetchError, 
    isLoading: isFetching,
  } = useGetItemByIdQuery({ id: itemId }, {
    skip: !itemId,
  });

  const [updateItem, { isLoading: isUpdating }] = useUpdateItemMutation();
  const [uploadImage, { isLoading: isLoadingUpload }] = useUploadImageMutation();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>("");
  const [updateError, setUpdateError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [form, setForm] = useState<Item>({
    id: "",
    name: "",
    image: "",
  });

  useEffect(() => {
    if (item) {
      setForm({
        id: item.id || "",
        name: item.name || "",
        image: item.image || "",
      });
    }
  }, [item]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar el tamaño del archivo (por ejemplo, máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(t("updateItem.errorFileSize"));
        return;
      }
      // Validar el tipo de archivo
      if (!file.type.startsWith('image/')) {
        setUploadError(t("updateItem.errorFileType"));
        return;
      }
      setSelectedFile(file);
      setUploadError("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError(t("updateItem.errorNoFile"));
      return;
    }

    try {
      setUploadError("");
      const response = await uploadImage(selectedFile).unwrap();
      setForm(prev => ({
        ...prev,
        image: response.url
      }));
      setSuccessMessage(t("updateItem.uploadSuccess"));
    } catch (err) {
      setUploadError(t("updateItem.uploadError"));
      console.error("Error uploading image:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!form.name.trim()) {
      setUpdateError(t("updateItem.errorNameRequired"));
      return;
    }

    try {
      setUpdateError("");
      await updateItem(form).unwrap();
      setSuccessMessage(t("updateItem.updateSuccess"));
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      setUpdateError(t("updateItem.updateError"));
      console.error("Error updating the item:", err);
    }
  };

  const handleRemoveImage = () => {
    setForm(prev => ({
      ...prev,
      image: "",
    }));
    setSelectedFile(null);
    setSuccessMessage("");
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center p-4">
        <p className="text-gray-600">{t("updateItem.loading")}</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex justify-center items-center p-4">
        <p className="text-red-500">{t("updateItem.errorFetchingItem")}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{t("updateItem.title")}</h2>
        <button
          onClick={closeModal}
          className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-colors"
        >
          <IoMdClose className="w-5 h-5" />
        </button>
      </div>

      <form className="space-y-6" onSubmit={handleUpdate}>
        <div className="space-y-4">
          <label className="block">
            <span className="text-gray-700">{t("updateItem.label.id")}:</span>
            <input
              name="id"
              value={form.id}
              readOnly
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 cursor-not-allowed"
            />
          </label>

          <label className="block">
            <span className="text-gray-700">{t("updateItem.label.name")}:</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 focus:border-blue-300 focus:ring focus:ring-blue-200"
              placeholder={t("updateItem.placeholder.name")}
            />
            {updateError && <p className="text-red-500 text-sm mt-1">{updateError}</p>}
          </label>

          <div className="space-y-2">
            <span className="text-gray-700">{t("updateItem.label.image")}:</span>
            <div className="flex items-center space-x-4">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="flex-1"
              />
              <button
                type="button"
                onClick={handleUpload}
                disabled={isLoadingUpload || !selectedFile}
                className={`px-4 py-2 rounded-md text-white transition-colors ${
                  isLoadingUpload || !selectedFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isLoadingUpload ? t("updateItem.uploading") : t("updateItem.uploadImage")}
              </button>
            </div>
            {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
          </div>

          {form.image && (
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("updateItem.table.image")}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("updateItem.table.link")}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t("updateItem.table.actions")}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img src={form.image} alt={t("updateItem.alt.item")} className="h-12 w-12 object-cover rounded" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={form.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 truncate block max-w-xs"
                      >
                        {form.image}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-red-500 hover:text-red-600"
                      >
                        <FaTrashCan className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {t("updateItem.cancel")}
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className={`px-4 py-2 rounded-md text-white ${
              isUpdating ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isUpdating ? t("updateItem.updating") : t("updateItem.update")}
          </button>
        </div>
      </form>

      {successMessage && (
        <div className="mt-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default UpdateItemComponent;
