import React from 'react';
import { CiMenuKebab } from "react-icons/ci";
import { TbSquares } from "react-icons/tb";
import { GoTag } from "react-icons/go";
import { FaHeart } from 'react-icons/fa';

const ArticleMenu = ({ onAddToFavourites, isFavourite }: { onAddToFavourites: () => void, isFavourite: boolean }) => {
  return (
    <div className="p-2 flex justify-between items-center text-lg">
      <button onClick={onAddToFavourites}>
        <FaHeart className={`transition-colors duration-300 ${isFavourite ? 'text-red-500' : 'text-gray-600'}`} />
      </button>
      <div className="flex gap-4 items-center">
        <button>
          <TbSquares />
        </button>
        <button>
          <GoTag />
        </button>
        <button>
          <CiMenuKebab />
        </button>
      </div>
    </div>
  );
};

export default ArticleMenu;
