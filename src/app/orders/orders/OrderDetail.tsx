import React from "react";

interface OrderDetailProps {
  order: any;
  closeModal: () => void;
}

const OrderDetail = ({ order, closeModal }: OrderDetailProps) => {
  if (!order) return null;

   function formatPriceWithCurrency(price: number): string {
      const formattedNumber = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
        .format(price)
        .replace("ARS", "")
        .trim();
      return `${formattedNumber}`;
    }

  // Función para determinar el color del estado
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completada":
      case "entregada":
      case "pagada":
        return "bg-green-100 text-green-800";
      case "pendiente":
      case "en proceso":
        return "bg-yellow-100 text-yellow-800";
      case "cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-auto overflow-hidden">
      {/* Header con botón de cerrar */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800">
          Orden: {order.multisoft_id || "Sin ID"}
        </h2>
        <button
          onClick={closeModal}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-5">
        {/* Estado con indicador visual */}
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>

        {/* Información principal en grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Cliente</p>
              <p className="font-medium">{order.customer?.id || "No especificado"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Vendedor</p>
              <p className="font-medium">{order.seller?.id || "No especificado"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Condición de pago</p>
              <p className="font-medium">{order.payment_condition?.id || "No especificada"}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Fecha</p>
              <p className="font-medium">
                {new Date(order.date).toLocaleString("es-ES", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-medium text-lg text-green-700">
                {formatPriceWithCurrency(order.total)}
              </p>
            </div>
          </div>
        </div>

        {/* Notas */}
        {order.notes && (
          <div className="mb-6 bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-500 mb-1">Notas</p>
            <p className="text-gray-700">{order.notes}</p>
          </div>
        )}

        {/* Detalles */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-200">Detalles del pedido</h3>
          {order.details.length > 0 ? (
            <div className="bg-gray-50 rounded-md overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {order.details.map((detail: any, index: number) => (
                  <li key={index} className="p-3 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-center">
                      <span>{detail.tmp_id}</span>
                      <span className="text-gray-500 text-sm">#{index + 1}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 italic">No hay detalles disponibles</p>
          )}
        </div>

        {/* Botón de acción */}
        <div className="flex justify-end">
          <button
            onClick={closeModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md transition-colors shadow-sm font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;