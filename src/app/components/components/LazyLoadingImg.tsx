import { useState } from "react";

const LazyImage = ({ src, alt }: any) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="h-10 w-auto relative">
      {!isLoaded && (
        <div
          className="
          absolute inset-0
          bg-white/10 backdrop-blur
          animate-pulse
          rounded-md
          border border-white/10
        "
        />
      )}

      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={`
        h-full w-auto object-contain
        transition-opacity duration-300
        ${isLoaded ? "opacity-100" : "opacity-0"}
      `}
      />
    </div>
  );
};

export default LazyImage;
