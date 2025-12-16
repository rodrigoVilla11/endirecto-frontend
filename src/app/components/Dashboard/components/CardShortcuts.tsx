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
  color = "#808080", // Purple-500 por defecto
  subtitle,
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
      group relative
      w-[240px] h-[95px]
      flex items-center gap-4
      bg-white/5 backdrop-blur
      rounded-2xl border border-white/10
      shadow-lg hover:shadow-2xl
      p-5 transition-all duration-300
      hover:scale-[1.03] hover:border-[#E10600]/40
      overflow-hidden
      ${logout ? "hover:border-red-500/40" : ""}
    `}
    >
      {/* Barra lateral */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2"
        style={{
          backgroundColor: logout ? "#ef4444" : color,
        }}
      />

      {/* Icono */}
      <div
        className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
        style={{
          background: logout
            ? "linear-gradient(135deg, #ef444420, #ef444410)"
            : `linear-gradient(135deg, ${color}22, ${color}10)`,
          border: logout ? "1px solid #ef444460" : `1px solid ${color}55`,
        }}
      >
        {logout ? <LogOut className="w-6 h-6 text-red-500" /> : logo}
      </div>

      {/* Texto */}
      <div className="flex-1 text-left min-w-0">
        <h3
          className={`text-base font-extrabold leading-tight transition-colors ${
            logout
              ? "text-white group-hover:text-red-500"
              : "text-white group-hover:text-white"
          }`}
        >
          {title}
        </h3>

        {subtitle && (
          <p className="text-xs text-white/60 mt-1 font-semibold truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Flecha */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-white/10"
        style={{
          backgroundColor: logout ? "#ef444420" : `${color}22`,
        }}
      >
        <ChevronRight
          className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
          style={{
            color: logout ? "#ef4444" : color,
          }}
        />
      </div>

      {/* Glow hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: logout
            ? "linear-gradient(135deg, transparent 0%, #ef444415 50%, transparent 100%)"
            : `linear-gradient(135deg, transparent 0%, ${color}14 50%, transparent 100%)`,
        }}
      />

      {/* Badge Logout */}
      {logout && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-[10px] font-extrabold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
            SALIR
          </span>
        </div>
      )}
    </button>
  );
};

export default CardShortcuts;
