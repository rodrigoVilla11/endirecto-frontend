import { useState } from "react";

const LazyImage = ({ src, alt }: any) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="h-10 w-auto relative">
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={`h-full w-auto object-contain transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
};

export default LazyImage;
