import React from "react";

const Input = ({ placeholder, value, onChange, onKeyDown }: any) => {
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      className="
      w-full max-w-sm
      rounded-xl
      p-2 md:p-3
      text-xs md:text-sm
      bg-white/10 text-white
      border border-white/20
      placeholder:text-white/40
      outline-none
      transition-all
      focus:border-[#E10600]
      focus:ring-1 focus:ring-[#E10600]/40
    "
    />
  );
};

export default Input;
