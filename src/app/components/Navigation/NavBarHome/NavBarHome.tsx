import React from 'react'
import Logo from './components/Logo'
import Buttons from './components/Buttons'

const NavBarHome = () => {
  return (
    <nav className='w-full  h-24 sm:h-16 bg-header-color fixed z-50 flex justify-around items-center top-0'>
      <Logo/>
      <Buttons />
    </nav>
  )
}

export default NavBarHome
