"use client"
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import React, { useEffect } from "react";

const Instance = ({ selectedClientId }: any) => {
  const {
    data: customer,
    error,
    isLoading,
    refetch,
  } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const priorityColors: Record<string, string> = {
    HIGH: "#F2420A", // Red-orange
    MEDIUM: "#FFBD59", // Yellow-orange
    LOW: "#00BF63", // Green
  };

  // Obtener color según la prioridad
  const bgColor = customer?.instance.priority
    ? priorityColors[customer.instance.priority]
    : "#FFFFFF"; // Blanco por defecto si no hay prioridad

    useEffect(() => {
        if (customer?.instance) {
          refetch();
        }
      }, [customer?.instance, refetch]);

  return (
    <div
      className={`h-auto m-5 p-1 flex justify-between items-center text-sm`}
      style={{ backgroundColor: bgColor }} // Estilo inline para el fondo
    >
      <h3 className="font-bold px-4">INSTANCE</h3>
      <div className="flex justify-center items-center w-full">
        <p className="font-bold px-4">Type: {customer?.instance.type}</p>
        <p className="font-bold px-4">Notes: {customer?.instance.notes}</p>
      </div>
    </div>
  );
};

export default Instance;
