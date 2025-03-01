import React from "react";

interface CardProps {
  logo: React.ReactNode;
  title: any;
  subtitle: string;
  text?: any;
  color?: string; // Prop para definir el color
  className?: string;
}

const Card: React.FC<CardProps> = ({
  logo,
  title,
  subtitle,
  text,
  color = "gray",  // valor por defecto
  className = "",
}) => {
  // Si el color es "gray", usamos la clase text-gray-500;
  // si es distinto, aplicamos inline style
  const textColorClass = color === "gray" ? "text-gray-500" : "";
  const textColorStyle = color !== "gray" ? { color } : {};

  return (
    <div
      className={`w-80 h-40 p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer border-b-4 ${className}`}
      style={{ borderBottomColor: color }}
    >
      <div className="space-y-4">
        <div className="flex space-x-4 items-center">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
            {logo}
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>

        <div className="h-1/2 flex justify-center items-center font-semibold text-lg text-gray-900">
          {text && (
            <p
              className={`text-xs sm:text-sm text-center ${textColorClass}`}
              style={textColorStyle}
            >
              {text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
