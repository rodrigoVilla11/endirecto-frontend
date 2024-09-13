import React from 'react'
interface ButtonsProps {
  logo?: React.ReactNode;
  title: string;
  onClick?: () => void;
}

const Buttons = ({title, logo, onClick} : ButtonsProps) => {
  return (
    <button  onClick={onClick} className="flex justify-center items-center border border-black gap-1 p-2 rounded-md h-8 hover:bg-primary hover:text-white">{logo && logo}{title}</button>
  )
}

export default Buttons