"use client";
import { useGetMarketingByFilterQuery } from "@/redux/services/marketingApi";
import React, { useState, useEffect } from "react";

const SliderLogos = () => {
  const filterBy = "header";

  const {
    data: logos,
    error,
    isLoading,
    refetch,
  } = useGetMarketingByFilterQuery({ filterBy });

  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);

  // Cambiar imagen cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogoIndex((prevIndex) => {
        return logos ? (prevIndex + 1) % logos.length : prevIndex;
      });
    }, 3000);

    return () => clearInterval(interval); // Limpiar intervalo al desmontar el componente
  }, [logos]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading logos</p>;
  if (!logos || logos.length === 0) {
    return <p>No logos available</p>;
  }

  return (
    <div className="w-64 h-full flex justify-center items-center gap-4">
      <div className="h-12 w-32 flex justify-center items-center">
        <img
          src={logos[currentLogoIndex].header.img}
          alt={`Logo ${currentLogoIndex}`}
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
};

export default SliderLogos;
