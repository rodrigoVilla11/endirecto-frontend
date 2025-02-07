import React from "react";

const Input = ({ placeholder, value, onChange, onKeyDown }: any) => {
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      className="w-full max-w-sm border border-gray-300 rounded-md p-2 md:p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
    />
  );
};

export default Input;
