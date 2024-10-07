import {
  useGetArticleByIdQuery,
  useUpdateArticleMutation,
} from "@/redux/services/articlesApi";
import { useUploadImageMutation } from "@/redux/services/cloduinaryApi";
import React, { useEffect, useState } from "react";
import { FaTrashCan } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";

type UpdateArticleComponentProps = {
  articleId: string;
  closeModal: () => void;
};

const UpdateArticleComponent = ({
  articleId,
  closeModal,
}: UpdateArticleComponentProps) => {
  const {
    data: article,
    error,
    isLoading,
    refetch
  } = useGetArticleByIdQuery({ id: articleId });

  const [updateArticle, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateArticleMutation();
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
    supplier_code: "",
    description: "",
    images: [] as string[],
    pdfs: [] as string[],
  });

  useEffect(() => {
    if (article) {
      refetch()
      setForm({
        id: article.id ?? "",
        supplier_code: article.supplier_code ?? "",
        description: article.description ?? "",
        images: article.images ?? [],
        pdfs: Array.isArray(article.pdfs) ? article.pdfs : [],
      });
    }
  }, [article]);

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
        images: [...form.images, ...uploadResponses],
        id: articleId
      };
      console.log(updatedForm)
      await updateArticle(updatedForm).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error updating the article:", err);
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm((prevForm) => ({
      ...prevForm,
      images: prevForm.images.filter((_, i) => i !== index),
    }));
  };


  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching the article.</p>;

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">Update Article</h2>
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
          Supplier Code:
          <input
            name="supplier_code"
            value={form.supplier_code}
            placeholder="Supplier Code"
            onChange={handleChange}
            className="border border-black rounded-md p-2"
          />
        </label>

        <label className="flex flex-col">
          Description:
          <textarea
            name="description"
            value={form.description}
            placeholder="Description"
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
                {form.images.map((image, index) => (
                  <tr key={index}>
                    <td>
                      <img src={image} alt="brand_image" className="h-10" />
                    </td>
                    <td>
                      <a
                        href={image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500"
                      >
                        {image}
                      </a>
                    </td>
                    <td>
                      <div className="flex justify-center items-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="text-red-500 "
                        >
                          <FaTrashCan />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </label>

        <label className="flex flex-col">
          PDFs:
          <input
            name="pdfs"
            value={form.pdfs.join(", ")}
            placeholder="PDFs (comma separated)"
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

export default UpdateArticleComponent;
