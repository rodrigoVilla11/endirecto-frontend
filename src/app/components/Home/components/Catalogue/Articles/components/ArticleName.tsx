import React from "react";

const ArticleName = ({ name, id }: any) => {
  return (
    <div className="p-4 h-24">
      <p className="text-xs font-extrabold text-white mb-1">{id}</p>

      <p className="text-xs text-white/70 leading-snug line-clamp-2">{name}</p>
    </div>
  );
};

export default ArticleName;
