import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import {
  useGetItemByIdQuery,
  useUpdateItemMutation,
} from "@/redux/services/itemsApi";
import React, { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";
type UpdateItemComponentProps = {
  itemId: string;
  closeModal: () => void;
};

const UpdateItemComponent = ({
  itemId,
  closeModal,
}: UpdateItemComponentProps) => {
  const {
    data: item,
    error,
    isLoading,
  } = useGetItemByIdQuery({
    id: itemId,
  });
  const [updateItem, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateItemMutation();

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

  const [form, setForm] = useState({
    id: "",
    name: "",
    image: "",
  });

  useEffect(() => {
    if (item) {
      setForm({
        id: item.id ?? "",
        name: item.name ?? "",
        image: item.image ?? "",
      });
    }
  }, [item]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "images" || name === "pdfs") {
      setForm((prevForm) => ({
        ...prevForm,
        [name]: value.split(",").map((item) => item.trim()),
      }));
    } else {
      setForm((prevForm) => ({
        ...prevForm,
        [name]: value,
      }));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedForm = {
        ...form,
        image: uploadResponses.length > 0 ? uploadResponses[0] : form.image, 
      };
      await updateItem(updatedForm).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating the article:", err);
    }
  };
  

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching the brand.</p>;

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">Update Item</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleUpdate}>
        <label className="flex flex-col">
          ID:
          <input
            name="id"
            value={form.id}
            placeholder="ID"
            readOnly
            className="border border-black rounded-md p-2 bg-gray-200"
          />
        </label>

        <label className="flex flex-col">
          Name:
          <input
            name="name"
            value={form.name}
            placeholder="Name"
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          Images:
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
              isUpdating ? "bg-gray-500" : "bg-success"
            }`}
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Update"}
          </button>
        </div>

        {isSuccess && (
          <p className="text-green-500">Article updated successfully!</p>
        )}
        {isError && <p className="text-red-500">Error updating article</p>}
      </form>
    </div>
  );
};

export default UpdateItemComponent;
