"use client"
import React, { createContext, useState, useContext, useEffect, Dispatch, SetStateAction } from 'react';

// Explicitly type the context value
type MobileContextType = {
  isMobile: boolean;
  setIsMobile: Dispatch<SetStateAction<boolean>>;
};

const MobileContext = createContext<MobileContextType>({
  isMobile: false,
  setIsMobile: () => {}
});

export const MobileProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <MobileContext.Provider value={{ isMobile, setIsMobile }}>
      {children}
    </MobileContext.Provider>
  );
};

export const useMobile = () => {
  return useContext(MobileContext);
};