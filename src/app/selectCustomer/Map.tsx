"use client";
import React, { useMemo } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useTranslation } from "react-i18next";

type MapComponentProps = {
  currentCustomerId: string;
  closeModal: () => void;
};

const MapComponent: React.FC<MapComponentProps> = ({
  currentCustomerId,
  closeModal,
}) => {
  // All hooks are called unconditionally
  const { t } = useTranslation();
  const {
    data: customer,
    error,
    isLoading,
  } = useGetCustomerByIdQuery(
    { id: currentCustomerId },
    { refetchOnMountOrArgChange: true }
  );
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // useMemo is called regardless of the conditionals
  const center = useMemo(() => {
    if (!customer?.gps) return null;
    const parts = customer.gps.split(",").map((part) => part.trim());
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    return isNaN(lat) || isNaN(lng) ? null : { lat, lng };
  }, [customer?.gps]);

  // Conditional rendering based on the hook values
  if (!apiKey) {
    return <div>{t("map.noApiKey")}</div>;
  }
  if (isLoading) return <div>{t("map.loading")}</div>;
  if (error) return <div>{t("map.errorLoadingCustomer")}</div>;
  if (!customer?.gps)
    return (
      <div>
        <p className="p-8"> {t("map.noGPSData")}</p>

        <button
          type="button"
          onClick={closeModal}
          aria-label={t("map.close")}
          className="absolute top-2 right-2 bg-gray-400 rounded-md px-4 py-2 text-white hover:bg-gray-500"
        >
          X
        </button>
      </div>
    );
  if (!center)
    return (
      <div>
        <p className="p-8"> {t("map.invalidGPSFormat")}</p>

        <button
          type="button"
          onClick={closeModal}
          aria-label={t("map.close")}
          className="absolute top-2 right-2 bg-gray-400 rounded-md px-4 py-2 text-white hover:bg-gray-500"
        >
          X
        </button>
      </div>
    );

  // Style for the map container
  const containerStyle = { width: "600px", height: "300px" };

  return (
    <LoadScript googleMapsApiKey={apiKey}>
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
