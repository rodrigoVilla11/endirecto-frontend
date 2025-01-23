import React from "react";

const Card = ({ logo, title, subtitle, text }: any) => {
  return (
    <div className="w-90 sm:w-72 h-40 p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="space-y-4">
        <div className="flex space-x-4 items-center">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
            {logo}
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>

        <div className="h-1/2 flex justify-center items-center font-semibold text-lg text-gray-900">
          {text && <p className="text-xs sm:text-sm text-center">{text}</p>}
        </div>
      </div>
    </div>
  );
};

export default Card;
