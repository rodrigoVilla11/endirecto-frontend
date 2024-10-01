import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import { useCreateMarketingMutation } from "@/redux/services/marketingApi";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";

const CreatePopupComponent = ({ closeModal }: { closeModal: () => void }) => {
  const [form, setForm] = useState({
    popups: {
      name: "",
      sequence: 0,
      location: "",
      enable: false,
      web: "",
      url: "",
      visualization: 0,
    },
  });

  
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

  const [createMarketing, { isLoading: isLoadingCreate, isSuccess, isError }] =
    useCreateMarketingMutation();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      popups: {
        ...prevForm.popups,
        [name]:
          name === "sequence" || name === "visualization"
            ? Number(value)
            : value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedForm = {
        ...form,
        popups: {
          ...form.popups,
          web:
            uploadResponses.length > 0 ? uploadResponses[0] : form.popups.web,
        },
      };
      await createMarketing(updatedForm).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error al crear la PopUp:", err);
    }
  };

  const handleToggleEnable = () => {
    setForm((prevForm) => ({
      ...prevForm,
      popups: {
        ...prevForm.popups,
        enable: !prevForm.popups.enable,
      },
    }));
  };

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">New Popups</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex gap-4">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col">
              Name:
              <input
                name="name"
                value={form.popups.name}
                placeholder="Popup Name"
                onChange={handleChange}
                className="border border-black rounded-md p-2"
              />
            </label>

            <label className="flex flex-col">
              Sequence:
              <input
                type="number"
                name="sequence"
                value={form.popups.sequence}
                placeholder="Popup Sequence"
                onChange={handleChange}
                className="border border-black rounded-md p-2"
              />
            </label>

            <label className="flex flex-col">
              Location:
              <input
                name="location"
                value={form.popups.location}
                placeholder="Popup Location"
                onChange={handleChange}
                className="border border-black rounded-md p-2"
              />
            </label>

            <div className="flex flex-col">
              <label>Enable:</label>
              <button
                type="button"
                onClick={handleToggleEnable}
                className={`border border-black rounded-md p-2 ${
                  form.popups.enable ? "bg-green-500" : "bg-red-500"
                } text-white`}
              >
                {form.popups.enable ? "On" : "Off"}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col">
              Web:
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
                <button onClick={handleUpload} disabled={isLoadingUpload}>
                  {isLoadingUpload ? "Uploading..." : "Upload Images"}
                </button>

                {isSuccessUpload && <div>Images uploaded successfully!</div>}
                {isErrorUpload && <div>Error uploading images</div>}
              </div>
            </label>

            <label className="flex flex-col">
              URL:
              <input
                name="url"
                value={form.popups.url}
                placeholder="Popup URL"
                onChange={handleChange}
                className="border border-black rounded-md p-2"
              />
            </label>

            <label className="flex flex-col">
              Visualizations:
              <input
                type="number"
                name="visualization"
                value={form.popups.visualization}
                placeholder="Popup Visualization"
                onChange={handleChange}
                className="border border-black rounded-md p-2"
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
            type="submit"
            className={`rounded-md p-2 text-white ${
              isLoadingCreate ? "bg-gray-500" : "bg-success"
            }`}
            disabled={isLoadingCreate}
          >
            {isLoadingCreate ? "Saving..." : "Save"}
          </button>
        </div>

        {isSuccess && (
          <p className="text-green-500">Popup created successfully!</p>
        )}
        {isError && <p className="text-red-500">Error creating Popup</p>}
      </form>
    </div>
  );
};

export default CreatePopupComponent;
