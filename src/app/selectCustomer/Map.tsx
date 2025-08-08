"use client";
import React, { useMemo } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useTranslation } from "react-i18next";

type MapComponentProps = {
  currentCustomerId: string;
  closeModal: () => void;
};

const parseGPS = (gps?: string) => {
  if (!gps) return null;
  const [latStr, lngStr] = gps.split(",").map(s => s.trim());
  const lat = Number(latStr), lng = Number(lngStr);
  const valid = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  return valid ? { lat, lng } : null;
};

const MapComponent: React.FC<MapComponentProps> = ({ currentCustomerId, closeModal }) => {
  const { t } = useTranslation();

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: apiKey });

  const { data: customer, error, isLoading } = useGetCustomerByIdQuery(
    { id: currentCustomerId },
    { skip: !currentCustomerId, refetchOnMountOrArgChange: true }
  );

  const center = useMemo(() => parseGPS(customer?.gps), [customer?.gps]);
  const containerStyle = useMemo(() => ({ width: "100%", height: "320px" }), []);
  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
      gestureHandling: "greedy" as const,
    }),
    []
  );

  if (!apiKey) return <div>{t("map.noApiKey")}</div>;
  if (loadError) return <div>{t("map.errorSdk")}</div>;
  if (!currentCustomerId) return <div>{t("map.noCustomerId")}</div>;
  if (isLoading) return <div aria-live="polite">{t("map.loading")}</div>;
  if (error) return <div>{t("map.errorLoadingCustomer")}</div>;
  if (!customer?.gps) return <EmptyState closeModal={closeModal} msg={t("map.noGPSData")} />;
  if (!center) return <EmptyState closeModal={closeModal} msg={t("map.invalidGPSFormat")} />;

  return (
    <div className="relative">
      {isLoaded ? (
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15} options={mapOptions}>
          <MarkerF position={center} />
        </GoogleMap>
      ) : (
        <div className="flex h-[320px] w-full items-center justify-center">{t("map.loading")}</div>
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

function EmptyState({ msg, closeModal }: { msg: string; closeModal: () => void }) {
  return (
    <div className="relative p-6">
      <p className="pb-4">{msg}</p>
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
