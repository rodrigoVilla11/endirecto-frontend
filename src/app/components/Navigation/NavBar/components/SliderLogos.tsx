"use client";
import React, { useState, useEffect } from "react";

const SliderLogos = () => {
  const logos = [
    "/logo-elf.svg",
    "/mahle.svg",
    "/elf-moto.svg",
    "/dunlop.svg",
    "/falken-tire.svg",
    "/totalenergies.svg",
    "/corven-autopartes.png",
    "/ctr.png",
    "/moura.png",
    "/zetta.png",
  ];
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogoIndex((prevIndex) => (prevIndex + 1) % logos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [logos.length]);

  return (
    <div className="w-64 h-full flex justify-center items-center gap-4">
      {/* <img src="LOGO-DMA.png" alt="logo-navbar" className="h-16" /> */}
      <div className="h-16 w-32 flex justify-center items-center">
        <img
          src={logos[currentLogoIndex]}
          alt="logo-navbar"
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
};

export default SliderLogos;
