import {
  useGetBrandByIdQuery,
  useUpdateBrandMutation,
} from "@/redux/services/brandsApi";
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import React, { useEffect, useState } from "react";
import { FaTrashCan } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";

type UpdateBrandComponentProps = {
  brandId: string;
  closeModal: () => void;
};

const UpdateBrandComponent = ({
  brandId,
  closeModal,
}: UpdateBrandComponentProps) => {
  const {
    data: brand,
    error,
    isLoading,
    refetch,
  } = useGetBrandByIdQuery({ id: brandId });
  const [updateBrand, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateBrandMutation();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadResponses, setUploadResponses] = useState<string[]>([]);
  const [
    uploadImage,
    {
      isLoading: isLoadingUpload,
      isSuccess: isSuccessUpload,
      isError: isErrorUpload,
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
    images: "" as string,
    sequence: "",
    name: "",
    hidden: false,
  });

  useEffect(() => {
    refetch();
    if (brand) {
      setForm({
        id: brand.id ?? "",
        name: brand.name ?? "",
        images: brand.images ?? "",
        sequence: brand.sequence ?? "",
        hidden: brand.hidden ?? false,
      });
    }
  }, [brand]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: checked,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedForm = {
        ...form,
        images: uploadResponses.length > 0 ? uploadResponses[0] : form.images,
      };
      await updateBrand(updatedForm).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating the brand:", err);
    }
  };

  const handleRemoveImage = () => {
    setForm((prevForm) => ({
      ...prevForm,
      images: "",
    }));
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching the brand.</p>;

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">Update Brand</h2>
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
          Sequence:
          <textarea
            name="sequence"
            value={form.sequence}
            placeholder="Sequence"
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="hidden"
            checked={form.hidden}
            onChange={handleCheckboxChange}
            className="cursor-pointer"
          />
          Hidden
        </label>

        <label className="flex flex-col">
          Images:
          <div className="mb-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
            <button
              onClick={handleUpload}
              disabled={isLoadingUpload}
              className={`rounded-md p-2 text-white ${
                isLoadingUpload ? "bg-gray-500" : "bg-success"
              }`}
            >
              {isLoadingUpload ? "Uploading..." : "Upload Images"}
            </button>
            {isSuccessUpload && <div>Images uploaded successfully!</div>}
            {isErrorUpload && <div>Error uploading images</div>}
          </div>
          <div className="border rounded-md p-2">
            <table className="min-w-full table-auto">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Link</th>
                  <th>
                    <FaTrashCan />
                  </th>
                </tr>
              </thead>
              <tbody>
                {form.images && (
                  <tr>
                    <td>
                      <img
                        src={form.images}
                        alt="brand_image"
                        className="h-10"
                      />
                    </td>
                    <td>
                      <a
                        href={form.images}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500"
                      >
                        {form.images}
                      </a>
                    </td>
                    <td>
                      <div className="flex justify-center items-center">
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="text-red-500"
                        >
                          <FaTrashCan />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
          <p className="text-green-500">Brand updated successfully!</p>
        )}
        {isError && <p className="text-red-500">Error updating brand</p>}
      </form>
    </div>
  );
};

export default UpdateBrandComponent;
