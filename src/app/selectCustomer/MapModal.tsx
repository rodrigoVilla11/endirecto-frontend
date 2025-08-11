"use client";

import { GoogleMap, Marker } from "@react-google-maps/api";
import { X, Search, MapPin } from "lucide-react";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMapsLoader } from "../providers/MapProvider";

type Customer = {
  id: string;
  name: string;
  gps?: string; // "lat, lng"
};

type Row = {
  customer: Customer;
  displayIndex: number; // 1..N según el filtro
  position: google.maps.LatLngLiteral | null; // null si no hay GPS válido
};

type MapModalProps = {
  customers: Customer[];
  onClose: () => void;
};

export default function MapModal({ customers, onClose }: MapModalProps) {
  const { t } = useTranslation();
  const { isLoaded, loadError } = useMapsLoader(); // <- evita duplicar loader
  const [searchQuery, setSearchQuery] = useState("");
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const defaultCenter = useMemo<google.maps.LatLngLiteral>(
    () => ({ lat: -34.6037, lng: -58.3816 }),
    []
  );
  const [focus, setFocus] = useState<google.maps.LatLngLiteral>(defaultCenter);

  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const mapOptions = useMemo(
    () => ({
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
      clickableIcons: false,
    }),
    []
  );

  // 1) Filtro por búsqueda (NO elimina los que no tengan GPS)
  const filteredCustomers = useMemo(
    () =>
      customers.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [customers, searchQuery]
  );

  // 2) Construir filas con numeración estable y position (o null)
  const rows: Row[] = useMemo(() => {
    return filteredCustomers.map((c, i) => {
      const displayIndex = i + 1;
      let position: google.maps.LatLngLiteral | null = null;

      if (c.gps) {
        const [latStr, lngStr] = c.gps.split(",").map((p) => p.trim());
        const lat = Number(latStr);
        const lng = Number(lngStr);
        if (
          Number.isFinite(lat) &&
          Number.isFinite(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
        ) {
          position = { lat, lng };
        }
      }

      return { customer: c, displayIndex, position };
    });
  }, [filteredCustomers]);

  // 3) Centro inicial: primer row con position, si no hay => default
  const initialCenter = useMemo(
    () => rows.find((r) => r.position)?.position || defaultCenter,
    [rows, defaultCenter]
  );

  // Sincronizar foco/selección al cambiar el listado
  useEffect(() => {
    setFocus(initialCenter);
    if (!selectedId && rows.length > 0) {
      setSelectedId(rows[0].customer.id);
    }
  }, [initialCenter, rows, selectedId]);

  const tooMany = filteredCustomers.length > 998;

  // Helpers de foco
  const focusRow = useCallback(
    (row: Row) => {
      setSelectedId(row.customer.id);
      if (row.position && mapInstance) {
        mapInstance.panTo(row.position);
        mapInstance.setZoom(15);
      }
    },
    [mapInstance]
  );

  const focusMarker = useCallback(
    (customerId: string) => {
      const row = rows.find((r) => r.customer.id === customerId);
      if (!row) return;
      setSelectedId(customerId);
      if (row.position && mapInstance) {
        mapInstance.panTo(row.position);
        mapInstance.setZoom(15);
      }
    },
    [rows, mapInstance]
  );

  // Estados antes del mapa
  if (loadError) {
    return (
      <div className="text-center text-red-500">
        Error al cargar Google Maps
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative flex h-[85vh] w-[95vw] max-w-7xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="absolute left-0 right-0 top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
          <h2 className="text-xl font-semibold text-gray-800">Clientes DMA</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex h-full w-full pt-16">
          {/* Mapa */}
          <div className="relative flex-1">
            {/* Estados previos a mapa */}
            {tooMany ? (
              <div className="flex h-full w-full items-center justify-center p-6">
                <div className="rounded-xl bg-white p-6 shadow-2xl text-center">
                  <p className="text-xl font-semibold text-gray-800">
                    Demasiados clientes
                  </p>
                  <p className="mt-2 text-gray-600">
                    Por favor, filtra antes de ver los resultados. No se pueden
                    mostrar más de 1000 clientes.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="left-4 right-4 top-4 z-10">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar clientes..."
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 pr-4 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* Google Map */}
                {!isLoaded ? (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={focus}
                    zoom={10}
                    options={mapOptions}
                    onLoad={(map) => setMapInstance(map)}
                  >
                    {/* Markers solo de los que tienen posición */}
                    {rows
                      .filter((r) => r.position)
                      .map((r) => (
                        <Marker
                          key={r.customer.id}
                          position={r.position!}
                          label={{
                            text: String(r.displayIndex), // 1..N estable
                            color:
                              selectedId === r.customer.id ? "black" : "white",
                            fontSize: "14px",
                            fontWeight: "bold",
                          }}
                          options={{
                            zIndex: selectedId === r.customer.id ? 999 : 1,
                          }}
                          onClick={() => focusMarker(r.customer.id)}
                        />
                      ))}
                  </GoogleMap>
                )}
              </>
            )}
          </div>

          {/* Lista */}
          <div className="w-96 border-l border-gray-200 bg-white">
            <div className="h-full overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Nombre
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rows.map((r) => {
                    const isSelected = selectedId === r.customer.id;
                    return (
                      <tr
                        key={r.customer.id}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => focusRow(r)}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {r.displayIndex}
                        </td>
                        <td className="flex items-center whitespace-nowrap px-4 py-3 text-sm">
                          <MapPin
                            className={`mr-2 h-4 w-4 ${
                              r.position ? "text-gray-400" : "text-yellow-500"
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              isSelected ? "text-blue-700" : "text-gray-900"
                            }`}
                          >
                            {r.customer.name}
                          </span>
                          {!r.position && (
                            <span className="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                              {t("map.noAddress") || "Sin dirección"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {/* /Lista */}
        </div>
      </div>
    </div>
  );
}
