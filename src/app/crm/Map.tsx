"use client";
import React, { useMemo, useRef, useEffect, useCallback } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { useTranslation } from "react-i18next";
import { useMapsLoader } from "../providers/MapProvider";

type MapComponentProps = {
  currentGPS: string;
  closeModal: () => void;
};

function parseGPS(gps: string) {
  if (!gps) return null;
  const [a, b] = gps.split(",").map((s) => parseFloat(s.trim()));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (a < -90 || a > 90 || b < -180 || b > 180) return null;
  return { lat: a, lng: b };
}

export default function MapComponent({
  currentGPS,
  closeModal,
}: MapComponentProps) {
  const { t } = useTranslation();
  const { isLoaded, loadError } = useMapsLoader(); // ← usa el loader global
  const mapRef = useRef<google.maps.Map | null>(null);

  const center = useMemo(
    () => parseGPS(currentGPS) ?? { lat: -34.6037, lng: -58.3816 },
    [currentGPS]
  );


  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map; // guarda la instancia
    // no retornes nada
  }, []);

  const handleMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Forzar recenter/resize al abrir el modal
  useEffect(() => {
    if (!mapRef.current) return;
    const m = mapRef.current;
    // pequeño delay para asegurar que el contenedor ya tiene tamaño
    const id = requestAnimationFrame(() => {
      m.setCenter(center);
      // (Opcional) m.panTo(center);
      // (Solo si usas la API v3 directamente) google.maps.event.trigger(m, "resize");
    });
    return () => cancelAnimationFrame(id);
  }, [center, isLoaded]);

  return (
    <div className="relative">
      {/* CONTENEDOR con altura real */}
      <div className="w-[92vw] max-w-5xl h-[70vh]">
        {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
          <div className="flex h-full items-center justify-center">
            {t("map.noApiKey")}
          </div>
        ) : loadError ? (
          <div className="flex h-full items-center justify-center">
            {t("map.errorLoading")}
          </div>
        ) : !isLoaded ? (
          <div className="flex h-full items-center justify-center">
            Cargando mapa…
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center}
            zoom={15}
            onLoad={handleMapLoad} // ✅ devuelve void
            onUnmount={handleMapUnmount} // opcional
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              gestureHandling: "greedy",
              clickableIcons: false,
            }}
          >
            <MarkerF position={center} />
          </GoogleMap>
        )}
      </div>

      <button
        type="button"
        onClick={closeModal}
        className="absolute top-2 right-2 rounded-md px-3 py-1.5 text-white bg-gray-600 hover:bg-gray-700"
        aria-label={t("map.close")}
        title={t("map.close") as string}
      >
        ×
      </button>
    </div>
  );
}
