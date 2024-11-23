import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import {
  useGetMarketingByIdQuery,
  useUpdateMarketingMutation,
} from "@/redux/services/marketingApi";
import React, { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { FaTrashCan } from "react-icons/fa6";

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
    homeWeb: string;
    headerWeb: string;
    url: string;
  };
};

const UpdateBannerComponent = ({
  marketingId,
  closeModal,
}: UpdateBannerComponentProps) => {
  const { data: header, error, isLoading } = useGetMarketingByIdQuery({ id: marketingId });

  const [updateMarketing, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateMarketingMutation();

  const [form, setForm] = useState<FormState>({
    _id: "",
    headers: {
      name: "",
      sequence: 0,
      enable: false,
      homeWeb: "",
      headerWeb: "",
      url: "",
    },
  });

  const [selectedHomeFile, setSelectedHomeFile] = useState<File | null>(null);
  const [selectedHeaderFile, setSelectedHeaderFile] = useState<File | null>(null);
  const [homeUploadResponse, setHomeUploadResponse] = useState<string>("");
  const [headerUploadResponse, setHeaderUploadResponse] = useState<string>("");

  const [
    uploadImage,
    { isLoading: isLoadingUpload, isSuccess: isSuccessUpload, isError: isErrorUpload },
  ] = useUploadImageMutation();

  useEffect(() => {
    if (header) {
      setForm({
        _id: header._id,
        headers: {
          name: header.headers.name,
          sequence: header.headers.sequence,
          enable: header.headers.enable,
          homeWeb: header.headers.homeWeb,
          headerWeb: header.headers.headerWeb,
          url: header.headers.url,
        },
      });
    }
  }, [header]);

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedForm = {
        ...form,
        headers: {
          ...form.headers,
          homeWeb: homeUploadResponse || form.headers.homeWeb,
          headerWeb: headerUploadResponse || form.headers.headerWeb,
        },
      };
      await updateMarketing(updatedForm).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating the banner:", err);
    }
  };

  const handleRemoveImage = (imageType: "homeWeb" | "headerWeb") => {
    setForm((prevForm) => ({
      ...prevForm,
      headers: {
        ...prevForm.headers,
        [imageType]: "",
      },
    }));
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching the banner data.</p>;

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">Update Banner</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>

      <form className="grid grid-cols-2 gap-4" onSubmit={handleUpdate}>
        <div className="flex flex-col gap-2">
          <label className="flex flex-col text-sm">
            Name:
            <input
              name="name"
              value={form.headers.name}
              placeholder="Banner Name"
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-1 text-sm"
            />
          </label>

          <label className="flex flex-col text-sm">
            Sequence:
            <input
              type="number"
              name="sequence"
              value={form.headers.sequence}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-1 text-sm"
            />
          </label>

          <label className="flex flex-col text-sm">
            Enable:
            <button
              type="button"
              onClick={() =>
                setForm((prevForm) => ({
                  ...prevForm,
                  headers: { ...prevForm.headers, enable: !prevForm.headers.enable },
                }))
              }
              className={`p-1 rounded-md text-sm ${
                form.headers.enable ? "bg-green-500 text-white" : "bg-red-500 text-white"
              }`}
            >
              {form.headers.enable ? "Enabled" : "Disabled"}
            </button>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex flex-col text-sm">
            Home Image:
            <input type="file" accept="image/*" onChange={handleHomeFileChange} />
            <button
              type="button"
              onClick={handleUploadHome}
              disabled={isLoadingUpload}
              className="mt-1 bg-blue-500 text-white rounded-md p-1 text-sm"
            >
              {isLoadingUpload ? "Uploading..." : "Upload Image"}
            </button>
            {form.headers.homeWeb && (
              <div className="flex items-center gap-2 mt-1">
                <img
                  src={form.headers.homeWeb}
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

          <label className="flex flex-col text-sm">
            Header Image:
            <input type="file" accept="image/*" onChange={handleHeaderFileChange} />
            <button
              type="button"
              onClick={handleUploadHeader}
              disabled={isLoadingUpload}
              className="mt-1 bg-blue-500 text-white rounded-md p-1 text-sm"
            >
              {isLoadingUpload ? "Uploading..." : "Upload Image"}
            </button>
            {form.headers.headerWeb && (
              <div className="flex items-center gap-2 mt-1">
                <img
                  src={form.headers.headerWeb}
                  alt="Header Banner"
                  className="h-20 w-full rounded-md"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage("headerWeb")}
                  className="text-red-500 text-sm"
                >
                  <FaTrashCan />
                </button>
              </div>
            )}
          </label>
        </div>

        <label className="flex flex-col text-sm col-span-2">
          URL:
          <textarea
            name="url"
            value={form.headers.url}
            placeholder="Banner URL"
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-1 text-sm"
          />
        </label>

        <div className="col-span-2 flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-400 rounded-md p-2 text-white text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`rounded-md p-2 text-white text-sm ${
              isUpdating ? "bg-gray-500" : "bg-success"
            }`}
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Update"}
          </button>
        </div>

        {isSuccess && (
          <p className="col-span-2 text-green-500 text-sm">Banner updated successfully!</p>
        )}
        {isError && <p className="col-span-2 text-red-500 text-sm">Error updating banner</p>}
      </form>
    </div>
  );
};

export default UpdateBannerComponent;
