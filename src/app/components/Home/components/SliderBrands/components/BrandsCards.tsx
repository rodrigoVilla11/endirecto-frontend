import React from "react";

const BrandsCards = ({ logo }: any) => {
  return (
    <div className="h-32 w-24 shadow-2xl flex justify-center items-center p-1 bg-white"> {/* Añadido fondo blanco para mayor visibilidad */}
      <img
        src={logo}
        alt="logo-sliderBrands"
        className="h-full w-full object-contain" // Asegúrate de que el logo mantenga su proporción
      />
    </div>
  );
};

export default BrandsCards;
