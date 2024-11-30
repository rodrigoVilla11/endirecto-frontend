import React from "react";

const ArticleName = ({name, id} : any) => {
  return (
    <div className="p-4 h-24">
      <p className="text-xs font-semibold mb-2">{id}</p>
      <p className="text-xs text-gray-500 mb-2">{name}</p>
    </div>
  );
};

export default ArticleName;
