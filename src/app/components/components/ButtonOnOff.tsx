"use client";
import React from "react";

interface ButtonOnOffProps {
  title: string;
  active?: boolean;
  onChange?: (newState: boolean) => void;
}

const ButtonOnOff: React.FC<ButtonOnOffProps> = ({ title, active = false, onChange }) => {
  const handleClick = () => {
    if (onChange) {
      onChange(!active);
    }
  };

  return (
    <div className="flex gap-2 justify-center items-center min-w-[44px] md:min-w-[60px]">
      <button
        onClick={handleClick}
        className={`border flex ${
          active ? "bg-black justify-end" : "bg-white justify-start"
        } items-center border-gray-400 h-6 w-12 rounded-xl px-1 transition-all duration-300`}
      >
        <div
          className={`h-4 w-4 rounded-full ${
            active ? "bg-white" : "bg-gray-400"
          }`}
        ></div>
      </button>
      <p>{title}</p>
    </div>
  );
};

export default ButtonOnOff;
