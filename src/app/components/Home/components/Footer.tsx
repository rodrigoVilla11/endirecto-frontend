import React from 'react'
import { IoMdPin } from "react-icons/io";
import { FaPhoneAlt, FaCalendarAlt } from "react-icons/fa";
import { MdAttachEmail } from "react-icons/md";
const Footer = () => {
  return (
    <div className='bg-primary flex justify-around items-center text-white p-10 w-full' id='contact'>
        <div className='flex flex-col gap-2 justify-center items-start text-sm'>
        <h2 className='text-xl'>Distribuidora Mayorista de Autopiezas</h2>
        <button>Home</button>
        <button>Brands</button>
        <button>Tags</button>
        <button>Articles</button>
        <button>Contact</button>
        </div>
        <div className='flex flex-col gap-2 justify-center items-start text-sm'>
            <p className='flex gap-2'><IoMdPin/>Av. Hipólito Yrigoyen 1659, Alta Gracia, Córdoba - X5186</p>
            <p className='flex gap-2'><FaPhoneAlt/>3547 47-7974</p>
            <p className='flex gap-2'><MdAttachEmail/>pedidos@distribuidoradma.com.ar</p>
            <p className='flex gap-2'><FaCalendarAlt/>Monday to Friday 9:00 to 13:00 and 14:00 to 18:00</p>
        </div>
    </div>
  )
}

export default Footer