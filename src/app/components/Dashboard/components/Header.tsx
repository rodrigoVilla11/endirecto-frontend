import { useAuth } from '@/app/context/AuthContext';
import React from 'react'

const Header = () => {
  const { userData } = useAuth();
  const firstLetter = userData?.username.charAt(0)
  return (
    <div className='h-44 m-5 bg-white  p-10 flex justify-between'>
        <div className='flex items-center gap-4'>
      <div className='rounded-full h-14 w-14 bg-secondary text-white flex justify-center items-center text-2xl'>
          <p>{firstLetter}</p>
        </div>
        <div>
            <p>Welcome to Distribuidora Mayorista de Autopiezas</p>
            <p className='text-2xl mt-4'>{userData?.username}</p>
            <p>{userData?.role.toUpperCase()}</p>
        </div>
        </div>
        <div className='w-1/3 flex flex-col justify-center items-center'>
            <p>NOTIFICATIONS</p>
            <p className='text-2xl mt-4'>0</p>
        </div>
    </div>
  )
}

export default Header
