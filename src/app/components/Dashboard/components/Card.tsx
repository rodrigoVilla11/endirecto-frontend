import React from "react";

interface CardProps {
  logo: React.ReactNode;
  title: any;
  subtitle?: any;
  text?: any;
  color?: string; 
  className?: string;
}

const Card: React.FC<CardProps> = ({
  logo,
  title,
  subtitle,
  text,
  color = "gray",
  className = "",
}) => {
  return (
    <div
      className={`
        w-72 h-36 bg-white rounded-xl border shadow-sm 
        hover:shadow-md transition-all cursor-pointer 
        flex flex-col justify-between p-4
        border-b-8
        ${className}
      `}
      style={{ borderBottomColor: color }}
    >
      {/* ICONO + TITULO */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-3xl">
          {logo}
        </div>

        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-gray-900 leading-tight">
            {title}
          </h3>

          {subtitle && (
            <p className="text-sm text-gray-600 mt-0.5 leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* TEXTO INFERIOR */}
      {text && (
        <div className="w-full flex justify-center items-center pb-1">
          <p className="text-center text-xs sm:text-sm text-gray-700 font-medium">
            {text}
          </p>
        </div>
      )}
    </div>
  );
};

export default Card;
