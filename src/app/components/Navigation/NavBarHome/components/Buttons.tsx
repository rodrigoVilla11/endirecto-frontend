import React from 'react'
import { BiSearchAlt } from "react-icons/bi";
import { GiUsaFlag } from "react-icons/gi";

const Buttons = () => {
  return (
    <div className='flex items-center justify-between text-sm text-white gap-6'>
        <button>Home</button>
        <button>Brands</button>
        <button>Tags</button>
        <button>Articles</button>
        <button>Contact</button>
        <button className='text-xl'><GiUsaFlag/></button>
        <button>Sign In</button>
        <button className='text-xl'><BiSearchAlt/></button>

    </div>
  )
}

export default Buttons