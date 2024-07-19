import React from 'react'

const Buttons = ({logo, title} : any) => {
  return (
    <button className="flex justify-center items-center border border-black gap-1 p-2 rounded-md h-8">{logo}{title}</button>
  )
}

export default Buttons