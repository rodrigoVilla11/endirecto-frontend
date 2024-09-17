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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      console.error("Error al crear el Banner:", err);
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
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">New Banner</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex gap-4">
          <label className="flex flex-col">
            Name:
            <input
              name="name"
              value={form.headers.name}
              placeholder="Banner Name"
              onChange={handleChange}
              className="border border-black rounded-md p-2"
            />
          </label>

          <label className="flex flex-col">
            Sequence:
            <input
              type="number"
              name="sequence"
              value={form.headers.sequence}
              placeholder="Banner Sequence"
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
                form.headers.enable ? "bg-green-500" : "bg-red-500"
              } text-white`}
            >
              {form.headers.enable ? "On" : "Off"}
            </button>
          </div>

          <label className="flex flex-col">
            Home Web:
            <input
              name="homeWeb"
              value={form.headers.homeWeb}
              placeholder="Banner Home Web"
              onChange={handleChange}
              className="border border-black rounded-md p-2"
            />
          </label>

          <label className="flex flex-col">
            Header Web:
            <input
              name="headerWeb"
              value={form.headers.headerWeb}
              placeholder="Banner Header Web"
              onChange={handleChange}
              className="border border-black rounded-md p-2"
            />
          </label>

          <label className="flex flex-col">
            URL:
            <input
              name="url"
              value={form.headers.url}
              placeholder="Banner URL"
              onChange={handleChange}
              className="border border-black rounded-md p-2"
            />
          </label>
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
          <p className="text-green-500">Banner created successfully!</p>
        )}
        {isError && <p className="text-red-500">Error creating Banner</p>}
      </form>
    </div>
  );
};

export default CreateBannerComponent;
