import React from "react";

interface CardProps {
  logo: React.ReactNode;
  title: any;
  subtitle?: any;
  text?: any;
  color?: string;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  logo,
  title,
  subtitle,
  text,
  color = "#808080", // Purple-500 por defecto
  className = "",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
      group relative
      w-[280px] h-[180px]
      bg-white/5 backdrop-blur
      rounded-2xl border border-white/10
      shadow-lg hover:shadow-2xl
      transition-all duration-300
      cursor-pointer overflow-hidden
      hover:scale-[1.03] hover:border-[#E10600]/35
      flex flex-col
      ${className}
    `}
    >
      {/* Barra superior */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-300 group-hover:h-2"
        style={{ backgroundColor: color }}
      />

      {/* Contenido */}
      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          {/* Icon box */}
          <div
            className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${color}22, ${color}10)`,
              border: `1px solid ${color}55`,
            }}
          >
            {logo}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-extrabold text-white leading-tight mb-1 transition-colors">
              {title}
            </h3>

            {subtitle && (
              <p className="text-sm text-white/70 leading-tight font-semibold">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {text && (
          <div className="pt-3 border-t border-white/10">
            <p className="text-center text-sm text-white/70 font-semibold leading-relaxed">
              {text}
            </p>
          </div>
        )}
      </div>

      {/* Glow hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, transparent 0%, ${color}14 50%, transparent 100%)`,
        }}
      />

      {/* Flecha */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border border-white/10"
          style={{ backgroundColor: color }}
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            strokeWidth="2"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Card;
