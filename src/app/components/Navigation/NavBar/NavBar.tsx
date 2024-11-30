import React from 'react'
import Search from './components/Search'
import ButtonSideMenu from './components/ButtonSideMenu'
import Logo from './components/Logo'
import SliderLogos from './components/SliderLogos'
import ButtonsIcons from './components/ButtonsIcons'
import Profile from './components/Profile'

const NavBar = ({setIsOpen, isOpen} : any) => {
  return (
    <nav className='w-full h-20 bg-header-color fixed z-50 flex justify-between px-10'>
      <div className='flex items-center gap-4'>
      <Logo />
      <ButtonSideMenu setIsOpen={setIsOpen} isOpen={isOpen}/>
      <Search />
      </div>
      <div className='flex items-center'>
        <SliderLogos />
      </div>
      <div className='flex items-center gap-4'>
        <ButtonsIcons />
        <Profile />
      </div>
    </nav>
  )
}

export default NavBar
