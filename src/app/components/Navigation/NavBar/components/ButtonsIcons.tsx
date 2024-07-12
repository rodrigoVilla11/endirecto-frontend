import React from 'react'
import { IoNotificationsOffOutline } from "react-icons/io5";
import { GiUsaFlag } from "react-icons/gi";
import { MdFullscreen } from "react-icons/md";
import { IoNotificationsOutline } from "react-icons/io5";
import { IoHomeOutline } from "react-icons/io5";

const ButtonsIcons = () => {
  return (
    <div className='w-60 flex items-center justify-between text-2xl text-white'>
      <IoNotificationsOffOutline />
      <GiUsaFlag />
      <MdFullscreen />
      <IoNotificationsOutline />
      <IoHomeOutline />
    </div>
  )
}

export default ButtonsIcons
