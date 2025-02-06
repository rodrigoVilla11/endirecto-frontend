"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { CiGps } from "react-icons/ci";
import { useClient } from "../context/ClientContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { useGetPaymentConditionByIdQuery } from "@/redux/services/paymentConditionsApi";
import { useGetCustomerTransportByCustomerIdQuery } from "@/redux/services/customersTransports";
import { useCreateOrderMutation } from "@/redux/services/ordersApi";
import { useCheckInsituVisitMutation } from "@/redux/services/crmApi";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  percentage: number;
}

interface OrderConfirmationProps {
  total: number;
  totalFormatted: string;
  itemCount: number;
  onCancel: () => void;
  order: OrderItem[];
}

// Si necesitas definir la estructura de Transaction, inclúyela o extiéndela
interface TransactionDetails {
  quantity: number;
  article: {
    id: string;
  };
  percentage_1: number;
  netprice: number;
  total: number;
  branch: {
    id: string;
  };
  id: string;
}

interface Transaction {
  status: string;
  customer: {
    id: string | null;
  };
  seller: {
    id: string | undefined;
  };
  payment_condition: {
    id: string | undefined;
    percentage: string | undefined;
  };
  transport: {
    id: string | undefined;
  };
  tmp_id: string;
  total: number;
  notes: string;
  date: string;
  created_at: string;
  details: TransactionDetails[];
  gps: string;
  insitu: boolean;
}

export default function OrderConfirmation({
  total,
  itemCount,
  onCancel,
  order,
  totalFormatted,
}: OrderConfirmationProps) {
  const [createOrder, { isLoading: isLoadingCreate, isSuccess, isError }] =
    useCreateOrderMutation();
  const [checkInsituVisit] = useCheckInsituVisitMutation(); // Hook para verificar insitu
  const { selectedClientId } = useClient();

  // Estados para GPS e Insitu
  const [gps, setGPS] = useState("");
  const [insitu, setInsitu] = useState<boolean | null>(null);

  // Otros estados
  const [observations, setObservations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Consultas para obtener datos del cliente, transport y condición de pago
  const {
    data: customer,
    error: customerError,
    isLoading: isCustomerLoading,
  } = useGetCustomerByIdQuery({ id: selectedClientId || "" });

  const {
    data: customerTransport,
    error: customerTransportError,
    isLoading: isCustomerTransportLoading,
  } = useGetCustomerTransportByCustomerIdQuery({ id: selectedClientId || "" });

  const {
    data: paymentsConditionsData,
    error: paymentError,
    isLoading: isPaymentLoading,
  } = useGetPaymentConditionByIdQuery({
    id: customer?.payment_condition_id || "",
  });

  // Estado para la transacción (pedido)
  const [transaction, setTransaction] = useState<Transaction>({
    status: "sended",
    customer: { id: selectedClientId },
    seller: { id: customer?.seller_id },
    payment_condition: {
      id: customer?.payment_condition_id,
      percentage: paymentsConditionsData?.percentage,
    },
    transport: { id: customerTransport?.transport_id },
    tmp_id: crypto.randomUUID(),
    total: total,
    notes: observations,
    date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    details: [],
    gps: "",
    insitu: false,
  });

  // Mapea los detalles del pedido
  useEffect(() => {
    if (order.length > 0) {
      const mappedDetails = order.map((item) => ({
        quantity: item.quantity,
        article: { id: item.id },
        percentage_1: item.percentage,
        netprice: item.price,
        total: item.quantity * item.price,
        branch: { id: "001" },
        id: item.id,
      }));

      setTransaction((prev) => ({
        ...prev,
        details: mappedDetails,
      }));
    }
  }, [order]);

  // Actualiza las observaciones en la transacción cuando cambian
  const handleObservationChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newNotes = e.target.value;
    setObservations(newNotes);
    setTransaction((prev) => ({ ...prev, notes: newNotes }));
  };

  // Función para obtener la ubicación y verificar si está dentro del rango (insitu)
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      console.error("La geolocalización no es soportada por este navegador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const gpsStr = `${latitude}, ${longitude}`;
        setGPS(gpsStr);

        if (!selectedClientId) {
          console.error("No hay cliente seleccionado.");
          return;
        }

        try {
          // Llamada al backend para determinar si la ubicación es insitu (dentro de 500m)
          const response = await checkInsituVisit({
            customerId: selectedClientId,
            currentLat: latitude,
            currentLon: longitude,
          }).unwrap();

          setInsitu(response.insitu);

          // Actualiza el objeto transaction con gps e insitu
          setTransaction((prev) => ({
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

  // Función para enviar el pedido
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Actualiza la transacción con las observaciones actuales
    setTransaction((prev) => ({ ...prev, notes: observations }));

    try {
      await createOrder(transaction).unwrap();
      onCancel();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al procesar el pedido"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-medium text-gray-800">
            Cierre de PEDIDO
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {error && (
            <div className="p-2 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600">Total Sin Impuestos</p>
              <p className="text-2xl font-semibold">{totalFormatted}</p>
            </div>
            <p className="text-gray-600">{itemCount} Artículos</p>
          </div>

          <p className="text-sm text-gray-500 italic">
            Atención: El pedido está sujeto a disponibilidad de stock y/o
            cambios de precio sin previo aviso.
          </p>

          {/* Sección para obtener y mostrar la ubicación e insitu */}
          <div className="space-y-2">
            <p className="font-medium text-gray-700">GPS</p>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleGetLocation}
                className="w-6 h-6 rounded-full bg-emerald-500 cursor-pointer flex justify-center items-center"
                disabled={isSubmitting}
              >
                <CiGps className="text-white" />
              </button>
              <span className="text-gray-600">
                {insitu === null
                  ? "No verificado"
                  : insitu
                  ? "Insitu ✅"
                  : "No Insitu ❌"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="observations"
              className="block font-medium text-gray-700"
            >
              Observaciones
            </label>
            <textarea
              id="observations"
              rows={3}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Ingrese un comentario"
              value={observations}
              onChange={handleObservationChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                isCustomerLoading ||
                isPaymentLoading ||
                !selectedClientId
              }
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Procesando..." : "Aceptar"}
            </button>
          </div>
        </form>
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
