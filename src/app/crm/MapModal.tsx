"use client";

import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { X, Search, MapPin } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMapsLoader } from "../providers/MapProvider";

type VisitRow = {
  id: string;
  seller_id: string;
  customer_id: string;
  gps?: string;
};

type MapModalProps = {
  visit: VisitRow[];
  onClose: () => void;
};

type Row = VisitRow & {
  displayIndex: number; // índice visible 1..N (aunque no tenga GPS)
  sellerName: string;
  customerName: string;
  position: google.maps.LatLngLiteral | null; // null si no tiene GPS válido
};

export default function MapModal({ visit, onClose }: MapModalProps) {
  const { t } = useTranslation();
  const { isLoaded, loadError } = useMapsLoader(); // <- NO volvemos a cargar el SDK
  const [searchQuery, setSearchQuery] = useState("");
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);

  const defaultCenter = useMemo(
    () => ({ lat: -34.6037, lng: -58.3816 }),
    []
  );
  const containerStyle = useMemo(
    () => ({ width: "100%", height: "100%" }),
    []
  );
  const mapOptions = useMemo(
    () => ({
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    }),
    []
  );

  // 1) Filtrar
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return visit;

    return visit.filter((v) => {
      const sellerName =
        sellersData?.find((s: any) => s.id === v.seller_id)?.name || "";
      const customerName =
        customersData?.find((c: any) => c.id === v.customer_id)?.name || "";
      return (
        v.seller_id.toLowerCase().includes(q) ||
        sellerName.toLowerCase().includes(q) ||
        customerName.toLowerCase().includes(q)
      );
    });
  }, [visit, searchQuery, sellersData, customersData]);

  // 2) Construir filas con índice y posición (null si no tiene GPS)
  const rows: Row[] = useMemo(() => {
    return filtered.map((v, i) => {
      const sellerName =
        sellersData?.find((s: any) => s.id === v.seller_id)?.name ||
        v.seller_id;
      const customerName =
        customersData?.find((c: any) => c.id === v.customer_id)?.name ||
        v.customer_id;

      let position: google.maps.LatLngLiteral | null = null;
      if (v.gps) {
        const [latStr, lngStr] = v.gps.split(",").map((p) => p.trim());
        const lat = Number(latStr);
        const lng = Number(lngStr);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          position = { lat, lng };
        }
      }

      return {
        ...v,
        displayIndex: i + 1, // numeración estable
        sellerName,
        customerName,
        position,
      };
    });
  }, [filtered, sellersData, customersData]);

  // 3) Markers con la misma numeración que la lista
  const markers = useMemo(
    () =>
      rows
        .filter((r) => !!r.position)
        .map((r) => ({
          id: r.id,
          position: r.position as google.maps.LatLngLiteral,
          labelIndex: r.displayIndex,
        })),
    [rows]
  );

  // 4) Centro inicial
  const initialCenter = markers[0]?.position || defaultCenter;

  // Handlers
  const focusRow = useCallback(
    (row: Row) => {
      setSelectedId(row.id);
      if (row.position && mapInstance) {
        mapInstance.panTo(row.position);
        mapInstance.setZoom(15);
      }
    },
    [mapInstance]
  );

  const focusMarker = useCallback(
    (markerId: string) => {
      const row = rows.find((r) => r.id === markerId);
      if (!row) return;
      setSelectedId(row.id);
      if (row.position && mapInstance) {
        mapInstance.panTo(row.position);
        mapInstance.setZoom(15);
      }
    },
    [mapInstance, rows]
  );

  // Estados de carga del SDK
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
            title={t("close")}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex h-full w-full pt-16">
          {/* Mapa */}
          <div className="relative flex-1">
            {/* Buscador */}
            <div className="absolute left-4 right-4 top-4 z-10">
              <div className="relative">
                <input
                  type="text"
                  aria-label={t("mapModal.search")}
                  placeholder="Buscar cliente o vendedor..."
                  className="w-full rounded-lg border px-4 py-2 pl-10 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {!isLoaded ? (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={initialCenter}
                zoom={10}
                onLoad={(map) => setMapInstance(map)}
                options={mapOptions}
              >
                {markers.map((m) => (
                  <Marker
                    key={m.id}
                    position={m.position}
                    label={{
                      text: String(m.labelIndex), // misma numeración que la lista
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                    onClick={() => focusMarker(m.id)}
                  />
                ))}
              </GoogleMap>
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
                  {rows.map((row) => {
                    const isSelected = selectedId === row.id;
                    const hasLocation = !!row.position;

                    return (
                      <tr
                        key={row.id}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => focusRow(row)}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                          {row.displayIndex}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin
                              className={`h-4 w-4 ${
                                hasLocation ? "text-gray-400" : "text-red-500"
                              }`}
                            />
                            <span className="font-medium text-gray-900">
                              {row.sellerName}, {row.customerName}
                            </span>
                            {!hasLocation && (
                              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                Sin ubicación
                              </span>
                            )}
                          </div>
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
