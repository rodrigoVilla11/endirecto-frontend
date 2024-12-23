import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import { useCreateMarketingMutation } from "@/redux/services/marketingApi";
import React, { useState } from "react";
import { FaTrashCan } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";

const CreateHeaderComponent = ({ closeModal }: { closeModal: () => void }) => {
    const [form, setForm] = useState({
        header: {
          enable: false,
          img: "",
          url: "",
        },
      });
    
      const [createMarketing, { isLoading: isLoadingCreate, isSuccess, isError }] =
        useCreateMarketingMutation();
    
      const [
        uploadImage,
        {
          isLoading: isLoadingUpload,
          isSuccess: isSuccessUpload,
          isError: isErrorUpload,
        },
      ] = useUploadImageMutation();
    
      const [selectedHomeFile, setSelectedHomeFile] = useState<File | null>(null);
      const [homeUploadResponse, setHomeUploadResponse] = useState<string>("");
    
      const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
          setSelectedHomeFile(event.target.files[0]);
        }
      };
    
      const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => {
        const { name, value } = e.target;
    
        setForm((prevForm) => ({
          ...prevForm,
          header: {
            ...prevForm.header,
            [name]: name === "sequence" ? Number(value) : value,
          },
        }));
      };
    
      const handleUploadHome = async () => {
        if (selectedHomeFile) {
          try {
            const response = await uploadImage(selectedHomeFile).unwrap();
            setHomeUploadResponse(response.url);
            setForm((prevForm) => ({
              ...prevForm,
              header: {
                ...prevForm.header,
                img: response.url,
              },
            }));
          } catch (err) {
            console.error("Error uploading home image:", err);
          }
        }
      };
    
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
          await createMarketing(form).unwrap();
          closeModal();
        } catch (err) {
          console.error("Error creating the Banner:", err);
        }
      };
    
      const handleRemoveImage = () => {
        setHomeUploadResponse("");
        setForm((prevForm) => ({
          ...prevForm,
          header: {
            ...prevForm.header,
            img: "",
          },
        }));
      };
    
      const handleToggleEnable = () => {
        setForm((prevForm) => ({
          ...prevForm,
          header: {
            ...prevForm.header,
            enable: !prevForm.header.enable,
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

          <label className="flex flex-col col-span-2">
            URL:
            <input
              name="url"
              value={form.header.url}
              placeholder="Banner URL"
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-400"
            />
          </label>

          <label className="flex flex-col">
            Enable:
            <button
              type="button"
              onClick={handleToggleEnable}
              className={`border border-gray-300 rounded-md p-2 ${
                form.header.enable ? "bg-green-500" : "bg-red-500"
              } text-white w-24`}
            >
              {form.header.enable ? "On" : "Off"}
            </button>
          </label>

          {/* Images Table */}
          <div className="w-full flex justify-evenly gap-2">
            <label className="flex flex-col text-sm">
             Image:
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <button
                type="button"
                onClick={handleUploadHome}
                disabled={isLoadingUpload}
                className="mt-1 bg-blue-500 text-white rounded-md p-1 text-sm"
              >
                {isLoadingUpload ? "Uploading..." : "Upload Image"}
              </button>
              {homeUploadResponse && (
                <div className="flex items-center gap-2 mt-1">
                  <img
                    src={homeUploadResponse}
                    alt="Home Banner"
                    className="h-20 w-full rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage()}
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
        {isSuccess && (
          <p className="text-green-500 mt-4">Header created successfully!</p>
        )}
        {isError && <p className="text-red-500 mt-4">Error creating Header</p>}
      </div>
    </div>
  );
};

export default CreateHeaderComponent;
