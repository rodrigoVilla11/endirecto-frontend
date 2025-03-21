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
    if (path) {
      router.push(path);
      setTags(id);
    }
  };

  return (
    <img
      src={logo}
      alt={name}
      className={`${isMobile ? "w-[70%] h-[70%]" : "w-[80%] h-[80%]"} object-fill cursor-pointer rounded-md`}
      onClick={() => handleRedirect(`/catalogue`, name)}
    />
  );
};

export default ButtonsImage;