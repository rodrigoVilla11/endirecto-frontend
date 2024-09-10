import React from "react";

const ArticleName = ({name, id} : any) => {
  return (
    <div className="text-xs p-2">
      <p className="font-bold mb-6">{id}</p>
      <p className="font-light mb-2">{name}</p>
    </div>
  );
};

export default ArticleName;
