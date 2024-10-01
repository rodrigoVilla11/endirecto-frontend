"use client";
import React from "react";

const ButtonOnOff = ({ title, active, onChange }: {
  title: string;
  active?: boolean;
  onChange?: () => void;
}) => {
  return (
    <div className="flex gap-2 justify-center items-center">
      <button
        onClick={onChange}
        className={`border flex ${active ? 'bg-black justify-end' : 'bg-white justify-start'} items-center border-gray-400 h-6 w-12 rounded-xl px-1 transition-all duration-300`}
      >
        <div className={`h-4 w-4 rounded-full ${active ? 'bg-white' : 'bg-gray-400'}`}></div>
      </button>
      <p>{title}</p>
    </div>
  );
};

export default ButtonOnOff;