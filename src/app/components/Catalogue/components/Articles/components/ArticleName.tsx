import React from "react";
import { useMobile } from "@/app/context/ResponsiveContext";

const ArticleName = ({ name, noName, code }: any) => {
  const { isMobile } = useMobile();

  return (
    <div className={`flex flex-col ${noName ? "h-6" : isMobile ? "h-12" : "h-14"}`}>
      <p className={`${isMobile ? 'text-[11px]' : 'text-xs'} font-bold text-gray-900 truncate`} title={code}>
        {code}
      </p>
      {!noName && (
        <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-600 mt-0.5 line-clamp-2`} title={name}>
          {name}
        </p>
      )}
    </div>
  );
};

export default ArticleName;