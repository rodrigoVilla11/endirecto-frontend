import React, { useState, useEffect } from "react";
import { IoMdClose, IoMdDownload, IoMdAlert } from "react-icons/io";
import { useTranslation } from "react-i18next";
import { useExportTechnicalDetailExcelMutation } from "@/redux/services/articlesTechnicalDetailsApi";

interface ExportTechnicalDetailsModalProps {
  closeModal: () => void;
  searchQuery?: string; // Opcional: para exportar solo datos filtrados
}

const ExportTechnicalDetailsModal: React.FC<
  ExportTechnicalDetailsModalProps
> = ({ closeModal, searchQuery = "" }) => {
  const { t } = useTranslation();

  // CAMBIADO: Usar mutation en lugar de lazy query
  const [exportExcel, { isLoading, isError, error }] =
    useExportTechnicalDetailExcelMutation();

  const [exportProgress, setExportProgress] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleExport = async () => {
    try {
      setExportProgress(t("preparingExport") || "Preparando exportación...");
      setShowSuccess(false);

      // CAMBIADO: Usar exportExcel en lugar de triggerExport
      const blob = await exportExcel({ query: searchQuery }).unwrap();
      downloadFile(blob);
    } catch (err) {
      setExportProgress("");
      console.error("Error al exportar:", err);
    }
  };

  const downloadFile = (blob: Blob) => {
    try {
      setExportProgress(t("downloadingFile") || "Descargando archivo...");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      let filename = `detalles-tecnicos-${date}`;
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
    } catch (err) {
      setExportProgress(
        t("errorDownloading") || "Error al descargar el archivo"
      );
      console.error("Error al descargar:", err);
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
        case "FETCH_ERROR":
          return t("connectionError") || "Error de conexión";
        case "PARSING_ERROR":
          return t("fileProcessingError") || "Error al procesar el archivo";
        default:
          return (
            t("errorExportingTechnicalDetails") ||
            "Error al exportar detalles técnicos"
          );
      }
    }
    if ("message" in error) {
      return error.message;
    }
    return (
      t("errorExportingTechnicalDetails") ||
      "Error al exportar detalles técnicos"
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {t("exportTechnicalDetails") || "Exportar Detalles Técnicos"}
          </h2>
          <button
            onClick={closeModal}
            disabled={isLoading}
            className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-full h-8 w-8 flex items-center justify-center transition-colors"
            aria-label="Cerrar modal"
          >
            <IoMdClose className="text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <IoMdDownload className="text-blue-600 text-xl mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600">
                {searchQuery
                  ? t("exportFilteredTechnicalDetailsDescription") ||
                    "Se exportarán los detalles técnicos que coincidan con el filtro actual en Excel (.xlsx)."
                  : t("exportTechnicalDetailsDescription") ||
                    "Se exportarán todos los detalles técnicos en Excel (.xlsx)."}
              </p>
              {searchQuery && (
                <p className="text-xs text-blue-600 mt-1">
                  {t("currentFilter") || "Filtro actual"}: &quot;{searchQuery}
                  &quot;
                </p>
              )}
            </div>
          </div>

          {/* Progress indicator */}
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
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

          {/* Error message */}
          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center gap-2">
                <IoMdAlert className="text-red-500 text-lg flex-shrink-0" />
                <span className="text-sm text-red-700">
                  {getErrorMessage()}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={closeModal}
              disabled={isLoading}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              {isLoading
                ? t("processing") || "Procesando..."
                : t("cancel") || "Cancelar"}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isLoading || showSuccess}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-md px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t("exporting") || "Exportando..."}
                </>
              ) : showSuccess ? (
                <>
                  <div className="text-green-200">✓</div>
                  {t("exported") || "Exportado"}
                </>
              ) : (
                <>
                  <IoMdDownload className="text-lg" />
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

export default ExportTechnicalDetailsModal;
