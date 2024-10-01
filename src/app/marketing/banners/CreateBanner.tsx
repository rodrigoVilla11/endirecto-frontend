import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import { useCreateMarketingMutation } from "@/redux/services/marketingApi";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";

const CreateBannerComponent = ({ closeModal }: { closeModal: () => void }) => {
  const [form, setForm] = useState({
    headers: {
      name: "",
      sequence: 0,
      enable: false,
      homeWeb: "",
      headerWeb: "",
      url: "",
    },
  });

  const [createMarketing, { isLoading: isLoadingCreate, isSuccess, isError }] =
    useCreateMarketingMutation();

  const [selectedHomeWebFile, setSelectedHomeWebFile] = useState<File | null>(null);
  const [selectedHeaderWebFile, setSelectedHeaderWebFile] = useState<File | null>(null);
  const [
    uploadImage,
    {
      isLoading: isLoadingUpload,
      isSuccess: isSuccessUpload,
      isError: isErrorUpload,
      error: errorUpload,
    },
  ] = useUploadImageMutation();

  const handleHomeWebFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedHomeWebFile(event.target.files[0]);
    }
  };

  const handleHeaderWebFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedHeaderWebFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (selectedHomeWebFile) {
      try {
        const response = await uploadImage(selectedHomeWebFile).unwrap();
        setForm((prevForm) => ({
          ...prevForm,
          headers: {
            ...prevForm.headers,
            homeWeb: response.url,
          },
        }));
      } catch (err) {
        console.error("Error uploading Home Web image:", err);
      }
    }

    if (selectedHeaderWebFile) {
      try {
        const response = await uploadImage(selectedHeaderWebFile).unwrap();
        setForm((prevForm) => ({
          ...prevForm,
          headers: {
            ...prevForm.headers,
            headerWeb: response.url,
          },
        }));
      } catch (err) {
        console.error("Error uploading Header Web image:", err);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      headers: {
        ...prevForm.headers,
        [name]: name === "sequence" ? Number(value) : value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMarketing(form).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error al crear el Banner:", err);
    }
  };

  const handleToggleEnable = () => {
    setForm((prevForm) => ({
      ...prevForm,
      headers: {
        ...prevForm.headers,
        enable: !prevForm.headers.enable,
      },
    }));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-auto">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">New Banner</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-8 w-8 flex justify-center items-center"
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
                  value={form.headers.name}
                  placeholder="Banner Name"
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-400"
                />
              </label>

              <label className="flex flex-col mb-2">
                Sequence:
                <input
                  type="number"
                  name="sequence"
                  value={form.headers.sequence}
                  placeholder="Banner Sequence"
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
                    form.headers.enable ? "bg-green-500" : "bg-red-500"
                  } text-white`}
                >
                  {form.headers.enable ? "On" : "Off"}
                </button>
              </label>
            </div>

            <div className="flex flex-col flex-1">
              <label className="flex flex-col mb-2">
                Home Web:
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHomeWebFileChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none"
                />
              </label>

              <label className="flex flex-col mb-2">
                Header Web:
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeaderWebFileChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none"
                />
              </label>

              <label className="flex flex-col mb-2">
                URL:
                <input
                  name="url"
                  value={form.headers.url}
                  placeholder="Banner URL"
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
            >
              {isLoadingUpload ? "Subiendo..." : "Subir Imágenes"}
            </button>
            <button
              type="submit"
              className={`rounded-md p-2 text-white ${
                isLoadingCreate ? "bg-gray-500" : "bg-blue-600"
              }`}
              disabled={isLoadingCreate}
            >
              {isLoadingCreate ? "Saving..." : "Save"}
            </button>
          </div>

          {isSuccess && (
            <p className="text-green-500 mt-2">Banner created successfully!</p>
          )}
          {isError && <p className="text-red-500 mt-2">Error creating Banner</p>}
          {isSuccessUpload && <div className="text-green-500 mt-1">¡Imágenes subidas con éxito!</div>}
          {isErrorUpload && <div className="text-red-500 mt-1">Error al subir imágenes</div>}
        </form>
      </div>
    </div>
  );
};

export default CreateBannerComponent;
