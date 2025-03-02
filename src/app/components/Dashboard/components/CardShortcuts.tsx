import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useClient } from "@/app/context/ClientContext";


const CardShortcuts: React.FC<any> = ({ title, logo, logout = false }) => {
  const { selectedClientId, setSelectedClientId } = useClient();
  const { setIsAuthenticated, setRole, userData, role } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
    setIsAuthenticated(false);
    setSelectedClientId("");
    setRole(null);
  };

  return (
    <button
      onClick={logout ? handleLogout : undefined}
      className={`
        h-16 w-[350px] sm:w-80
        flex items-center justify-between
        bg-white rounded-lg shadow-md
        p-4 hover:bg-gray-50 transition-colors
      `}
    >
      <span className="text-lg font-medium text-gray-900">{title}</span>
      <span className="text-2xl">{logo}</span>
    </button>
  );
};

export default CardShortcuts;
