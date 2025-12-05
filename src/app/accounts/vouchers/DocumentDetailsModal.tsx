// src/app/.../DocumentDetailsModal.tsx
"use client";

import React, { useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { useTranslation } from "react-i18next";
import { useGetDocumentByIdQuery } from "@/redux/services/documentsApi";

interface DocumentDetailsModalProps {
  documentId: string;
  onClose: () => void;
  customers: any[];
  sellers: any[];
}

const DocumentDetailsModal: React.FC<DocumentDetailsModalProps> = ({
  documentId,
  onClose,
  customers,
  sellers,
}) => {
  const { t } = useTranslation();

  const {
    data: document,
    isLoading,
    error,
    refetch,
  } = useGetDocumentByIdQuery(
    { id: documentId },
    { skip: !documentId }
  );

  useEffect(() => {
    if (documentId) {
      refetch();
    }
  }, [documentId, refetch]);

  const customer = customers.find(
    (c: any) => c.id === (document as any)?.customer_id
  );
  const seller = sellers.find(
    (s: any) => s.id === (document as any)?.seller_id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-red-500 via-white to-blue-600 text-black">
          <div>
            <h2 className="font-semibold text-lg">
              {"Detalle del comprobante"}
            </h2>
            {document && (
              <p className="text-xs opacity-90">
                {t("number")}: {(document as any)?.number} •{" "}
                {t("type")}: {(document as any)?.type}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/15 transition-colors"
            aria-label={t("close") || "Cerrar"}
          >
            <IoMdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-6 text-gray-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2" />
              <span>{t("loading") || "Cargando..."}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {t("errorLoadingDocuments") ||
                "Ocurrió un error al cargar el documento."}
            </div>
          )}

          {!isLoading && !error && document && (
            <>
              {/* Datos principales */}
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    {t("number")}
                  </p>
                  <p className="font-medium text-gray-900">
                    {(document as any).number}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    {t("type")}
                  </p>
                  <p className="font-medium text-gray-900">
                    {(document as any).type}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    {t("date")}
                  </p>
                  <p className="font-medium text-gray-900">
                    {(document as any).date}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    {t("expiration")}
                  </p>
                  <p className="font-medium text-gray-900">
                    {(document as any).expiration_date || "-"}
                  </p>
                </div>
              </section>

              {/* Cliente y vendedor */}
              <section className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    {t("customer")}
                  </p>
                  <p className="font-medium text-gray-900">
                    {customer
                      ? `${customer.id} - ${customer.name}`
                      : (document as any).customer_id || t("notFound")}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    {t("seller")}
                  </p>
                  <p className="font-medium text-gray-900">
                    {seller
                      ? `${seller.id} - ${seller.name}`
                      : (document as any).seller_id || t("notFound")}
                  </p>
                </div>
              </section>

              {/* Importes */}
              <section className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    {t("amount")}
                  </p>
                  <p className="font-semibold text-green-700">
                    {(document as any).amount}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    {t("balance")}
                  </p>
                  <p className="font-semibold text-blue-700">
                    {(document as any).balance ?? (document as any).amount}
                  </p>
                </div>
              </section>

              {/* Estado logístico / extra */}
              <section className="mt-4 text-sm space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  {t("logistic")}
                </p>
                <p className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                  {(document as any).expiration_status || "-"}
                </p>
              </section>

              {/* Observaciones si existen */}
              {(document as any).observation && (
                <section className="mt-4 text-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    {t("observation") || "Observación"}
                  </p>
                  <p className="p-3 rounded-lg bg-gray-50 text-gray-800 whitespace-pre-wrap">
                    {(document as any).observation}
                  </p>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium transition-colors"
          >
            {t("close") || "Cerrar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailsModal;
