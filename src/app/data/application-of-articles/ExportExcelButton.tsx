import { useLazyExportArticleVehiclesExcelQuery } from "@/redux/services/articlesVehicles";
import React, { useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { useTranslation } from 'react-i18next'; // Importa useTranslation

interface ExportExcelModalProps {
  closeModal: () => void;
}

const ExportExcelModal: React.FC<ExportExcelModalProps> = ({ closeModal }) => {
  const { t } = useTranslation(); // Inicializa useTranslation
  const [triggerExport, { data: fileBlob, isLoading, isError }] = useLazyExportArticleVehiclesExcelQuery();

  const handleExport = async () => {
    await triggerExport();
  };

  useEffect(() => {
    if (fileBlob) {
      const url = window.URL.createObjectURL(fileBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vehicles.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
      closeModal();
    }
  }, [fileBlob, closeModal]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {t('exportModal.title')} {/* Usa la traducción para el título */}
          </h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex items-center justify-center"
          >
            <IoMdClose className="text-sm" />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-sm">
            {t('exportModal.description')} {/* Usa la traducción para la descripción */}
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-400 text-white rounded-md px-3 py-1 text-sm"
            >
              {t('exportModal.cancelButton')} {/* Usa la traducción para el botón Cancelar */}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isLoading}
              className={`rounded-md px-3 py-1 text-sm text-white ${
                isLoading ? "bg-gray-500" : "bg-blue-600"
              }`}
            >
              {isLoading ? t('exportModal.exportingButton') : t('exportModal.exportButton')} {/* Usa la traducción para el botón Exportar */}
            </button>
          </div>
          {isError && (
            <p className="text-red-500 text-sm mt-2">
              {t('exportModal.errorMessage')} {/* Usa la traducción para el mensaje de error */}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportExcelModal;