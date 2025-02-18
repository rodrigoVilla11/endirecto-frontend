"use client";
import React from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useTranslation } from "react-i18next";

type MapComponentProps = {
  currentCustomerId: string;
  closeModal: () => void;
};

const MapComponent: React.FC<MapComponentProps> = ({ currentCustomerId, closeModal }) => {
  const { t } = useTranslation();
  const { data: customer, error, isLoading } = useGetCustomerByIdQuery(
    { id: currentCustomerId || "" },
    { refetchOnMountOrArgChange: true }
  );
  
  if (isLoading) return <div>{t("map.loading")}</div>;
  if (error) return <div>{t("map.errorLoadingCustomer")}</div>;

  const gps = customer?.gps;
  if (!gps) return <div>{t("map.noGPSData")}</div>;

  const parts = gps.split(",").map((part) => part.trim());
  if (parts.length !== 2) {
    return <div>{t("map.invalidGPSFormat")}</div>;
  }
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) {
    return <div>{t("map.invalidCoordinates")}</div>;
  }
  const center = { lat, lng };
  const containerStyle = { width: "600px", height: "300px" };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return <div>{t("map.noApiKey")}</div>;
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} key={currentCustomerId}>
      <div className="relative">
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15}>
          {/* Agregamos el Marker para mostrar el pin */}
          <Marker position={center} />
        </GoogleMap>
        <button
          type="button"
          onClick={closeModal}
          className="absolute top-2 right-2 bg-gray-400 rounded-md px-4 py-2 text-white hover:bg-gray-500"
        >
          X
        </button>
      </div>
    </LoadScript>
  );
};

export default MapComponent;
