import React from "react";

const Input = ({ placeholder, value, onChange, onKeyDown }: any) => {
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      className="border border-gray-300 p-2 rounded-md outline-none"
    />
  );
};

export default Input;
