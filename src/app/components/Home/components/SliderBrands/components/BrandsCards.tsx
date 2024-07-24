import Image from "next/image";
import React from "react";

const BrandsCards = ({logo} : any) => {
  return (
    <div className="h-32 w-24 shadow-2xl flex justify-center items-center">
      <Image
        src={logo}
        alt="logo-sliderBrands"
        className="h-full w-full object-contain"
      />
    </div>
  );
};

export default BrandsCards;
