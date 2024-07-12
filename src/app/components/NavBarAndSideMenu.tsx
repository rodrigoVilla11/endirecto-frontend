'use client'
import React, {useState} from 'react'
import NavBar from './NavBar/NavBar'
import SideMenu from './SideMenu/SideMenu'

const NavBarAndSideMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <NavBar setIsOpen={setIsOpen} isOpen={isOpen}/>
      <SideMenu isOpen={isOpen}/>
    </div>
  )
}

export default NavBarAndSideMenu
