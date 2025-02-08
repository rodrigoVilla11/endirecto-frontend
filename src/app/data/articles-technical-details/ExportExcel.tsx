// ExportArticlesEquivalencesModal.tsx
import { useLazyExportArticleEquivalenceExcelQuery } from "@/redux/services/articlesEquivalences";
import { useLazyExportTechnicalDetailExcelQuery } from "@/redux/services/articlesTechnicalDetailsApi";
import React, { useEffect } from "react";
import { IoMdClose } from "react-icons/io";
interface ExportArticlesTDModalProps {
  closeModal: () => void;
}

const ExportArticlesTDModal: React.FC<ExportArticlesTDModalProps> = ({ closeModal }) => {
  const [triggerExport, { data: fileBlob, isLoading, isError }] = useLazyExportTechnicalDetailExcelQuery();

  const handleExport = async () => {
    await triggerExport();
  };

  useEffect(() => {
    if (fileBlob) {
      // Creamos una URL temporal a partir del Blob
      const url = window.URL.createObjectURL(fileBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "articles-technical-details.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
      closeModal();
    }
  }, [fileBlob, closeModal]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Export Article Technical Details</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex items-center justify-center"
          >
            <IoMdClose className="text-sm" />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-sm">
            Click "Export" to download the Excel file with the Article Technical Details.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={closeModal} className="bg-gray-400 text-white rounded-md px-3 py-1 text-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isLoading}
              className={`rounded-md px-3 py-1 text-sm text-white ${isLoading ? "bg-gray-500" : "bg-blue-600"}`}
            >
              {isLoading ? "Exporting..." : "Export"}
            </button>
          </div>
          {isError && (
            <p className="text-red-500 text-sm mt-2">Error exporting Article Technical Details</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportArticlesTDModal;
