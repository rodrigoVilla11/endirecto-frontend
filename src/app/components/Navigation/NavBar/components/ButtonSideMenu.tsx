import { useSideMenu } from '@/app/context/SideMenuContext';
import React from 'react'
import { IoMenu } from "react-icons/io5";

const ButtonSideMenu = () => {
    const { isOpen, setIsOpen, setOpenSubCategory } = useSideMenu();
  
    const handleOpen = () => {
        setIsOpen(!isOpen)
        setOpenSubCategory(null)
    }
  return (
    <button onClick={handleOpen} id="navbar-button">
      <IoMenu className='text-white text-xl'/>
    </button>
  )
}

export default ButtonSideMenu
