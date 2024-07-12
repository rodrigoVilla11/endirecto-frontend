'use client'
import React, { useState } from 'react';
import { IoIosArrowDown } from "react-icons/io";
import { IoPersonOutline } from "react-icons/io5";
import {  FaPowerOff } from "react-icons/fa";

const Profile = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="relative">
      <button className='flex justify-center items-center gap-1' onClick={toggleMenu}>
        <div className='rounded-full h-10 w-10 bg-white flex justify-center items-center'>
          <p>R</p>
        </div>
        <div className='flex justify-center items-center text-white'>
          <p>Rodrigo Villarreal</p>  
          <IoIosArrowDown />
        </div>   
      </button>
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg">
          <ul>
            <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer flex items-center justify-center gap-1"><IoPersonOutline /> My Profile</li>
            <hr />
            <li className="px-4 py-2 hover:bg-gray-200 cursor-pointer flex items-center justify-center gap-1 text-red-600"><FaPowerOff /> Log Out</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default Profile;
