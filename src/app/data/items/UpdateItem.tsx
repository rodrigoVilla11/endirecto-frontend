import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import {
  useGetItemByIdQuery,
  useUpdateItemMutation,
} from "@/redux/services/itemsApi";
import React, { useEffect, useState } from "react";
import { FaTrashCan } from "react-icons/fa6";
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
    refetch
  } = useGetItemByIdQuery({
    id: itemId,
  });
  const [updateItem, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateItemMutation();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<string>("");

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
    } else {
      console.error("No file selected");
    }
  };

  const [form, setForm] = useState({
    id: "",
    name: "",
    image: "",
  });

  useEffect(() => {
    refetch()
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

    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedForm = {
        ...form,
        image: uploadResponse || form.image, 
      };
      await updateItem(updatedForm).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating the item:", err);
    }
  };

  const handleRemoveImage = () => {
    setForm((prevForm) => ({
      ...prevForm,
      image: "",
    }));
    setUploadResponse("");
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching the item.</p>;

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
            readOnly
            className="border border-black rounded-md p-2 bg-gray-200"
          />
        </label>

        <label className="flex flex-col">
          Image:
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            <button onClick={handleUpload} disabled={isLoadingUpload}>
              {isLoadingUpload ? "Uploading..." : "Upload Image"}
            </button>

            {isSuccessUpload && <div>Image uploaded successfully!</div>}
            {isErrorUpload && <div>Error uploading image</div>}
          </div>
          {form.image && (
            <div className="flex mt-2">
              <img src={form.image} alt="item_image" className="h-20 w-20" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-red-500 mt-2"
              >
                <FaTrashCan /> 
              </button>
            </div>
          )}
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
          <p className="text-green-500">Item updated successfully!</p>
        )}
        {isError && <p className="text-red-500">Error updating item</p>}
      </form>
    </div>
  );
};

export default UpdateItemComponent;
