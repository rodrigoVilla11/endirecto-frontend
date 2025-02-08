import { useLazyExportArticleVehiclesExcelQuery } from "@/redux/services/articlesVehicles";
import React, { useEffect } from "react";
import { IoMdClose } from "react-icons/io";

interface ExportExcelModalProps {
  closeModal: () => void;
}

const ExportExcelModal: React.FC<ExportExcelModalProps> = ({ closeModal }) => {
  // Usamos un lazy query para disparar la exportación cuando el usuario lo solicite
  const [triggerExport, { data: fileBlob, isLoading, isError }] = useLazyExportArticleVehiclesExcelQuery();

  const handleExport = async () => {
    // Disparamos la llamada al endpoint de exportación
    await triggerExport();
  };

  useEffect(() => {
    if (fileBlob) {
      // Una vez obtenido el Blob, se crea una URL temporal para descargar el archivo
      const url = window.URL.createObjectURL(fileBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vehicles.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
      // Opcional: cerrar el modal después de la descarga
      closeModal();
    }
  }, [fileBlob, closeModal]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Export Article Vehicles</h2>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-6 w-6 flex items-center justify-center"
          >
            <IoMdClose className="text-sm" />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-sm">
            Haz clic en Export para descargar el archivo Excel con la información de los Article Vehicles.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-400 text-white rounded-md px-3 py-1 text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isLoading}
              className={`rounded-md px-3 py-1 text-sm text-white ${
                isLoading ? "bg-gray-500" : "bg-blue-600"
              }`}
            >
              {isLoading ? "Exportando..." : "Exportar"}
            </button>
          </div>
          {isError && (
            <p className="text-red-500 text-sm mt-2">Error al exportar el archivo Excel</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportExcelModal;
