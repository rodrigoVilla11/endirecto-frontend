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
    <div className="w-full h-full overflow-hidden rounded-md shadow-2xl">
      <img
        src={logo}
        alt="Tag logo"
        className="w-full h-full object-cover" 
        onClick={() => handleRedirect(`/catalogue`, name)}
      />
    </div>
  );
};

export default ButtonsImage;
