import { useFilters } from "@/app/context/FiltersContext";
import { useMobile } from "@/app/context/ResponsiveContext";
import { useRouter } from "next/navigation";
import React from "react";

interface ButtonsImageProps {
  logo: string;
  name: string;
}

const ButtonsImage: React.FC<ButtonsImageProps> = ({ logo, name }) => {
  const { setTags } = useFilters();
  const router = useRouter();
  const { isMobile } = useMobile();

  const handleRedirect = (path: string, id: string) => {
    router.push(path);
    setTags(id);
  };

  return (
    <button
      onClick={() => handleRedirect("/catalogue", name)}
      className="
        group relative w-full h-full
        flex items-center justify-center
        bg-white/5 backdrop-blur
        border border-white/10
        transition-all duration-300
        hover:border-[#E10600]/40
        hover:bg-white/10
        focus:outline-none
      "
      aria-label={name}
    >
      {/* Imagen */}
      <img
        src={logo}
        alt={name}
        className={`
          ${isMobile ? "w-[70%] h-[70%]" : "w-[80%] h-[80%]"}
          object-contain
          transition-transform duration-300
          group-hover:scale-105
        `}
      />

      {/* Overlay nombre (solo hover desktop) */}
      <div className="
        pointer-events-none
        absolute inset-0
        flex items-end justify-center
        opacity-0 group-hover:opacity-100
        transition-opacity duration-300
        bg-gradient-to-t from-black/60 to-transparent
      ">
        <span className="
          mb-3 px-3 py-1
          text-xs font-bold uppercase tracking-wider
          text-white
          bg-[#E10600]/90
          rounded-full
        ">
          {name}
        </span>
      </div>
    </button>
  );
};

export default ButtonsImage;
