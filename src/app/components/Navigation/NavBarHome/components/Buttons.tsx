import { useRouter } from 'next/navigation';
import React from 'react';
import { BiSearchAlt } from "react-icons/bi";
import { GiUsaFlag } from "react-icons/gi";

const Buttons = () => {
  const router = useRouter();

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

  return (
    <div className='flex items-center justify-between text-sm text-white gap-6'>
      <a href="#home" onClick={(e) => handleScroll(e, 'home')}>Home</a>
      <a href="#brands" onClick={(e) => handleScroll(e, 'brands')}>Brands</a>
      <a href="#tags" onClick={(e) => handleScroll(e, 'tags')}>Tags</a>
      <a href="#articles" onClick={(e) => handleScroll(e, 'articles')}>Articles</a>
      <a href="#contact" onClick={(e) => handleScroll(e, 'contact')}>Contact</a>
      <button className='text-xl'><GiUsaFlag/></button>
      <button onClick={() => handleRedirect("/login")}>Sign In</button>
      <button className='text-xl'><BiSearchAlt/></button>
    </div>
  );
};

export default Buttons;