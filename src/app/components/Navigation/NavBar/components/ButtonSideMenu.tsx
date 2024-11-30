import React from 'react'
import { IoMenu } from "react-icons/io5";

const ButtonSideMenu = ({setIsOpen, isOpen} : any) => {
    const handleOpen = () => {
        setIsOpen(!isOpen)
    }
  return (
    <button onClick={handleOpen}>
      <IoMenu className='text-white text-2xl'/>
    </button>
  )
}

export default ButtonSideMenu
