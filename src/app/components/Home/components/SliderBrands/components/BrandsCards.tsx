import { useFilters } from "@/app/context/FiltersContext";
import { useMobile } from "@/app/context/ResponsiveContext";
import { useRouter } from "next/navigation";
import React from "react";

interface BrandsCardsProps {
  name: string;
  logo: string;
  id: string;
  isAuthenticated: boolean;
}

const BrandsCards: React.FC<BrandsCardsProps> = ({
  name,
  logo,
  id,
  isAuthenticated,
}) => {
  const { setBrand } = useFilters();
  const { isMobile } = useMobile();
  const router = useRouter();

  const handleRedirect = (path: string, id: string) => {
    router.push(path);
    const encodedId = encodeURIComponent(id);
    setBrand(encodedId);
  };

  return (
    <button
      type="button"
      onClick={() =>
        handleRedirect(isAuthenticated ? `/catalogue` : `/catalogues`, id)
      }
      className="
        group w-full
        flex flex-col items-center justify-center
        rounded-3xl
        bg-white/5 backdrop-blur
        border border-white/10
        px-4 py-6
        transition-all duration-300
        hover:border-[#E10600]/40 hover:bg-white/10
        focus:outline-none
      "
      aria-label={name}
    >
      <img
        src={logo}
        alt={name}
        className={`
          object-contain object-center
          ${isMobile ? "w-24 h-24 sm:w-32 sm:h-32" : "w-32 h-32"}
          transition-transform duration-300
          group-hover:scale-105
        `}
      />

      {/* Nombre (opcional, solo desktop/hover) */}
      <span className="mt-4 text-xs font-bold uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">
        {name}
      </span>

      {/* Acento marca */}
      <div className="mt-3 h-1 w-12 rounded-full bg-[#E10600] opacity-80" />
    </button>
  );
};

export default BrandsCards;
