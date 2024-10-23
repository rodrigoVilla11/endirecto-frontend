import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import { useCreateMarketingMutation } from "@/redux/services/marketingApi";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";

const CreateTagComponent = ({ closeModal }: { closeModal: () => void }) => {
  const [form, setForm] = useState({
    tags: {
      name: "",
      enable: false,
      image: "",
      url: "",
    },
  });

  const [createMarketing, { isLoading: isLoadingCreate, isSuccess, isError }] =
    useCreateMarketingMutation();

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [
    uploadImage,
    {
      isLoading: isLoadingUpload,
      isSuccess: isSuccessUpload,
      isError: isErrorUpload,
      error: errorUpload,
    },
  ] = useUploadImageMutation();

  const handleImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files) {
      setSelectedImageFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (selectedImageFile) {
      try {
        const response = await uploadImage(selectedImageFile).unwrap();
        setForm((prevForm) => ({
          ...prevForm,
          tags: {
            ...prevForm.tags,
            image: response.url,
          },
        }));
      } catch (err) {
        console.error("Error uploading Home Web image:", err);
      }
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
      tags: {
        ...prevForm.tags,
        [name]: value, // Actualiza dinámicamente según el input
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMarketing(form).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error al crear el Tag:", err);
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
          <h2 className="text-lg font-semibold">New Tag</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-8 w-8 flex justify-center items-center"
            aria-label="Close"
          >
            <IoMdClose className="text-lg" />
          </button>
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <div className="flex flex-col flex-1">
              <label className="flex flex-col mb-2">
                Name:
                <input
                  name="name"
                  value={form.tags.name}
                  placeholder="Tags Name"
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-400"
                />
              </label>

              <label className="flex flex-col mb-2">
                Enable:
                <button
                  type="button"
                  onClick={handleToggleEnable}
                  className={`border border-gray-300 rounded-md p-2 ${
                    form.tags.enable ? "bg-green-500" : "bg-red-500"
                  } text-white`}
                  aria-pressed={form.tags.enable}
                >
                  {form.tags.enable ? "On" : "Off"}
                </button>
              </label>
            </div>

            <div>
              <label className="flex flex-col mb-2">
                Image:
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none"
                />
              </label>

              <label className="flex flex-col mb-2">
                URL:
                <input
                  name="url"
                  value={form.tags.url}
                  placeholder="Tag URL"
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-400"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-400 rounded-md p-2 text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isLoadingUpload}
              className="bg-blue-500 text-white rounded-md p-2"
              aria-busy={isLoadingUpload}
            >
              {isLoadingUpload ? "Subiendo..." : "Subir Imágenes"}
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
              aria-disabled={
                isLoadingCreate ||
                !form.tags.name ||
                !form.tags.url ||
                !form.tags.image
              }
            >
              {isLoadingCreate ? "Saving..." : "Save"}
            </button>
          </div>

          {isSuccess && (
            <p className="text-green-500 mt-2">Tag created successfully!</p>
          )}
          {isError && <p className="text-red-500 mt-2">Error creating Tag</p>}
          {isSuccessUpload && (
            <div className="text-green-500 mt-1">¡Imágenes subidas con éxito!</div>
          )}
          {isErrorUpload && (
            <div className="text-red-500 mt-1">
              Error al subir imágenes: {"Desconocido"}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateTagComponent;
