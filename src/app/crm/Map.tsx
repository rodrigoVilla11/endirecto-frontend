"use client";
import React, { useMemo } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useTranslation } from "react-i18next";

type MapComponentProps = {
  currentGPS: string;
  closeModal: () => void;
};

const MapComponent: React.FC<MapComponentProps> = ({ currentGPS, closeModal }) => {
  const { t } = useTranslation();

  // Always call hooks before any early returns
  const center = useMemo(() => {
    if (!currentGPS) return null;
    const parts = currentGPS.split(",").map((part) => part.trim());
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    return isNaN(lat) || isNaN(lng) ? null : { lat, lng };
  }, [currentGPS]);

  // Validate API key and center after all hooks have been called
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return <div>{t("map.noApiKey")}</div>;
  }
  if (!center) {
    return <div>{t("map.invalidGPSFormat")}</div>;
  }

  // Style for the map container
  const containerStyle = { width: "600px", height: "300px" };

  return (
    <LoadScript googleMapsApiKey={apiKey} key={currentGPS}>
      <div className="relative">
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15}>
          <Marker position={center} />
        </GoogleMap>
        <button
          type="button"
          onClick={closeModal}
          aria-label={t("map.close")}
          className="absolute top-2 right-2 bg-gray-400 rounded-md px-4 py-2 text-white hover:bg-gray-500"
        >
          X
        </button>
      </div>
    </LoadScript>
  );
};

export default MapComponent;
