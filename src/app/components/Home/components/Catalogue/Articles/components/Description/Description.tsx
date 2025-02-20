import Tables from "@/app/components/Catalogue/components/Articles/components/Description/components/Tables";
import React from "react";

const Description = ({ article, description }: any) => {
  return (
    <div className="w-80">
      <h3 className="font-bold">Description</h3>
      <p className="font-light">{description}</p>
      <Tables article={article}/>
    </div>
  );
};

export default Description;
