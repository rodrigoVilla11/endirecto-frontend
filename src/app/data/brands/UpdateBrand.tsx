import {
  useGetBrandByIdQuery,
  useUpdateBrandMutation,
} from "@/redux/services/brandsApi";
import React, { useEffect, useState } from "react";
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
  } = useGetBrandByIdQuery({
    id: brandId,
  });
  const [updateBrand, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateBrandMutation();

  const [form, setForm] = useState({
    id: "",
    images: [] as string[],
    sequence: "",
    name: "",
  });

  useEffect(() => {
    if (brand) {
      setForm({
        id: brand.id ?? "",
        name: brand.name ?? "",
        images: brand.images ?? [],
        sequence: brand.sequence ?? "",
      });
    }
  }, [brand]);

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
      await updateBrand(form).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating the brand:", err);
    }
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
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          Sequence:
          <textarea
            name="sequence"
            value={form.sequence}
            placeholder="sequence"
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          Images:
          <input
            name="images"
            value={form.images.join(", ")}
            placeholder="Images (comma separated)"
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
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

export default UpdateBrandComponent;
