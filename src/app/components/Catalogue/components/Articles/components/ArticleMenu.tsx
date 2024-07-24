import React from 'react'
import { CiHeart, CiMenuKebab } from "react-icons/ci";
import { TbSquares } from "react-icons/tb";
import { GoTag } from "react-icons/go";

const ArticleMenu = () => {
  return (
    <div className="p-2 flex justify-between items-center text-lg">
    <button>
      <CiHeart />
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
  )
}

export default ArticleMenu