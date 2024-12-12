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
      className=" bg-transparent flex items-center justify-center m-6"
    >
      <img
        src={logo}
        alt={name}
        className="w-20 h-20 object-contain object-center bg-transparent "
      />
    </div>
  );
};

export default BrandsCards;
