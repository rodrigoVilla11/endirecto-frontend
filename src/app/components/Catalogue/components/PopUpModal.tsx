"use client";
import { useGetMarketingByFilterQuery } from "@/redux/services/marketingApi";
import React, { useEffect } from "react";
import { IoMdClose } from "react-icons/io";

const PopUpModal = ({
  closeModal,
  handleRedirect,
}: {
  closeModal: () => void;
  handleRedirect: any;
}) => {
  const filterBy = "popups";
  const {
    data: marketing,
    error,
    isLoading,
  } = useGetMarketingByFilterQuery({ filterBy });

  const marketingData =
    Array.isArray(marketing) && marketing.length > 0 ? marketing[0] : null;

  // Si la data ya se cargó y el popup no está habilitado, se cierra automáticamente
  useEffect(() => {
    if (!isLoading && marketingData?.popups && !marketingData.popups.enable) {
      closeModal();
    }
  }, [isLoading, marketingData, closeModal]);

  if (marketingData?.popups && !marketingData.popups.enable) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        {/* Botón de cierre */}
        <div className="flex justify-end pb-3">
          <button
            onClick={closeModal}
            className="
            w-8 h-8 flex items-center justify-center
            rounded-full
            bg-white/10 text-white
            hover:bg-[#E10600]/20 hover:text-[#E10600]
            transition-all
          "
            aria-label="Cerrar"
          >
            <IoMdClose className="text-lg" />
          </button>
        </div>

        {/* Contenido */}
        {marketingData?.popups?.web && (
          <div
            onClick={() => handleRedirect(marketingData.popups.url)}
            className="
            cursor-pointer
            rounded-2xl overflow-hidden
            border border-white/10
            hover:border-[#E10600]/40
            transition-all
          "
          >
            <img
              src={marketingData.popups.web}
              alt={marketingData.popups.name || "Popup"}
              className="w-full h-auto object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PopUpModal;
