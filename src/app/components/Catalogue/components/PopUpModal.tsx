"use client";
import { useGetMarketingByFilterQuery } from "@/redux/services/marketingApi";
import React from "react";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Botón de cierre */}
        <div className="flex justify-end pb-4">
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
          >
            <IoMdClose />
          </button>
        </div>

        {/* Contenido del popup */}
        {marketingData?.popups?.web && (
          <div
            onClick={() => handleRedirect(marketingData.popups.url)}
            className="cursor-pointer pt-4" 
          >
            <img
              src={marketingData.popups.web}
              alt={marketingData.popups.name || "Popup"}
              className="w-full h-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PopUpModal;
