import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import {
  useGetMarketingByIdQuery,
  useUpdateMarketingMutation,
} from "@/redux/services/marketingApi";
import React, { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";

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

const UpdateTagComponent = ({
  marketingId,
  closeModal,
}: UpdateTagComponentProps) => {
  const {
    data: header,
    error,
    isLoading,
  } = useGetMarketingByIdQuery({ id: marketingId });

  const [selectedHomeFile, setSelectedHomeFile] = useState<File | null>(null);
  const [selectedHeaderFile, setSelectedHeaderFile] = useState<File | null>(
    null
  );
  const [homeUploadResponse, setHomeUploadResponse] = useState<string>("");
  const [headerUploadResponse, setHeaderUploadResponse] = useState<string>("");

  const [
    uploadImage,
    {
      isLoading: isLoadingUpload,
      isSuccess: isSuccessUpload,
      isError: isErrorUpload,
      error: errorUpload,
    },
  ] = useUploadImageMutation();

  const handleHomeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedHomeFile(event.target.files[0]);
    }
  };

  const handleHeaderFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedHeaderFile(event.target.files[0]);
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
    } else {
      console.error("No home file selected");
    }
  };

  const handleUploadHeader = async () => {
    if (selectedHeaderFile) {
      try {
        const response = await uploadImage(selectedHeaderFile).unwrap();
        setHeaderUploadResponse(response.url);
      } catch (err) {
        console.error("Error uploading header image:", err);
      }
    } else {
      console.error("No header file selected");
    }
  };

  const [updateMarketing, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateMarketingMutation();

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
    if (header) {
      setForm({
        _id: header._id,
        tags: {
          name: header.tags.name,
          enable: header.tags.enable,
          image: header.tags.image,
          url: header.tags.url,
        },
      });
    }
  }, [header]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      tags: {
        ...prevForm.tags,
        [name]: name === "sequence" ? Number(value) : value,
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
          image: homeUploadResponse || form.tags.image, // Usar la URL subida o mantener la anterior
        },
      };
      console.log(updatedForm)

      await updateMarketing(updatedForm).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error al actualizar el Tags:", err);
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

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
          <h2 className="text-lg font-semibold mb-4">Edit Tag</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-8 w-8 flex justify-center items-center"
          >
            <IoMdClose className="text-lg" />
          </button>
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleUpdate}>
          <div className="flex gap-4">
            <div className="flex flex-col flex-1">
              <label className="flex flex-col mb-2">
                Nombre:
                <input
                  name="name"
                  value={form.tags.name}
                  placeholder="Nombre del Banner"
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-400"
                />
              </label>

        
              <div className="flex flex-col mb-2">
                <label>Habilitado:</label>
                <button
                  type="button"
                  onClick={handleToggleEnable}
                  className={`border border-gray-300 rounded-md p-2 text-white ${
                    form.tags.enable ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {form.tags.enable ? "On" : "Off"}
                </button>
              </div>
            </div>

            <div className="flex flex-col flex-1">
              <label className="flex flex-col mb-2">
                Imagen :
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHomeFileChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleUploadHome}
                  disabled={isLoadingUpload}
                  className="mt-2 bg-blue-500 text-white rounded-md p-2"
                >
                  {isLoadingUpload ? "Subiendo..." : "Subir Imagen"}
                </button>
                {isSuccessUpload && (
                  <div className="text-green-500 mt-1">
                    ¡Imagen subida con éxito!
                  </div>
                )}
                {isErrorUpload && (
                  <div className="text-red-500 mt-1">
                    Error al subir imagen 
                  </div>
                )}
              </label>
            </div>
          </div>
          <div className="flex flex-col mb-2">
            <label className="mb-2">URL:</label>
            <textarea
              name="url"
              value={form.tags.url}
              placeholder="URL del Banner"
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            className={`mt-4 bg-blue-500 text-white rounded-md p-2 ${
              isUpdating ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isUpdating}
          >
            {isUpdating ? "Actualizando..." : "Actualizar Banner"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateTagComponent;
