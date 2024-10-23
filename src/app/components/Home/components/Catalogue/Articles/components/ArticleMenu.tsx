import React from 'react';
import { CiMenuKebab } from "react-icons/ci";
import { TbSquares } from "react-icons/tb";
import { GoTag } from "react-icons/go";

const ArticleMenu = () => {
  return (
    <div className="w-full flex justify-end items-center px-4 py-2">
      <div className="flex items-center space-x-4">
        <button className="flex items-center justify-center">
          <TbSquares className='text-gray-500 cursor-pointer text-xl'/>
        </button>
        <button className="flex items-center justify-center">
          <GoTag className='text-gray-500 cursor-pointer text-xl'/>
        </button>
      </div>
    </div>
  );
};

export default ArticleMenu;