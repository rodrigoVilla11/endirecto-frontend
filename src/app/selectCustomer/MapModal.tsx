"use client"

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"
import { X, Search, MapPin } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

type Customer = {
  id: string
  name: string
  gps?: string
}

type MapModalProps = {
  customers: Customer[]
  onClose: () => void
}

export default function MapModal({ customers, onClose }: MapModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { t } = useTranslation()
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  })

  if (!apiKey) {
    return <div className="text-center text-red-500">{t("mapModal.noApiKey")}</div>
  }

  if (loadError) {
    return <div className="text-center text-red-500">Error al cargar la API de Google Maps</div>
  }

  // Filtrar clientes según la búsqueda
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Si la cantidad de clientes filtrados es mayor a 1000, se muestra un mensaje pidiendo filtrar antes
  if (filteredCustomers.length > 998) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="rounded-xl bg-white p-6 shadow-2xl text-center">
          <p className="text-xl font-semibold text-gray-800">Demasiados clientes</p>
          <p className="mt-2 text-gray-600">
            Por favor, filtra antes de ver los resultados. No se pueden mostrar más de 1000 clientes.
          </p>
          <button
            onClick={onClose}
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  // Crear marcadores a partir de los clientes filtrados
  const markers = filteredCustomers
    .map((c) => {
      if (!c.gps) return null
      const parts = c.gps.split(",").map((p) => Number.parseFloat(p.trim()))
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        return null
      }
      return {
        id: c.id,
        name: c.name,
        position: { lat: parts[0], lng: parts[1] },
      }
    })
    .filter((m) => m !== null)

  const containerStyle = { width: "100%", height: "100%" }
  const center = markers.length > 0 ? markers[0]!.position : { lat: -34.6037, lng: -58.3816 }

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

        {/* Contenedor principal */}
        <div className="flex h-full w-full pt-16">
          <div className="relative flex-1">
            {/* Barra de búsqueda */}
            <div className="left-4 right-4 top-4 z-10">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar lugares..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 pr-4 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Mapa */}
            {!isLoaded ? (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={containerStyle}
                onLoad={(map) => {
                  setMapInstance(map)
                  map.setCenter(center)
                }}
                zoom={10}
                options={{
                  styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
                }}
              >
                {markers.map((marker, index) => (
                  <Marker
                    key={marker!.id}
                    position={marker!.position}
                    label={{
                      text: String(index + 1),
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      fillColor: "red",
                      fillOpacity: 1,
                      strokeColor: "white",
                      strokeWeight: 2,
                      scale: 20,
                    }}
                  />
                ))}
              </GoogleMap>
            )}
          </div>

          {/* Lista de clientes */}
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
                  {filteredCustomers.map((customer, index) => (
                    <tr
                      key={customer.id}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() => {
                        if (mapInstance && customer.gps) {
                          const parts = customer.gps
                            .split(",")
                            .map((p) => Number.parseFloat(p.trim()))
                          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                            mapInstance.panTo({ lat: parts[0], lng: parts[1] })
                            mapInstance.setZoom(15)
                          }
                        }
                      }}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="flex items-center whitespace-nowrap px-4 py-3 text-sm">
                        <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{customer.name}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
