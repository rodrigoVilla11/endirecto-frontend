import React from "react";
interface ButtonsProps {
  logo?: React.ReactNode;
  title: string;
  onClick?: () => void;
  red?: boolean;
}

const Buttons = ({ title, logo, onClick, red }: ButtonsProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex justify-center items-center border border-black gap-1 p-2 rounded-md h-8 hover:bg-primary hover:text-white ${red && "border-red-600 text-red-600"}`}
    >
      {logo && logo}
      {title}
    </button>
  );
};

export default Buttons;
