"use client";

import {
  ActionType,
  StatusType,
  useCreateCrmMutation,
  useCheckInsituVisitMutation,
} from "@/redux/services/crmApi";
import { useState } from "react";
import { format } from "date-fns";
import { useClient } from "@/app/context/ClientContext";
import { useAuth } from "@/app/context/AuthContext";

interface VisitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VisitModal({ isOpen, onClose }: VisitModalProps) {
  // Mutaciones para crear CRM y verificar insitu
  const [createCrm] = useCreateCrmMutation();
  const [insituVisit] = useCheckInsituVisitMutation();
  
  // Fecha actual en formato "yyyy-MM-dd"
  const currentDate = format(new Date(), "yyyy-MM-dd");
  const { selectedClientId } = useClient();
  const { userData } = useAuth();

  // Estados locales para GPS, insitu, observaciones y el form
  const [gps, setGPS] = useState("");
  const [insitu, setInsitu] = useState<boolean | null>(null);
  const [observations, setObservations] = useState("");
  const [showPredefinedComments, setShowPredefinedComments] = useState(false);

  // Estado para el formulario que se enviará
  const [form, setForm] = useState({
    date: currentDate,
    type: ActionType.VISIT,
    status: StatusType.SENDED,
    notes: observations,
    customer_id: selectedClientId ? selectedClientId : "",
    seller_id: userData ? userData.seller_id : "",
    user_id: userData ? userData._id : "",
    gps: "",
    insitu: false,
  });
  console.log(form)

  // Función para obtener la ubicación y llamar al backend para verificar si está insitu
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      console.error("La geolocalización no es soportada por este navegador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Formatear la ubicación en "lat, lon"
        const gpsStr = `${latitude}, ${longitude}`;
        setGPS(gpsStr);

        if (!selectedClientId) {
          console.error("No hay cliente seleccionado.");
          return;
        }

        try {
          // Llamamos al backend para calcular la distancia y determinar insitu
          const response = await insituVisit({
            customerId: selectedClientId,
            currentLat: latitude,
            currentLon: longitude,
          }).unwrap();

          console.log("Respuesta del backend:", response);
          setInsitu(response.insitu);

          // Actualizamos el formulario para incluir la ubicación y el flag insitu
          setForm((prev) => ({
            ...prev,
            gps: gpsStr,
            insitu: response.insitu,
          }));
        } catch (error) {
          console.error("Error verificando insitu:", error);
        }
      },
      (error) => {
        console.error("Error obteniendo la ubicación:", error);
      }
    );
  };

  // Función para enviar el formulario (crear la visita)
  const handleSubmit = async () => {
    // Actualizamos el formulario con las observaciones actuales (por si han cambiado)
    setForm((prev) => ({
      ...prev,
      notes: observations,
    }));

    try {
      const newCrm = await createCrm(form).unwrap();
      console.log("Visita enviada exitosamente:", newCrm);
      onClose(); // Cerramos el modal al enviar
    } catch (error) {
      console.error("Error al enviar la visita:", error);
    }
  };

  // Si el modal no está abierto, no se renderiza nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50" onClick={onClose}>
      <div
        className="h-full flex flex-col bg-zinc-900 max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-white">
              ←
            </button>
            <h2 className="text-xl font-semibold text-white">Visita</h2>
          </div>
          <button className="text-white">ℹ️</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="border-b border-zinc-800">
            <InfoRow label="Fecha" value={currentDate} />
            <InfoRow
              label={
                <div className="flex items-center gap-2" onClick={handleGetLocation}>
                  GPS
                  <span className="text-emerald-500">📍</span>
                  <span className="text-white">🌐</span>
                </div>
              }
              value={
                insitu === null ? (
                  <span className="text-gray-500">Esperando ubicación...</span>
                ) : insitu ? (
                  <span className="text-green-500">Insitu ✅</span>
                ) : (
                  <span className="text-red-500">No Insitu ❌</span>
                )
              }
            />
          </div>

          {/* Sección de Comentarios Predefinidos */}
          <div className="border-b border-zinc-800">
            <button
              onClick={() => setShowPredefinedComments(!showPredefinedComments)}
              className="w-full p-4 flex justify-between items-center text-white"
            >
              <span>Comentarios Predefinidos</span>
              <span>{showPredefinedComments ? "▼" : "▶"}</span>
            </button>
            {showPredefinedComments && (
              <div className="p-4 bg-zinc-800">
                <p className="text-zinc-400">No hay comentarios predefinidos</p>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div className="p-4">
            <label className="block text-white mb-2">Observaciones</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full h-32 p-3 bg-zinc-800 text-white rounded-md border border-zinc-700 
                         focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Ingrese sus observaciones..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 mt-auto border-t border-zinc-800">
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-500 text-white py-3 rounded-md font-medium"
          >
            ENVIAR
          </button>
        </div>
      </div>
    </div>
  );
}

interface InfoRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  valueClassName?: string;
}

function InfoRow({ label, value, valueClassName = "text-white" }: InfoRowProps) {
  return (
    <div className="p-4 flex justify-between items-center border-b border-zinc-800">
      <span className="text-zinc-400">{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}
