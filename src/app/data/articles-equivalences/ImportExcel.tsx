// ImportArticlesEquivalencesModal.tsx
import { useImportArticleEquivalenceExcelMutation } from "@/redux/services/articlesEquivalences";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
interface ImportArticlesEquivalencesModalProps {
  closeModal: () => void;
}

const ImportArticlesEquivalencesModal: React.FC<ImportArticlesEquivalencesModalProps> = ({ closeModal }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importEquivalences, { isLoading, isSuccess, isError }] = useImportArticleEquivalenceExcelMutation();

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
      await importEquivalences(formData).unwrap();
      closeModal();
    } catch (error) {
      console.error("Error importing Article Equivalences:", error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Import Article Equivalences</h2>
          <button onClick={closeModal} className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex items-center justify-center">
            <IoMdClose className="text-sm" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Excel File</label>
            <input type="file" name="file" accept=".xlsx,.xls" onChange={handleFileChange} className="mt-1" />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={closeModal} className="bg-gray-400 text-white rounded-md px-3 py-1 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`rounded-md px-3 py-1 text-sm text-white ${isLoading ? "bg-gray-500" : "bg-blue-600"}`}
            >
              {isLoading ? "Importing..." : "Import"}
            </button>
          </div>
          {isSuccess && <p className="text-green-500 text-sm mt-2">Article Equivalences imported successfully!</p>}
          {isError && <p className="text-red-500 text-sm mt-2">Error importing Article Equivalences</p>}
        </form>
      </div>
    </div>
  );
};

export default ImportArticlesEquivalencesModal;
