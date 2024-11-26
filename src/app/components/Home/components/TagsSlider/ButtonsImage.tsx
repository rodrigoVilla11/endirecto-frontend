import { useFilters } from "@/app/context/FiltersContext";
import { useRouter } from "next/navigation";
import React from "react";

interface ButtonsImageProps {
  logo: string;
  name: string;
}

const ButtonsImage: React.FC<ButtonsImageProps> = ({ logo, name }) => {
  const { setTags } = useFilters();
  const router = useRouter();

  const handleRedirect = (path: string, id: string) => {
    if (path) {
      router.push(path);
      setTags([id]);
    }
  };

  return (
    <img
      src={logo}
      alt={name}
      className="w-full h-full object-fill cursor-pointer bg-transparent rounded-md"
      onClick={() => handleRedirect(`/catalogue`, name)}
    />
  );
};

export default ButtonsImage;