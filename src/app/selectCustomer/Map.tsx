// MapComponent.tsx
"use client";
import React, { useState } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
type MapComponentProps = {
  currentCustomerId: string;
  closeModal: () => void;
};

const MapComponent: React.FC<MapComponentProps> = ({ currentCustomerId, closeModal }) => {
  const { data: customer, error, isLoading } = useGetCustomerByIdQuery({
    id: currentCustomerId || "",
  });

  // Mostrar spinner o error según corresponda
  if (isLoading) return <div>Cargando mapa...</div>;
  if (error) return <div>Error al obtener los datos del cliente.</div>;

  const gps = customer?.gps;
  if (!gps) return <div>No se han proporcionado datos de GPS</div>;

  // Procesar el string "lat, lon"
  const parts = gps.split(",").map((part) => part.trim());
  if (parts.length !== 2) {
    return <div>El formato del GPS es inválido. Debe ser "lat, lon".</div>;
  }
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) {
    return <div>Los valores de latitud y longitud deben ser números válidos.</div>;
  }
  const center = { lat, lng };
  const containerStyle = { width: "600px", height: "300px" };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return <div>Error: No se ha configurado la API Key de Google Maps.</div>;
  }


  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <div className="relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
        >
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
