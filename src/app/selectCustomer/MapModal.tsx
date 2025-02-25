"use client";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Customer = {
  id: string;
  name: string;
  gps?: string;
};

type MapModalProps = {
  customers: Customer[];
  onClose: () => void;
};

export default function MapModal({ customers, onClose }: MapModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();
  
  // Asigna un valor por defecto para que el hook se ejecute siempre
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  
  // Llama al hook siempre, sin condiciones
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  // Ahora, si no hay apiKey, muestra el mensaje y retorna
  if (!apiKey) {
    return <div>{t("mapModal.noApiKey")}</div>;
  }

  if (loadError) {
    return <div>Error al cargar la API de Google Maps</div>;
  }

  // Filtrar clientes con coordenadas GPS válidas y crear marcadores
  const markers = customers
    .map((c) => {
      if (!c.gps) return null;
      const parts = c.gps.split(",").map((p) => Number.parseFloat(p.trim()));
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        return null;
      }
      return {
        id: c.id,
        name: c.name,
        position: { lat: parts[0], lng: parts[1] },
      };
    })
    .filter((m) => m !== null);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerStyle = { width: "970px", height: "400px" };
  const center =
    markers.length > 0 ? markers[0]!.position : { lat: -34.6037, lng: -58.3816 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative flex h-[80vh] w-[90vw] overflow-hidden rounded-lg bg-white">
        {/* Header */}
        <div className="absolute left-0 right-0 top-0 z-10 flex h-14 items-center justify-between border-b bg-white px-4">
          <h2 className="text-lg font-medium">Clientes DMA</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenedor principal */}
        <div className="flex h-full w-full pt-14">
          <div className="relative flex-1">
            {/* Barra de búsqueda */}
            <div className="absolute left-4 right-4 top-4 z-10">
              <input
                type="text"
                placeholder="Buscar lugares..."
                className="w-full rounded-md border px-4 py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Mapa */}
            {!isLoaded ? (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={containerStyle}
                onLoad={(map) => {
                  map.setCenter(center);
                }}
                zoom={10}
              >
                {markers.map((marker, index) => (
                  <Marker
                    key={marker!.id}
                    position={marker!.position}
                    label={{
                      text: String(index + 1),
                      color: "black",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  />
                ))}
              </GoogleMap>
            )}
          </div>

          {/* Lista de clientes */}
          <div className="w-96 border-l">
            <div className="h-full overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Nombre</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer, index) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{customer.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
