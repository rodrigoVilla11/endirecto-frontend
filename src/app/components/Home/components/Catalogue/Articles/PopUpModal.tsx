"use client";
import { useGetMarketingByFilterQuery } from "@/redux/services/marketingApi";
import React from "react";
import { IoMdClose } from "react-icons/io";

const PopUpModal = ({
  closeModal,
  handleRedirect,
}: {
  closeModal: () => void;
  handleRedirect: (url: string) => void;
}) => {
  const filterBy = "popups";
  const { data: marketing } = useGetMarketingByFilterQuery({ filterBy });

  const marketingData =
    Array.isArray(marketing) && marketing.length > 0 ? marketing[0] : null;

  const img = marketingData?.popups?.web;
  const url = marketingData?.popups?.url;

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex justify-end pb-3">
        <button
          type="button"
          onClick={closeModal}
          className="
            h-9 w-9 rounded-xl
            bg-white/5 border border-white/10
            text-white/80
            hover:text-white hover:bg-white/10
            hover:border-[#E10600]/40
            transition-all
            flex items-center justify-center
          "
          aria-label="Cerrar"
        >
          <IoMdClose className="text-xl" />
        </button>
      </div>

      {/* Body */}
      {img && (
        <button
          type="button"
          onClick={() => url && handleRedirect(url)}
          className="
            w-full
            rounded-2xl overflow-hidden
            bg-white/5 border border-white/10
            hover:border-[#E10600]/40
            transition-all
            group
          "
        >
          <img
            src={img}
            alt={marketingData?.popups?.name || "Popup"}
            className="w-full h-auto block group-hover:scale-[1.01] transition-transform duration-300"
          />
          <div className="h-1 w-full bg-[#E10600] opacity-90" />
        </button>
      )}
    </div>
  );
};

export default PopUpModal;
