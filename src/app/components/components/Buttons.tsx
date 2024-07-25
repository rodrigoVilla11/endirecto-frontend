import React from 'react'

const Buttons = ({title, logo} : any) => {
  return (
    <button className="flex justify-center items-center border border-black gap-1 p-2 rounded-md h-8 hover:bg-primary hover:text-white">{logo && logo}{title}</button>
  )
}

export default Buttons