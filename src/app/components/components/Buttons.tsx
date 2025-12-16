import React from "react";

interface ButtonsProps {
  logo?: React.ReactNode;
  title: string;
  onClick?: () => void;
  red?: boolean;
  disabled?: boolean;
}

const Buttons = ({ title, logo, onClick, red, disabled }: ButtonsProps) => {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`
    flex justify-center items-center gap-1
    h-8 px-3 rounded-xl
    text-sm font-semibold
    transition-all duration-200
    border
    ${
      disabled
        ? "opacity-50 cursor-not-allowed bg-white/5 border-white/10 text-white/50"
        : red
        ? "border-[#E10600] text-[#E10600] hover:bg-[#E10600] hover:text-white"
        : "border-white/20 text-white hover:bg-white/10"
    }
  `}
    >
      {logo && <span className="flex items-center">{logo}</span>}
      <span>{title}</span>
    </button>
  );
};

export default Buttons;
