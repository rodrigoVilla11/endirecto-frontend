"use client";
import React from "react";

interface ButtonOnOffProps {
  title: string;
  active?: boolean;
  onChange?: (newState: boolean) => void;
}

const ButtonOnOff: React.FC<ButtonOnOffProps> = ({
  title,
  active = false,
  onChange,
}) => {
  const handleClick = () => {
    if (onChange) {
      onChange(!active);
    }
  };

  return (
    <div className="flex gap-2 justify-center items-center min-w-[44px] md:min-w-[60px]">
      <button
        onClick={handleClick}
        aria-pressed={active}
        className={`
        relative
        flex items-center
        h-6 w-12 rounded-full px-1
        transition-all duration-300
        border
        ${
          active
            ? "bg-[#E10600] border-[#E10600] justify-end"
            : "bg-white/10 border-white/20 justify-start"
        }
      `}
      >
        <div
          className={`
          h-4 w-4 rounded-full
          transition-all duration-300
          shadow-md
          ${active ? "bg-white" : "bg-white/40"}
        `}
        />
      </button>

      <p className="text-sm font-medium text-white/80 select-none">{title}</p>
    </div>
  );
};

export default ButtonOnOff;
