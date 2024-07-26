import React from "react";
import Buttons from "./Buttons";

const Header = ({ headerBody }: any) => {
  return (
    <div className="h-auto m-5 bg-white p-2 flex flex-col justify-between text-sm">
      <div className="flex justify-end items-center w-full h-1/2 border-b-2 p-2 gap-4 ">
        {headerBody.buttons.map((button: any, index: any) => (
          <Buttons key={index} logo={button.logo} title={button.title} />
        ))}
      </div>
      {headerBody.secondSection && <div className="flex justify-start items-center w-full h-1/2 border-b-2 p-2 py-4 gap-4">
      <p className="font-bold ">{headerBody.secondSection.title}<span className="font-bold pl-4 text-2xl">{headerBody.secondSection.amount}</span></p></div>}
      <div className="flex justify-start items-center w-full h-1/2 p-2 gap-4">
        {headerBody.filters.map((filter: any, index: any) => (
          <div key={index}>{filter.content}</div>
        ))}
      </div>
      <div className="w-full flex justify-end text-xs text-gray-500">
        {headerBody.results}
      </div>
    </div>
  );
};

export default Header;
