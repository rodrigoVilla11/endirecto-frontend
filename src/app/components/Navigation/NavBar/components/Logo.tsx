import { useSideMenu } from '@/app/context/SideMenuContext';
import React from 'react'

const Logo = () => {
  const { isOpen } = useSideMenu();
  return (
    <div>
      <img src="https://res.cloudinary.com/db7kbwl5n/image/upload/v1727811015/Mask_group_1_grmoph.png" alt="logo-navbar" className={`${isOpen ? "h-20 pl-4 pt-2" : "h-10"} transition-all duration-300`} />
    </div>
  )
}

export default Logo
