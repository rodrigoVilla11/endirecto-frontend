"use client";
import React, { useState } from "react";

const ButtonOnOff = ({title} : any) => {
  const [isOn, setIsOn] = useState(false);

  const toggleButton = () => {
    setIsOn(!isOn);
  };

  return (
    <div className="flex gap-2 justify-center items-center">
      <button
        onClick={toggleButton}
        className={`border flex ${isOn ? 'bg-black justify-end' : 'bg-white justify-start'} items-center border-gray-400 h-6 w-12 rounded-xl px-1 transition-all duration-3000`}
      >
        <div className={`h-4 w-4 rounded-full ${isOn ? 'bg-white' : 'bg-gray-400'}`}></div>
      </button>
      <p>{title}</p>
    </div>
  );
};

export default ButtonOnOff;
