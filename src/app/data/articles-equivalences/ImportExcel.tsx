import { useImportArticleEquivalenceExcelMutation } from "@/redux/services/articlesEquivalences";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";

interface ImportArticlesEquivalencesModalProps {
  closeModal: () => void;
}

const ImportArticlesEquivalencesModal: React.FC<
  ImportArticlesEquivalencesModalProps
> = ({ closeModal }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [importEquivalences, { isLoading, isSuccess, isError }] =
    useImportArticleEquivalenceExcelMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      console.warn("[IMPORT] No file selected");
      return;
    }


    const formData = new FormData();
    formData.append("file", file, file.name);

    try {

      const res = await importEquivalences(formData).unwrap();

      closeModal();
    } catch (err: any) {
      console.error("[IMPORT] error raw:", err);

      // RTK Query suele traer esto
      console.error("[IMPORT] error details:", {
        status: err?.status,
        data: err?.data,
        error: err?.error,
        originalStatus: err?.originalStatus,
      });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {t("importArticleEquivalences")}
          </h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex items-center justify-center"
          >
            <IoMdClose className="text-sm" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("selectExcelFile")}
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
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`rounded-md px-3 py-1 text-sm text-white ${isLoading ? "bg-gray-500" : "bg-blue-600"}`}
            >
              {isLoading ? t("importing") : t("import")}
            </button>
          </div>
          {isSuccess && (
            <p className="text-green-500 text-sm mt-2">
              {t("articleEquivalencesImportedSuccess")}
            </p>
          )}
          {isError && (
            <p className="text-red-500 text-sm mt-2">
              {t("errorImportingArticleEquivalences")}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ImportArticlesEquivalencesModal;
