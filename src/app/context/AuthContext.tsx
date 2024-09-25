"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserData {
  _id: string;
  username: string;
  email: string;
  role: string;
  branch: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  role: string | null;
  setRole: (role: string | null) => void;
  userData: UserData | null;
  setUserData: (data: UserData | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null); 

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, role, setRole, userData, setUserData }}>
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
