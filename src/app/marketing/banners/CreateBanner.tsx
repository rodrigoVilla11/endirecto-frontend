import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import { useCreateMarketingMutation } from "@/redux/services/marketingApi";
import React, { useState } from "react";
import { FaTrashCan } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";

interface CreateBannerComponentProps {
  closeModal: () => void;
}

interface FormError {
  field: string;
  message: string;
}

const CreateBannerComponent: React.FC<CreateBannerComponentProps> = ({ closeModal }) => {
  const [form, setForm] = useState({
    headers: {
      name: "",
      sequence: 0,
      enable: false,
      homeWeb: "",
      url: "",
    },
  });

  const [errors, setErrors] = useState<FormError[]>([]);
  const [uploadError, setUploadError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [createMarketing, { isLoading: isLoadingCreate }] = useCreateMarketingMutation();
  const [uploadImage, { isLoading: isLoadingUpload }] = useUploadImageMutation();

  const [selectedHomeFile, setSelectedHomeFile] = useState<File | null>(null);
  const [homeUploadResponse, setHomeUploadResponse] = useState<string>("");

  const validateForm = (): boolean => {
    const newErrors: FormError[] = [];

    if (!form.headers.name.trim()) {
      newErrors.push({ field: 'name', message: 'Name is required' });
    }
    if (!form.headers.homeWeb) {
      newErrors.push({ field: 'homeWeb', message: 'Banner image is required' });
    }
    if (!form.headers.url.trim()) {
      newErrors.push({ field: 'url', message: 'URL is required' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedHomeFile(event.target.files[0]);
      setUploadError(""); // Limpiar error previo
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setErrors(errors.filter(error => error.field !== name));

    setForm((prevForm) => ({
      ...prevForm,
      headers: {
        ...prevForm.headers,
        [name]: name === "sequence" ? Number(value) : value,
      },
    }));
  };

  const handleUploadHome = async () => {
    if (selectedHomeFile) {
      try {
        setUploadError("");
        const response = await uploadImage(selectedHomeFile).unwrap();
        setHomeUploadResponse(response.url);
        setForm((prevForm) => ({
          ...prevForm,
          headers: {
            ...prevForm.headers,
            homeWeb: response.url,
          },
        }));
        setSuccessMessage("Image uploaded successfully!");
      } catch (err) {
        setUploadError("Error uploading image. Please try again.");
        console.error("Error uploading home image:", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Asegurarse de que la imagen esté incluida en el formulario
      if (!form.headers.homeWeb) {
        setErrors([...errors, { field: 'homeWeb', message: 'Please upload an image first' }]);
        return;
      }

      await createMarketing(form).unwrap();
      setSuccessMessage("Banner created successfully!");
      setTimeout(() => {
        closeModal();
      }, 2000); // Dar tiempo para ver el mensaje de éxito
    } catch (err) {
      setErrors([...errors, { field: 'submit', message: 'Error creating banner. Please try again.' }]);
      console.error("Error creating the Banner:", err);
    }
  };

  const handleRemoveImage = (imageType: "homeWeb") => {
    setHomeUploadResponse("");
    setForm((prevForm) => ({
      ...prevForm,
      headers: {
        ...prevForm.headers,
        [imageType]: "",
      },
    }));
    setSelectedHomeFile(null);
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
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">New Banner</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-8 w-8 flex justify-center items-center"
          >
            <IoMdClose className="text-lg" />
          </button>
        </div>

        <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
          {/* Name */}
          <label className="flex flex-col">
            Name:
            <input
              name="name"
              value={form.headers.name}
              placeholder="Banner Name"
              onChange={handleChange}
              className={`border ${
                errors.some(e => e.field === 'name') ? 'border-red-500' : 'border-gray-300'
              } rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-400`}
            />
            {errors.some(e => e.field === 'name') && (
              <span className="text-red-500 text-sm mt-1">
                {errors.find(e => e.field === 'name')?.message}
              </span>
            )}
          </label>

          {/* Sequence */}
          <label className="flex flex-col">
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

          {/* URL */}
          <label className="flex flex-col col-span-2">
            URL:
            <input
              name="url"
              value={form.headers.url}
              placeholder="Banner URL"
              onChange={handleChange}
              className={`border ${
                errors.some(e => e.field === 'url') ? 'border-red-500' : 'border-gray-300'
              } rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-400`}
            />
            {errors.some(e => e.field === 'url') && (
              <span className="text-red-500 text-sm mt-1">
                {errors.find(e => e.field === 'url')?.message}
              </span>
            )}
          </label>

          <label className="flex flex-col">
            Enable:
            <button
              type="button"
              onClick={handleToggleEnable}
              className={`border border-gray-300 rounded-md p-2 ${
                form.headers.enable ? "bg-green-500" : "bg-red-500"
              } text-white w-24`}
            >
              {form.headers.enable ? "On" : "Off"}
            </button>
          </label>

          {/* Images Table */}
          <div className="w-full flex justify-evenly gap-2">
            <label className="flex flex-col text-sm">
              Home Image:
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className={`${errors.some(e => e.field === 'homeWeb') ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={handleUploadHome}
                disabled={isLoadingUpload || !selectedHomeFile}
                className={`mt-1 ${
                  isLoadingUpload || !selectedHomeFile ? 'bg-gray-400' : 'bg-blue-500'
                } text-white rounded-md p-1 text-sm`}
              >
                {isLoadingUpload ? "Uploading..." : "Upload Image"}
              </button>
              {uploadError && (
                <span className="text-red-500 text-sm mt-1">{uploadError}</span>
              )}
              {homeUploadResponse && (
                <div className="flex items-center gap-2 mt-1">
                  <img
                    src={homeUploadResponse}
                    alt="Home Banner"
                    className="h-20 w-full rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage("homeWeb")}
                    className="text-red-500 text-sm"
                  >
                    <FaTrashCan />
                  </button>
                </div>
              )}
            </label>
          </div>

          {/* Buttons */}
          <div className="col-span-2 flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-400 rounded-md p-2 text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`rounded-md p-2 text-white ${
                isLoadingCreate ? "bg-gray-500" : "bg-green-500"
              }`}
              disabled={isLoadingCreate}
            >
              {isLoadingCreate ? "Saving..." : "Save"}
            </button>
          </div>
        </form>

        {/* Messages */}
        {successMessage && (
          <p className="text-green-500 mt-4">{successMessage}</p>
        )}
        {errors.some(e => e.field === 'submit') && (
          <p className="text-red-500 mt-4">
            {errors.find(e => e.field === 'submit')?.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default CreateBannerComponent;