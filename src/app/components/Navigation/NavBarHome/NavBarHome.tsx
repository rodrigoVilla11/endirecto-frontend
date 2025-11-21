import React from 'react'
import Logo from './components/Logo'
import Buttons from './components/Buttons'

const NavBarHome = () => {
  return (
    <nav className='w-full h-24 sm:h-20 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 fixed z-50 flex justify-around items-center top-0 shadow-2xl'>
      <Logo/>
      <Buttons />
    </nav>
  )
}

export default NavBarHome