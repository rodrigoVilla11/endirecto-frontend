import React from "react";
import Buttons from "./Buttons";

const Header = ({ headerBody }: any) => {
  return (
    <div className="h-auto m-2 md:m-5 bg-white p-4 md:p-6 flex flex-col gap-4 mx-auto shadow-lg rounded-lg">
      {/* Sección de Botones */}
      <div className="flex flex-wrap md:flex-nowrap justify-end items-center w-full border-b border-gray-300 pb-4 gap-3 overflow-x-auto">
        {headerBody.buttons.map((button: any, index: any) => (
          <Buttons
            key={index}
            logo={button.logo}
            title={button.title}
            onClick={button.onClick}
            red={button.red}
          />
        ))}
      </div>

      {/* Segunda Sección */}
      {headerBody.secondSection && (
        <div className="flex flex-col md:flex-row justify-between items-center w-full border-b border-gray-300 pb-4 gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
            <p className="font-bold text-sm md:text-base">
              {headerBody.secondSection.title}
              <span className="font-bold pl-2 md:pl-4 text-lg md:text-2xl text-blue-600">
                {headerBody.secondSection.amount}
              </span>
            </p>
          </div>
          {headerBody.secondSection.total && (
            <div className="flex justify-center items-center w-full md:w-auto font-bold text-center text-gray-700 text-sm md:text-base">
              {headerBody.secondSection.total}
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap md:flex-nowrap justify-start items-center w-full gap-3 p-2 bg-gray-100 rounded-md">
        {headerBody.filters.map((filter: any, index: any) => (
          <div key={index} className="w-full md:w-auto">
            {filter.content}
          </div>
        ))}
      </div>

      {/* Resultados */}
      <div className="w-full flex justify-end text-gray-500 text-xs md:text-sm">
        {headerBody.results}
      </div>
    </div>
  );
};

export default Header;
