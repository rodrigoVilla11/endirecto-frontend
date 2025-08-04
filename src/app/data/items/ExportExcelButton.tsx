// src/components/ExportItemsModal.tsx

import React, { useState, useEffect } from "react";
import { IoMdClose, IoMdDownload, IoMdAlert } from "react-icons/io";
import { useTranslation } from "react-i18next";
import { useLazyExportItemsExcelQuery } from "@/redux/services/itemsApi";

interface ExportItemsModalProps {
  closeModal: () => void;
  searchQuery?: string;
}

const ExportItemsModal: React.FC<ExportItemsModalProps> = ({
  closeModal,
  searchQuery = "",
}) => {
  const { t } = useTranslation();
  const [triggerExport, { isLoading, isError, error }] =
    useLazyExportItemsExcelQuery();
  const [exportProgress, setExportProgress] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleExport = async () => {
    try {
      setExportProgress(t("preparingExport") || "Preparando exportación...");
      setShowSuccess(false);
      const blob = await triggerExport({ query: searchQuery }).unwrap();
      downloadFile(blob);
    } catch {
      setExportProgress("");
    }
  };

  const downloadFile = (blob: Blob) => {
    try {
      setExportProgress(t("downloadingFile") || "Descargando archivo...");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      let filename = `items-${date}`;
      if (searchQuery) filename += `-filtro`;
      filename += `.xlsx`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setExportProgress(t("exportCompleted") || "Exportación completada");
      setShowSuccess(true);
      setTimeout(closeModal, 2000);
    } catch {
      setExportProgress(
        t("errorDownloading") || "Error al descargar el archivo"
      );
    }
  };

  useEffect(() => {
    if (isError) {
      setExportProgress("");
      setShowSuccess(false);
    }
  }, [isError]);

  const getErrorMessage = () => {
    if (!isError || !error) return "";
    if ("status" in error) {
      switch (error.status) {
        case 404:
          return t("noDataToExport") || "No hay datos para exportar";
        case 500:
          return t("serverError") || "Error del servidor";
        case 403:
          return t("noPermission") || "Sin permisos para exportar";
        default:
          return t("errorExportingItems") || "Error al exportar ítems";
      }
    }
    return "message" in error ? error.message : t("errorExportingItems");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {t("exportItems") || "Exportar Ítems"}
          </h2>
          <button
            onClick={closeModal}
            disabled={isLoading}
            className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-full h-8 w-8 flex items-center justify-center transition-colors"
            aria-label="Cerrar modal"
          >
            <IoMdClose />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <IoMdDownload className="text-blue-600 text-xl mt-1" />
            <div>
              <p className="text-sm text-gray-600">
                {searchQuery
                  ? t("exportFilteredItemsDescription") ||
                    "Se exportarán los ítems filtrados en Excel (.xlsx)."
                  : t("exportItemsDescription") ||
                    "Se exportarán todos los ítems en Excel (.xlsx)."}
              </p>
              {searchQuery && (
                <p className="text-xs text-blue-600 mt-1">
                  {t("currentFilter") || "Filtro actual"}: “{searchQuery}”
                </p>
              )}
            </div>
          </div>

          {exportProgress && (
            <div
              className={`border rounded-md p-3 ${
                showSuccess
                  ? "bg-green-50 border-green-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                )}
                {showSuccess && <div className="text-green-600">✓</div>}
                <span
                  className={`text-sm ${
                    showSuccess ? "text-green-700" : "text-blue-700"
                  }`}
                >
                  {exportProgress}
                </span>
              </div>
            </div>
          )}

          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center gap-2">
                <IoMdAlert className="text-red-500" />
                <span className="text-sm text-red-700">
                  {getErrorMessage()}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={closeModal}
              disabled={isLoading}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md px-4 py-2 text-sm"
            >
              {isLoading
                ? t("processing") || "Procesando..."
                : t("cancel") || "Cancelar"}
            </button>
            <button
              onClick={handleExport}
              disabled={isLoading || showSuccess}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-md px-4 py-2 text-sm flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  {t("exporting") || "Exportando..."}
                </>
              ) : showSuccess ? (
                <>
                  <div className="text-green-200">✓</div>
                  {t("exported") || "Exportado"}
                </>
              ) : (
                <>
                  <IoMdDownload />
                  {t("export") || "Exportar"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportItemsModal;
