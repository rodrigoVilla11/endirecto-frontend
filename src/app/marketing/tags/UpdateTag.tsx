import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import {
  useGetMarketingByIdQuery,
  useUpdateMarketingMutation,
} from "@/redux/services/marketingApi";
import React, { useEffect, useState } from "react";
import { FaTrashCan } from "react-icons/fa6";
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
  const { data: tag, error, isLoading } = useGetMarketingByIdQuery({ id: marketingId });

  const [updateMarketing, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateMarketingMutation();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<string>("");

  const [
    uploadImage,
    { isLoading: isLoadingUpload, isSuccess: isSuccessUpload, isError: isErrorUpload },
  ] = useUploadImageMutation();

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
    if (tag) {
      setForm({
        _id: tag._id,
        tags: {
          name: tag.tags.name,
          enable: tag.tags.enable,
          image: tag.tags.image,
          url: tag.tags.url,
        },
      });
    }
  }, [tag]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      try {
        const response = await uploadImage(selectedFile).unwrap();
        setUploadResponse(response.url);
      } catch (err) {
        console.error("Error uploading image:", err);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      tags: {
        ...prevForm.tags,
        [name]: value,
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
          image: uploadResponse || form.tags.image,
        },
      };

      await updateMarketing(updatedForm).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating the Tag:", err);
    }
  };

  const handleRemoveImage = () => {
    setForm((prevForm) => ({
      ...prevForm,
      tags: {
        ...prevForm.tags,
        image: "",
      },
    }));
    setUploadResponse("");
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

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading Tag data.</p>;

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">Update Tag</h2>
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
              value={form.tags.name}
              placeholder="Tag Name"
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-1 text-sm"
            />
          </label>

          <label className="flex flex-col text-sm">
            Enable:
            <button
              type="button"
              onClick={handleToggleEnable}
              className={`p-1 rounded-md text-sm ${
                form.tags.enable ? "bg-green-500 text-white" : "bg-red-500 text-white"
              }`}
            >
              {form.tags.enable ? "Enabled" : "Disabled"}
            </button>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex flex-col text-sm">
            Image:
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button
              type="button"
              onClick={handleUpload}
              disabled={isLoadingUpload}
              className="mt-1 bg-blue-500 text-white rounded-md p-1 text-sm"
            >
              {isLoadingUpload ? "Uploading..." : "Upload Image"}
            </button>
            {form.tags.image && (
              <div className="flex items-center gap-2 mt-1">
                <img src={form.tags.image} alt="Tag Image" className="h-16 w-auto rounded-md" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
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
            value={form.tags.url}
            placeholder="Tag URL"
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
          <p className="col-span-2 text-green-500 text-sm">Tag updated successfully!</p>
        )}
        {isError && <p className="col-span-2 text-red-500 text-sm">Error updating tag</p>}
      </form>
    </div>
  );
};

export default UpdateTagComponent;

