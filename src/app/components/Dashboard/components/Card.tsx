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
  color = "#a855f7", // Purple-500 por defecto
  className = "",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
    group relative 
    w-[280px]       /* ancho uniforme */
    h-[180px]                 /* ↙ alto fijo */
    bg-white rounded-2xl border-2 border-gray-200 
    shadow-lg hover:shadow-2xl 
    transition-all duration-300 
    cursor-pointer overflow-hidden
    hover:scale-[1.03] hover:border-purple-300
    flex flex-col             /* para que el contenido se acomode */
    ${className}
  `}
    >
      {/* Barra de color superior */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-300 group-hover:h-2"
        style={{ backgroundColor: color }}
      />

      {/* Contenido principal */}
      <div className="p-6 flex flex-col gap-4">
        {/* Icono + Título + Subtitle */}
        <div className="flex items-start gap-4">
          {/* Contenedor del icono con gradiente */}
          <div
            className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${color}20, ${color}10)`,
              border: `2px solid ${color}40`,
            }}
          >
            {logo}
          </div>

          {/* Título y subtítulo */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 group-hover:text-purple-600 transition-colors">
              {title}
            </h3>

            {subtitle && (
              <p className="text-sm text-gray-600 leading-tight font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Texto inferior */}
        {text && (
          <div className="pt-3 border-t-2 border-gray-100">
            <p className="text-center text-sm text-gray-700 font-medium leading-relaxed">
              {text}
            </p>
          </div>
        )}
      </div>

      {/* Efecto de brillo en hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, transparent 0%, ${color}10 50%, transparent 100%)`,
        }}
      />

      {/* Indicador de click */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
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
