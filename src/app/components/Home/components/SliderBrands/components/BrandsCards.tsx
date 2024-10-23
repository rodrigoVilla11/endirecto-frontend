import { useFilters } from "@/app/context/FiltersContext";
import { useRouter } from "next/navigation";
import React from "react";

interface BrandsCardsProps {
  name: string;
  logo: string;
  id: string;
  isAuthenticated: boolean;
}

const BrandsCards: React.FC<BrandsCardsProps> = ({ name, logo, id, isAuthenticated }) => {
  const { setBrand } = useFilters();

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
      onClick={() => handleRedirect(isAuthenticated ? `/catalogue` : `/catalogues`, id)}
      className="w-24 h-24 bg-white shadow-2xl flex items-center justify-center"
    >
      <img
        src={logo}
        alt={name}
        className="w-20 h-20 object-contain object-center bg-white "
      />
    </div>
  );
};

export default BrandsCards;
