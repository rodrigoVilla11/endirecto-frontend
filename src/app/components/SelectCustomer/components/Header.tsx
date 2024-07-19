import React from "react";
import { AiOutlineDownload } from "react-icons/ai";
import { FiMapPin } from "react-icons/fi";
import ButtonOnOff from "./ButtonOnOff";
import Buttons from "./Buttons";

const Header = () => {
   
  return (
    <div className="h-36 m-5 bg-white p-2 flex flex-col justify-between text-sm">
        <div className="flex justify-end items-center w-full h-1/2 border-b-2 p-2 gap-4 ">
        <Buttons logo={<FiMapPin />} title={"View On Map"}/>
        <Buttons logo={<AiOutlineDownload />} title={"Download"}/>
        </div>
        <div className="flex justify-start items-center w-full h-1/2 p-2 gap-4">
        <button className="flex justify-center items-center border border-black gap-1 p-2 rounded-md h-8">Seller...</button>
        <input placeholder="Search..." className="border border-gray-300 p-2 rounded-md outline-none"/>
        <ButtonOnOff title={"Debt"}/>
        <ButtonOnOff title={"Expired D."}/> VER DE CAMBIAR
        </div>
        <div className="w-full flex justify-end text-xs text-gray-500">
        2203 Results
      </div>
    </div>
  );
};

export default Header;
