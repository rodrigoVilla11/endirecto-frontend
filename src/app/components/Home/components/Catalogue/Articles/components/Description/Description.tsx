import Tables from "@/app/components/Catalogue/components/Articles/components/Description/components/Tables";
import React from "react";

const Description = ({ article, description }: any) => {
  return (
    <div className="w-80 text-white">
      <h3 className="font-extrabold text-lg mb-2">
        Description<span className="text-[#E10600]">.</span>
      </h3>

      <p className="text-sm text-white/70 leading-relaxed mb-4">
        {description}
      </p>

      <Tables article={article} />
    </div>
  );
};

export default Description;
