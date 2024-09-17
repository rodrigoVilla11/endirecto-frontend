import {
    useGetMarketingByIdQuery,
    useUpdateMarketingMutation,
  } from "@/redux/services/marketingApi";
  import React, { useEffect, useState } from "react";
  
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
    const {
      data: header,
      error,
      isLoading,
    } = useGetMarketingByIdQuery({ id: marketingId });
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
        await updateMarketing(form).unwrap();
        closeModal();
      } catch (err) {
        console.error("Error al actualizar el Banner:", err);
      }
    };
  
    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Error</p>; 
  
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
        <h2 className="text-lg mb-4">Update Banner</h2>
        <form className="flex flex-col gap-4" onSubmit={handleUpdate}>
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
  
          {isSuccess && (
            <p className="text-green-500">Banner updated successfully!</p>
          )}
          {isError && <p className="text-red-500">Error updating Banner</p>}
  
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
        </form>
      </div>
    );
  };
  
  export default UpdateBannerComponent;
  