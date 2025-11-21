import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useClient } from "@/app/context/ClientContext";
import { ChevronRight, LogOut } from "lucide-react";

interface CardShortcutsProps {
  title: string;
  logo: React.ReactNode;
  logout?: boolean;
  onClick?: () => void;
  color?: string;
  subtitle?: string;
}

const CardShortcuts: React.FC<CardShortcutsProps> = ({ 
  title, 
  logo, 
  logout = false,
  onClick,
  color = "#a855f7", // Purple-500 por defecto
  subtitle
}) => {
  const { selectedClientId, setSelectedClientId } = useClient();
  const { setIsAuthenticated, setRole } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
    setIsAuthenticated(false);
    setSelectedClientId("");
    setRole(null);
  };

  const handleClick = () => {
    if (logout) {
      handleLogout();
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        group relative w-full sm:w-72 h-auto min-h-[88px]
        flex items-center gap-4
        bg-white rounded-2xl border-2 border-gray-200
        shadow-lg hover:shadow-2xl
        p-5 transition-all duration-300
        hover:scale-105 hover:border-purple-300
        overflow-hidden
        ${logout ? 'hover:border-red-300' : ''}
      `}
    >
      {/* Barra de color lateral */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2"
        style={{ 
          backgroundColor: logout ? '#ef4444' : color 
        }}
      />

      {/* Contenedor del icono */}
      <div 
        className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
        style={{ 
          background: logout 
            ? 'linear-gradient(135deg, #fee2e220, #fef2f210)'
            : `linear-gradient(135deg, ${color}20, ${color}10)`,
          border: logout
            ? '2px solid #fca5a540'
            : `2px solid ${color}40`
        }}
      >
        {logout ? <LogOut className="w-6 h-6 text-red-500" /> : logo}
      </div>

      {/* Título y subtítulo */}
      <div className="flex-1 text-left min-w-0">
        <h3 
          className={`text-base font-bold leading-tight transition-colors ${
            logout 
              ? 'text-gray-900 group-hover:text-red-600' 
              : 'text-gray-900 group-hover:text-purple-600'
          }`}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-gray-600 mt-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Flecha indicadora */}
      <div 
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
        style={{ 
          backgroundColor: logout ? '#ef444420' : `${color}20`
        }}
      >
        <ChevronRight 
          className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
          style={{ 
            color: logout ? '#ef4444' : color 
          }}
        />
      </div>

      {/* Efecto de brillo en hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: logout
            ? 'linear-gradient(135deg, transparent 0%, #fee2e210 50%, transparent 100%)'
            : `linear-gradient(135deg, transparent 0%, ${color}10 50%, transparent 100%)`,
        }}
      />

      {/* Badge "Logout" (opcional) */}
      {logout && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
            SALIR
          </span>
        </div>
      )}
    </button>
  );
};

export default CardShortcuts;