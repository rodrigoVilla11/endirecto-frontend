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

  const [
    uploadImage,
    {
      isLoading: isLoadingUpload,
      isSuccess: isSuccessUpload,
      isError: isErrorUpload,
    },
  ] = useUploadImageMutation();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: "homeWeb" | "headerWeb"
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      try {
        const response = await uploadImage(file).unwrap();
        setForm((prevForm) => ({
          ...prevForm,
          headers: {
            ...prevForm.headers,
            [fieldName]: response.url,
          },
        }));
      } catch (err) {
        console.error(`Error uploading ${fieldName}:`, err);
      }
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMarketing(form).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error creating the Banner:", err);
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
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-400"
            />
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

          {/* Enable */}
          <label className="flex flex-col">
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

          {/* URL */}
          <label className="flex flex-col col-span-2">
            URL:
            <input
              name="url"
              value={form.headers.url}
              placeholder="Banner URL"
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-400"
            />
          </label>

          {/* Images Table */}
          <div className="col-span-2">
            <h3 className="text-md font-semibold mb-2">Images</h3>
            <table className="min-w-full border border-gray-300 rounded-md">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 w-1/4 text-center">
                    Image
                  </th>
                  <th className="border border-gray-300 p-2 text-center">
                    URL
                  </th>
                  <th className="border border-gray-300 p-2 w-1/4 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 text-center">
                    {form.headers.homeWeb ? (
                      <img
                        src={form.headers.homeWeb}
                        alt="Home Web"
                        className="h-16 w-16 object-cover mx-auto"
                      />
                    ) : (
                      <span className="text-gray-500">No Image</span>
                    )}
                  </td>
                  <td className="border border-gray-300 p-2 break-all text-center">
                    {form.headers.homeWeb ? (
                      <a
                        href={form.headers.homeWeb}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        {form.headers.homeWeb}
                      </a>
                    ) : (
                      <span className="text-gray-500">No URL</span>
                    )}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <div className="flex justify-center items-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "homeWeb")}
                        className="block w-full text-sm text-gray-900 file:mr-2 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 text-center">
                    {form.headers.headerWeb ? (
                      <img
                        src={form.headers.headerWeb}
                        alt="Header Web"
                        className="h-16 w-16 object-cover mx-auto"
                      />
                    ) : (
                      <span className="text-gray-500">No Image</span>
                    )}
                  </td>
                  <td className="border border-gray-300 p-2 break-all text-center">
                    {form.headers.headerWeb ? (
                      <a
                        href={form.headers.headerWeb}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        {form.headers.headerWeb}
                      </a>
                    ) : (
                      <span className="text-gray-500">No URL</span>
                    )}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <div className="flex justify-center items-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "headerWeb")}
                        className="block w-full text-sm text-gray-900 file:mr-2 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
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
          <p className="text-green-500 mt-4">Banner created successfully!</p>
        )}
        {isError && <p className="text-red-500 mt-4">Error creating Banner</p>}
      </div>
    </div>
  );
};

export default CreateBannerComponent;
