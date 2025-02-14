// MapModal.tsx
"use client";
import React, { useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

type Customer = {
  id: string;
  gps?: string;
};

type MapModalProps = {
  customers: Customer[];
  onClose: () => void;
};

const MapModal: React.FC<MapModalProps> = ({ customers, onClose }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return <div>Error: No se ha configurado la API Key de Google Maps.</div>;
  }

  // Filtrar clientes con datos de GPS válidos y mapearlos a markers
  const markers = customers
    .map((c) => {
      if (!c.gps) return null;
      const parts = c.gps.split(",").map((p) => parseFloat(p.trim()));
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        return null;
      }
      return { id: c.id, position: { lat: parts[0], lng: parts[1] } };
    })
    .filter((m) => m !== null) as { id: string; position: { lat: number; lng: number } }[];

  // Centro del mapa: si hay markers, usar el primero; de lo contrario un centro por defecto
  const center =
    markers.length > 0 ? markers[0].position : { lat: -34.6037, lng: -58.3816 };

  const containerStyle = { width: "600px", height: "400px" };

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <div className="relative">
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={10}
          onLoad={() => setMapLoaded(true)}
        >
          {markers.map((marker) => (
            <Marker key={marker.id} position={marker.position} />
          ))}
        </GoogleMap>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-gray-400 rounded-md px-4 py-2 text-white hover:bg-gray-500"
        >
          Close
        </button>
      </div>
    </LoadScript>
  );
};

export default MapModal;
