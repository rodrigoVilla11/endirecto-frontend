import { useImportArticleVehiclesExcelMutation } from "@/redux/services/articlesVehicles";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";

interface ImportExcelModalProps {
  closeModal: () => void;
}

const ImportExcelModal: React.FC<ImportExcelModalProps> = ({ closeModal }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importExcel, { isLoading, isSuccess, isError }] = useImportArticleVehiclesExcelMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await importExcel(formData).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error importing Excel:", err);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Import Excel</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex justify-center items-center"
          >
            <IoMdClose className="text-sm" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Excel File
            </label>
            <input
              type="file"
              name="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-400 text-white rounded-md px-3 py-1 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`rounded-md px-3 py-1 text-sm text-white ${
                isLoading ? "bg-gray-500" : "bg-blue-600"
              }`}
            >
              {isLoading ? "Importing..." : "Import"}
            </button>
          </div>
          {isSuccess && (
            <p className="text-green-500 text-sm mt-2">
              Excel imported successfully!
            </p>
          )}
          {isError && (
            <p className="text-red-500 text-sm mt-2">Error importing Excel file</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ImportExcelModal;
