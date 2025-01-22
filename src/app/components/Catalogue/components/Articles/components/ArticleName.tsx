import React from "react";

const ArticleName = ({name, id, noName, code} : any) => {
  return (
    <div className={`p-4 ${noName ? "h-12  rounded-lg" : "h-24"} `}>
      <p className="text-xs font-semibold mb-2">{code}</p>
      {!noName && <p className="text-xs text-gray-500 mb-2">{name}</p>}
    </div>
  );
};

export default ArticleName;
