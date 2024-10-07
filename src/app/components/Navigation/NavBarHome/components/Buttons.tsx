import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import React from "react";
import { BiSearchAlt } from "react-icons/bi";
import { GiUsaFlag } from "react-icons/gi";

const Buttons = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    id: string
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; 
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

  return (
    <div className="flex items-center justify-between text-sm text-white gap-6">
      <a href="/" onClick={(e) => handleRedirect("/")}>
        Home
      </a>
      <a href="#brands" onClick={(e) => handleScroll(e, "brands")}>
        Brands
      </a>
      <a href="#tags" onClick={(e) => handleScroll(e, "tags")}>
        Tags
      </a>
      <a href="#articles" onClick={(e) => handleScroll(e, "articles")}>
        Articles
      </a>
      <a href="#contact" onClick={(e) => handleScroll(e, "contact")}>
        Contact
      </a>
      <button className="text-xl">
        <GiUsaFlag />
      </button>
      {isAuthenticated ? <button onClick={() => handleRedirect("/dashboard")}>Dashboard</button> :<button onClick={() => handleRedirect("/login")}>Sign In</button>}
      <button className="text-xl">
        <BiSearchAlt />
      </button>
    </div>
  );
};

export default Buttons;
