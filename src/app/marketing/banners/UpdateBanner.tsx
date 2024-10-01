import { useUploadImageMutation } from "@/redux/services/cloduinaryApi"; 
import {
  useGetMarketingByIdQuery,
  useUpdateMarketingMutation,
} from "@/redux/services/marketingApi";
import React, { useEffect, useState } from "react";

type UpdateBannerComponentProps = {
  marketingId: string;
  closeModal: () => void;
};

type FormState = {
  _id: string;
  headers: {
    name: string;
    sequence: number;
    enable: boolean;
    homeWeb: string; // Para la URL de la imagen de la Home App
    headerWeb: string; // Para la URL de la imagen de encabezado web
    url: string;
  };
};

const UpdateBannerComponent = ({
  marketingId,
  closeModal,
}: UpdateBannerComponentProps) => {
  const {
    data: header,
    error,
    isLoading,
  } = useGetMarketingByIdQuery({ id: marketingId });

  const [selectedHomeFile, setSelectedHomeFile] = useState<File | null>(null);
  const [selectedHeaderFile, setSelectedHeaderFile] = useState<File | null>(null);
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

  const handleHeaderFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    headers: {
      name: "",
      sequence: 0,
      enable: false,
      homeWeb: "", // URL de la imagen de la Home App
      headerWeb: "", // URL de la imagen de encabezado web
      url: "",
    },
  });

  useEffect(() => {
    if (header) {
      setForm({
        _id: header._id,
        headers: {
          name: header.headers.name,
          sequence: header.headers.sequence,
          enable: header.headers.enable,
          homeWeb: header.headers.homeWeb, // Carga la URL si existe
          headerWeb: header.headers.headerWeb, // Carga la URL si existe
          url: header.headers.url,
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
      headers: {
        ...prevForm.headers,
        [name]: name === "sequence" ? Number(value) : value,
      },
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedForm = {
        ...form,
        headers: {
          ...form.headers,
          homeWeb: homeUploadResponse || form.headers.homeWeb, // Usar la URL subida o mantener la anterior
          headerWeb: headerUploadResponse || form.headers.headerWeb, // Usar la URL subida o mantener la anterior
        },
      };
      await updateMarketing(updatedForm).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error al actualizar el Banner:", err);
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

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
        <h2 className="text-lg font-semibold mb-4">Editar Banner</h2>
        <form className="flex flex-col gap-4" onSubmit={handleUpdate}>
          <div className="flex gap-4">
            <div className="flex flex-col flex-1">
              <label className="flex flex-col mb-2">
                Nombre:
                <input
                  name="name"
                  value={form.headers.name}
                  placeholder="Nombre del Banner"
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-400"
                />
              </label>

              <label className="flex flex-col mb-2">
                Secuencia:
                <input
                  type="number"
                  name="sequence"
                  value={form.headers.sequence}
                  placeholder="Secuencia del Banner"
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
                    form.headers.enable ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {form.headers.enable ? "On" : "Off"}
                </button>
              </div>
            </div>

            <div className="flex flex-col flex-1">
              <label className="flex flex-col mb-2">
                Imagen Home App:
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
                  className="mt-2 bg-blue-500 text-white rounded-md p-2">
                  {isLoadingUpload ? "Subiendo..." : "Subir Imagen"}
                </button>
                {isSuccessUpload && <div className="text-green-500 mt-1">¡Imagen de Home App subida con éxito!</div>}
                {isErrorUpload && <div className="text-red-500 mt-1">Error al subir imagen de Home App</div>}
              </label>

              <label className="flex flex-col mb-2">
                Imagen Encabezado Web:
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeaderFileChange}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none"
                />
                <button 
                  type="button" 
                  onClick={handleUploadHeader} 
                  disabled={isLoadingUpload} 
                  className="mt-2 bg-blue-500 text-white rounded-md p-2">
                  {isLoadingUpload ? "Subiendo..." : "Subir Imagen"}
                </button>
                {isSuccessUpload && <div className="text-green-500 mt-1">¡Imagen de Encabezado Web subida con éxito!</div>}
                {isErrorUpload && <div className="text-red-500 mt-1">Error al subir imagen de Encabezado Web</div>}
              </label>
            </div>
          </div>
          <div className="flex flex-col mb-2">
            <label className="mb-2">URL:</label>
            <textarea
              name="url"
              value={form.headers.url}
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

export default UpdateBannerComponent;
