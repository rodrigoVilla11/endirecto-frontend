import React from "react";

const CardShortcuts = ({ title, logo }: any) => {
  return (
    <button className="bg-white h-24 w-72 m-5 shadow-lg hover:shadow-2xl p-4">
      <div className="flex h-1/2 items-center justify-between">
        <h3 className="text-sm">{title}</h3>
        <div className="rounded-full h-10 w-10 bg-secondary text-white flex justify-center items-center text-2xl m-5">
          {logo}
        </div>
      </div>
    </button>
  );
};

export default CardShortcuts;
