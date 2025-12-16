import React from "react";
import { useMobile } from "@/app/context/ResponsiveContext";

const ArticleName = ({ name, noName, code }: any) => {
  const { isMobile } = useMobile();

  return (
    <div
      className={`flex flex-col ${noName ? "h-6" : isMobile ? "h-12" : "h-14"}`}
    >
      {/* Código */}
      <p
        className={`
        ${isMobile ? "text-[11px]" : "text-xs"}
        font-extrabold
        text-white
        truncate
        tracking-wide
      `}
        title={code}
      >
        {code}
      </p>

      {/* Nombre */}
      {!noName && (
        <p
          className={`
          ${isMobile ? "text-[10px]" : "text-xs"}
          text-white/70
          mt-0.5
          line-clamp-2
        `}
          title={name}
        >
          {name}
        </p>
      )}

      {/* Acento marca opcional */}
      <div className="mt-1 h-0.5 w-full bg-[#E10600] opacity-80 rounded-full" />
    </div>
  );
};

export default ArticleName;
