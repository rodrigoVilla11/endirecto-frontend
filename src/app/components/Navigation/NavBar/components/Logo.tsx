import { useSideMenu } from '@/app/context/SideMenuContext';
import React from 'react'

const Logo = () => {
  const { isOpen } = useSideMenu();
  return (
    <div>
      <img src="dma.png" alt="logo-navbar" className={`${isOpen ? "h-20 pl-4 pt-2" : "h-10"} transition-all duration-300`} />
    </div>
  )
}

export default Logo
