'use client'
import { useGetMarketingByFilterQuery } from '@/redux/services/marketingApi';
import React, { useState } from 'react'
import { IoMdClose } from 'react-icons/io';

const PopUpModal = ({ closeModal }: { closeModal: () => void }) => {
    const filterBy = "popups";
  const {
    data: marketing,
    error,
    isLoading,
  } = useGetMarketingByFilterQuery({ filterBy });

  const marketingData = Array.isArray(marketing) && marketing.length > 0 ? marketing[0] : null;
  return (
    <div>
        <div className="flex justify-end pb-4">
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>
     {marketingData?.popups?.web && (
        <img 
          src={marketingData.popups.web} 
          alt={marketingData.popups.name || 'Popup'} 
          className="w-full h-auto"
        />
      )}
    </div>
  )
}

export default PopUpModal