"use client";
import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";

interface ClientContextType {
  selectedClientId: string | null;
  setSelectedClientId: React.Dispatch<React.SetStateAction<string | null>>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Leer el valor inicial desde localStorage
  const storedClientId = typeof window !== "undefined" ? localStorage.getItem("selectedClientId") : null;
  
  const [selectedClientId, setSelectedClientId] = useState<string | null>(storedClientId);

  useEffect(() => {
    if (selectedClientId !== null) {
      // Guardar el valor actualizado de selectedClientId en localStorage
      localStorage.setItem("selectedClientId", selectedClientId);
    }
  }, [selectedClientId]); // Se ejecuta cada vez que selectedClientId cambie

  return (
    <ClientContext.Provider value={{ selectedClientId, setSelectedClientId }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClient must be used within a ClientProvider");
  }
  return context;
};
