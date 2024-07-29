import React from 'react'
import { IoNotificationsOffOutline } from "react-icons/io5";
import { GiUsaFlag } from "react-icons/gi";
import { MdFullscreen } from "react-icons/md";
import { IoNotificationsOutline } from "react-icons/io5";
import { IoHomeOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";

const ButtonsIcons = () => {
  const router = useRouter();
  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
    }
  };
  return (
    <div className='w-60 flex items-center justify-between text-2xl text-white'>
      <IoNotificationsOffOutline className='cursor-pointer'/>
      <GiUsaFlag className='cursor-pointer'/>
      <MdFullscreen className='cursor-pointer'/>
      <IoNotificationsOutline className='cursor-pointer'/>
      <IoHomeOutline onClick={()=>handleRedirect("/home")} className='cursor-pointer'/>
    </div>
  )
}

export default ButtonsIcons
