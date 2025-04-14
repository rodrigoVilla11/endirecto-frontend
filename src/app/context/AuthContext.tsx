"use client";
import { jwtDecode } from "jwt-decode";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface UserData {
  _id: string;
  username: string;
  email: string;
  role: string;
  branch: string;
  seller_id: string;
  notifications: any;
  showCostPrice: boolean
}

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  role: string | null;
  setRole: (role: string | null) => void;
  userData: UserData | null;
  setUserData: (data: UserData | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decodedToken: any = jwtDecode(token);
          const {
            _id,
            username,
            email,
            role,
            branch,
            seller_id,
            notifications,
            showCostPrice,
          } = decodedToken;
          const user: UserData = {
            _id,
            username,
            email,
            role,
            branch,
            seller_id,
            notifications,
            showCostPrice,
          };

          setUserData(user);
          setRole(role);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Error decoding token:", error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        role,
        setRole,
        userData,
        setUserData,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
