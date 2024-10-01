'use client'
import React, { useEffect, useState } from 'react'
import BrandsCards from './components/BrandsCards'

const SliderBrands: React.FC = () => {
  const initialLogos: string[] = [
    "logo-elf.svg",
    "mahle.svg",
    "elf-moto.svg",
    "dunlop.svg",
    "falken-tire.svg",
    "totalenergies.svg",
    "corven-autopartes.png",
    "ctr.png",
    "moura.png",
    "zetta.png",
  ];
  const [logos, setLogos] = useState<string[]>(initialLogos);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogos((prevLogos) => {
        const newLogos = [...prevLogos];
        const firstLogo = newLogos.shift();
        newLogos.push(firstLogo!);
        return newLogos;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='flex justify-center items-center p-10 gap-10 transition-transform duration-1000' id='brands'>
      {logos.map((logo, index) => (
        <BrandsCards key={index} logo={logo} />
      ))}
    </div>
  )
}

export default SliderBrands
