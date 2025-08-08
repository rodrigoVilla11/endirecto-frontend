"use client";

import { useGetCustomersQuery } from "@/redux/services/customersApi";
import { useGetSellersQuery } from "@/redux/services/sellersApi";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { X, Search, MapPin } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";

type MapModalProps = {
  visit: any[];
  onClose: () => void;
};
type MarkerData = {
  id: string;
  seller_id: string;
  customer_id: string;
  position: { lat: number; lng: number };
};




export default function MapModal({ visit, onClose }: MapModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const { data: customersData } = useGetCustomersQuery(null);
  const { data: sellersData } = useGetSellersQuery(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const filteredCustomers = useMemo(() => {
    if (!visit) return [];
    const q = searchQuery.trim().toLowerCase();
    return visit.filter((v) => {
      const sellerName = sellersData?.find((s: any) => s.id === v.seller_id)?.name || "";
      const customerName = customersData?.find((c: any) => c.id === v.customer_id)?.name || "";
      return (
        v.seller_id.toLowerCase().includes(q) ||
        sellerName.toLowerCase().includes(q) ||
        customerName.toLowerCase().includes(q)
      );
    });
  }, [visit, searchQuery, sellersData, customersData]);

 const markers: MarkerData[] = useMemo(() => {
  return filteredCustomers
    .map((c) => {
      if (!c.gps) return null;
      const [lat, lng] = c.gps.split(",").map((n : any) => parseFloat(n.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        return {
          id: String(c.id),
          seller_id: String(c.seller_id),
          customer_id: String(c.customer_id),
          position: { lat, lng },
        };
      }
      return null;
    })
    .filter((m): m is MarkerData => m !== null); // <-- aquí TypeScript ya sabe que no hay null
}, [filteredCustomers]);

  const center = markers[0]?.position || { lat: -34.6037, lng: -58.3816 };

  const handleRowClick = useCallback(
    (gps: string) => {
      if (!mapInstance || !gps) return;
      const [lat, lng] = gps.split(",").map((n) => parseFloat(n.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        mapInstance.panTo({ lat, lng });
        mapInstance.setZoom(15);
      }
    },
    [mapInstance]
  );

  if (!apiKey) return <div className="text-center text-red-500">{t("mapModal.noApiKey")}</div>;
  if (loadError) return <div className="text-center text-red-500">Error al cargar Google Maps</div>;

  if (filteredCustomers.length > 998) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="rounded-xl bg-white p-6 shadow-2xl text-center">
          <p className="text-xl font-semibold text-gray-800">Demasiados clientes</p>
          <p className="mt-2 text-gray-600">Por favor, filtra antes de ver los resultados.</p>
          <button
            onClick={onClose}
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Cerrar
          </button>
        </div>
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

        {/* Contenedor principal */}
        <div className="flex h-full w-full pt-16">
          {/* Mapa */}
          <div className="relative flex-1">
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
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={center}
                zoom={10}
                onLoad={(map) => setMapInstance(map)}
                options={{
                  styles: [
                    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
                  ],
                }}
              >
                {markers.map((marker, index) => (
                  <Marker
                    key={marker.id}
                    position={marker.position}
                    label={{
                      text: String(index + 1),
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  />
                ))}
              </GoogleMap>
            )}
          </div>

          {/* Lista */}
          <div className="w-80 border-l">
            <div className="h-full overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Nombre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.map((c, index) => {
                    const sellerName =
                      sellersData?.find((s: any) => s.id === c.seller_id)?.name || c.seller_id;
                    const customerName =
                      customersData?.find((cust: any) => cust.id === c.customer_id)?.name ||
                      c.customer_id;
                    return (
                      <tr
                        key={c.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleRowClick(c.gps)}
                      >
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="flex items-center px-4 py-3 text-sm">
                          <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {sellerName}, {customerName}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
