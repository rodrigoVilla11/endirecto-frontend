import React from "react";
import Buttons from "./Buttons";

const Header = ({ headerBody }:any) => {
  return (
    <div className="h-36 m-5 bg-white p-2 flex flex-col justify-between text-sm">
      <div className="flex justify-end items-center w-full h-1/2 border-b-2 p-2 gap-4 ">
        {headerBody.buttons.map((button : any, index : any) => (
          <Buttons key={index} logo={button.logo} title={button.title} />
        ))}
      </div>
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
