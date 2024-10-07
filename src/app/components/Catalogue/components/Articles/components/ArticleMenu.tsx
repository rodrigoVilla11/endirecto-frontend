import React from 'react';
import { CiMenuKebab } from "react-icons/ci";
import { TbSquares } from "react-icons/tb";
import { GoTag } from "react-icons/go";
import { FaHeart } from 'react-icons/fa';

const ArticleMenu = ({ onAddToFavourites, isFavourite }: { onAddToFavourites: () => void, isFavourite: boolean }) => {
  return (
    <div className="absolute top-2 right-2 flex space-x-2 px-4">
      <button onClick={onAddToFavourites}>
        <FaHeart className={`transition-colors duration-300 ${isFavourite ? 'text-red-500' : 'text-gray-600'}  cursor-pointer`} />
      </button>
      <div className="flex gap-4 items-center">
        <button>
          <TbSquares className='text-gray-500 cursor-pointer'/>
        </button>
        <button>
          <GoTag className='text-gray-500 cursor-pointer'/>
        </button>
        <button>
          <CiMenuKebab className='text-gray-500 cursor-pointer'/>
        </button>
      </div>
    </div>
  );
};

export default ArticleMenu;
