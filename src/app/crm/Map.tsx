"use client";
import React, { useMemo, useCallback, useState } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { useTranslation } from "react-i18next";

type MapComponentProps = {
  currentGPS: string;
  closeModal: () => void;
};

const parseGPS = (gps: string) => {
  if (!gps) return null;
  const parts = gps.split(/[, ]+/).map((p) => p.trim());
  if (parts.length < 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  const valid =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;
  return valid ? { lat, lng } : null;
};

const MapComponent: React.FC<MapComponentProps> = ({ currentGPS, closeModal }) => {
  const { t } = useTranslation();

  // 👇 TODOS los hooks se llaman SIEMPRE, antes de cualquier condicional de render
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: "google-maps-sdk", // evita cargas duplicadas
  });

  const center = useMemo(() => parseGPS(currentGPS), [currentGPS]);

  const containerStyle = useMemo(() => ({ width: "100%", height: "320px" }), []);
  const options = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy" as const,
      clickableIcons: false,
    }),
    []
  );

  const onMapLoad = useCallback(() => {
    // Si necesitás guardar el map o hacer fitBounds, hacelo acá
  }, []);

  // 👇 Nada de early return: todo se resuelve en el JSX
  return (
    <div className="relative">
      {!apiKey ? (
        <div>{t("map.noApiKey")}</div>
      ) : loadError ? (
        <div>{t("map.errorLoading")}</div>
      ) : !center ? (
        <div>{t("map.invalidGPSFormat")}</div>
      ) : !isLoaded ? (
        <div className="flex h-[320px] items-center justify-center">Cargando mapa…</div>
      ) : (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          options={options}
          onLoad={onMapLoad}
        >
          <MarkerF position={center} />
        </GoogleMap>
      )}

      <button
        type="button"
        onClick={closeModal}
        aria-label={t("map.close")}
        title={t("map.close") as string}
        className="absolute top-2 right-2 rounded-md px-3 py-1.5 text-white bg-gray-600 hover:bg-gray-700"
      >
        ×
      </button>
    </div>
  );
};

export default MapComponent;
