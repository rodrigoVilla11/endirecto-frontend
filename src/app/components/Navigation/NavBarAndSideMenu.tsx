'use client'
import React, {useState} from 'react'
import NavBar from './NavBar/NavBar'
import SideMenu from './SideMenu/SideMenu'
import { useSideMenu } from '@/app/context/SideMenuContext'

const NavBarAndSideMenu = () => {
  const {isOpen, setIsOpen} = useSideMenu();
  return (
    <div className={`flex ${isOpen ? 'side-menu-open' : 'side-menu-closed'}`}>
      <NavBar setIsOpen={setIsOpen} isOpen={isOpen}/>
      <SideMenu isOpen={isOpen}/>
    </div>
  )
}

export default NavBarAndSideMenu
