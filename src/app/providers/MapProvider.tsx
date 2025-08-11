"use client";
import { useJsApiLoader } from "@react-google-maps/api";
import React, { createContext, useContext } from "react";

const GOOGLE_MAPS_LOADER_ID = "google-maps-script"; // usa SIEMPRE este id en TODA la app

const MapsCtx = createContext<{ isLoaded: boolean; loadError: Error | undefined }>({
  isLoaded: false,
  loadError: undefined,
});

export function MapsProvider({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const loader = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: apiKey,
    // IMPORTANT: si en otra parte usas language/region/libraries, ponlas aquí y quítalas del resto.
    // language: "es",
    // region: "AR",
    // libraries: [],
  });

  return (
    <MapsCtx.Provider value={loader}>
      {children}
    </MapsCtx.Provider>
  );
}

export const useMapsLoader = () => useContext(MapsCtx);
