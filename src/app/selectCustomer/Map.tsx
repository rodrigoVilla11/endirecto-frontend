"use client";
import React, { useMemo } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { useTranslation } from "react-i18next";
import { useMapsLoader } from "../providers/MapProvider";

type MapComponentProps = {
  currentCustomerId: any; // mejor tipado
  closeModal: () => void;
};

const parseGPS = (gps?: string) => {
  if (!gps) return null;
  const [latStr, lngStr] = gps.split(",").map((s) => s.trim());
  const lat = Number(latStr);
  const lng = Number(lngStr);
  const valid =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;
  return valid ? { lat, lng } : null;
};

const MapComponent: React.FC<MapComponentProps> = ({
  currentCustomerId,
  closeModal,
}) => {
  const { t } = useTranslation();
  const { isLoaded, loadError } = useMapsLoader(); // loader global (mismo id)
  const apiKeyPresent = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

  const center = useMemo(
    () => parseGPS(currentCustomerId?.gps),
    [currentCustomerId?.gps]
  );

  // Estados previos (sin early returns que rompan hooks)
  const content = !apiKeyPresent ? (
    <div className="flex h-full w-full items-center justify-center">
      {t("map.noApiKey")}
    </div>
  ) : loadError ? (
    <div className="flex h-full w-full items-center justify-center">
      {t("map.errorSdk")}
    </div>
  ) : !currentCustomerId ? (
    <div className="flex h-full w-full items-center justify-center">
      {t("map.noCustomerId")}
    </div>
  ) : !currentCustomerId.gps ? (
    <EmptyState msg={t("map.noGPSData")} closeModal={closeModal} />
  ) : !center ? (
    <EmptyState msg={t("map.invalidGPSFormat")} closeModal={closeModal} />
  ) : !isLoaded ? (
    <div className="flex h-full w-full items-center justify-center">
      {t("map.loading")}
    </div>
  ) : (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }} // <- ocupa el wrapper
      center={center}
      zoom={15}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        gestureHandling: "greedy",
      }}
      // key para forzar re-render si cambia el punto
      key={`${center.lat},${center.lng}`}
    >
      <MarkerF position={center} />
    </GoogleMap>
  );

  return (
    <div className="relative w-[90vw] max-w-4xl h-[60vh] flex flex-col">
      {/* Header con id y nombre */}
      <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b border-gray-300">
        <h2 className="text-sm font-semibold text-gray-800">
          {currentCustomerId?.id} — {currentCustomerId?.name}
        </h2>
        <button
          type="button"
          onClick={closeModal}
          aria-label={t("map.close")}
          title={t("map.close") as string}
          className="rounded-md px-3 py-1.5 text-white bg-gray-600 hover:bg-gray-700 mx-4"
        >
          ×
        </button>
      </div>

      {/* Contenedor del mapa */}
      <div className="flex-1 relative">{content}</div>
    </div>
  );
};

function EmptyState({
  msg,
  closeModal,
}: {
  msg: string;
  closeModal: () => void;
}) {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-6">
      <p className="text-center">{msg}</p>
      <button
        type="button"
        onClick={closeModal}
        className="absolute top-2 right-2 rounded-md px-3 py-1.5 text-white bg-gray-600 hover:bg-gray-700"
      >
        ×
      </button>
    </div>
  );
}

export default MapComponent;
