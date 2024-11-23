import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import {
  useGetMarketingByIdQuery,
  useUpdateMarketingMutation,
} from "@/redux/services/marketingApi";
import React, { useEffect, useState } from "react";
import { FaTrashCan } from "react-icons/fa6";

type UpdatePopupComponentProps = {
  marketingId: string;
  closeModal: () => void;
};

const UpdatePopupComponent = ({
  marketingId,
  closeModal,
}: UpdatePopupComponentProps) => {
  const {
    data: popup,
    error,
    isLoading,
  } = useGetMarketingByIdQuery({ id: marketingId });
  const [updateMarketing, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateMarketingMutation();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<string>("");

  const [
    uploadImage,
    {
      isLoading: isLoadingUpload,
      isSuccess: isSuccessUpload,
      isError: isErrorUpload,
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
    }
  };

  const [form, setForm] = useState({
    _id: "",
    popups: {
      name: "",
      sequence: 0,
      location: "",
      enable: false,
      web: "",
      url: "",
      visualization: 0,
    },
  });

  useEffect(() => {
    if (popup) {
      setForm({
        _id: popup._id,
        popups: {
          name: popup.popups.name,
          sequence: popup.popups.sequence,
          location: popup.popups.location,
          enable: popup.popups.enable,
          web: popup.popups.web,
          url: popup.popups.url,
          visualization: popup.popups.visualization,
        },
      });
    }
  }, [popup]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      popups: {
        ...prevForm.popups,
        [name]:
          name === "sequence" || name === "visualization"
            ? Number(value)
            : value,
      },
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedForm = {
        ...form,
        popups: {
          ...form.popups,
          web: uploadResponse || form.popups.web,
        },
      };
      await updateMarketing(updatedForm).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating the Popup:", err);
    }
  };

  const handleRemoveImage = () => {
    setForm((prevForm) => ({
      ...prevForm,
      popups: {
        ...prevForm.popups,
        web: "",
      },
    }));
    setUploadResponse("");
  };

  const handleToggleEnable = () => {
    setForm((prevForm) => ({
      ...prevForm,
      popups: {
        ...prevForm.popups,
        enable: !prevForm.popups.enable,
      },
    }));
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching popup data.</p>;

  return (
    <div>
      <h2 className="text-lg mb-4">Update Popup</h2>
      <form className="grid grid-cols-2 gap-4" onSubmit={handleUpdate}>
        <div className="flex flex-col gap-2">
          <label className="flex flex-col text-sm">
            Name:
            <input
              name="name"
              value={form.popups.name}
              placeholder="Popup Name"
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-1"
            />
          </label>

          <label className="flex flex-col text-sm">
            Sequence:
            <input
              type="number"
              name="sequence"
              value={form.popups.sequence}
              placeholder="Popup Sequence"
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-1"
            />
          </label>

          <label className="flex flex-col text-sm">
            Location:
            <input
              name="location"
              value={form.popups.location}
              placeholder="Popup Location"
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-1"
            />
          </label>

          <label className="flex flex-col text-sm">
            Enable:
            <button
              type="button"
              onClick={handleToggleEnable}
              className={`p-1 rounded-md text-sm ${
                form.popups.enable ? "bg-green-500 text-white" : "bg-red-500 text-white"
              }`}
            >
              {form.popups.enable ? "Enabled" : "Disabled"}
            </button>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex flex-col text-sm">
            Web Image:
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button
              type="button"
              onClick={handleUpload}
              disabled={isLoadingUpload}
              className="mt-1 bg-blue-500 text-white rounded-md p-1 text-sm"
            >
              {isLoadingUpload ? "Uploading..." : "Upload Image"}
            </button>
            {form.popups.web && (
              <div className="flex items-center gap-2 mt-1">
                <img src={form.popups.web} alt="Popup Image" className="h-16 w-16 rounded-md" />
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

          <label className="flex flex-col text-sm">
            URL:
            <input
              name="url"
              value={form.popups.url}
              placeholder="Popup URL"
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-1"
            />
          </label>

          <label className="flex flex-col text-sm">
            Visualizations:
            <input
              type="number"
              name="visualization"
              value={form.popups.visualization}
              placeholder="Popup Visualization"
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-1"
            />
          </label>
        </div>

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
          <p className="col-span-2 text-green-500 text-sm">Popup updated successfully!</p>
        )}
        {isError && <p className="col-span-2 text-red-500 text-sm">Error updating popup</p>}
      </form>
    </div>
  );
};

export default UpdatePopupComponent;
