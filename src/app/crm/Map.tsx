"use client";
import React, { useMemo, useCallback } from "react";
import { GoogleMap, LoadScript, MarkerF } from "@react-google-maps/api";
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
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180;
  return valid ? { lat, lng } : null;
};

const MapComponent: React.FC<MapComponentProps> = ({ currentGPS, closeModal }) => {
  const { t } = useTranslation();

  const center = useMemo(() => parseGPS(currentGPS), [currentGPS]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return <div>{t("map.noApiKey")}</div>;
  if (!center) return <div>{t("map.invalidGPSFormat")}</div>;

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
    // Si querés guardar ref del mapa o hacer fitBounds, hacelo acá
  }, []);

  return (
    // SUGERENCIA: idealmente mover <LoadScript> a un nivel superior para no recargar el SDK
    <LoadScript googleMapsApiKey={apiKey}>
      <div className="relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          options={options}
          onLoad={onMapLoad}
        >
          <MarkerF position={center} />
        </GoogleMap>

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
    </LoadScript>
  );
};

export default MapComponent;
