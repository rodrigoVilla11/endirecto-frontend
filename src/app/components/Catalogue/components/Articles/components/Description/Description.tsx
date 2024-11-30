import React from "react";
import Tables from "./components/Tables";

const Description = ({ article, description }: any) => {
  return (
    <div className="w-80">
      <h3 className="font-bold">Description</h3>
      <p className="font-light max-w-full break-words overflow-hidden max-h-36">{description}</p>
      <Tables article={article}/>
    </div>
  );
};

export default Description;
