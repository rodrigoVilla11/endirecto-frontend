import React from "react";

const ArticleName = ({name, noName, code} : any) => {
  return (
    <div className={`flex flex-col ${noName ? "h-8" : "h-14"}`}>
      <p className="text-xs font-semibold text-gray-700 truncate" title={code}>
        {code}
      </p>
      {!noName && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2" title={name}>
          {name}
        </p>
      )}
    </div>
  );
};

export default ArticleName;
