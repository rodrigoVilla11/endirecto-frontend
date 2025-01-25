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
    if (path) {
      router.push(path);
      const encodedId = encodeURIComponent(id);
      setBrand(encodedId);
    }
  };
  return (
    <div
      onClick={() =>
        handleRedirect(isAuthenticated ? `/catalogue` : `/catalogues`, id)
      }
      className="flex items-center justify-center"
    >
      <img
        src={logo}
        alt={name}
        className={`object-contain object-center ${
          isMobile ? "w-24 h-24 sm:w-32 sm:h-32" : "w-32 h-32"
        }`}
      />
    </div>
  );
};

export default BrandsCards;
