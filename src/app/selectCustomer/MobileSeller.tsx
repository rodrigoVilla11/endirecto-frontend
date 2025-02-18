"use client";
import React, { useState } from "react";
import { Key } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Customer {
  id: number;
  name: string;
  address: string;
  locality: string;
  state: string;
  payment_condition_id: string;
  status_account?: number;
  status_account_expired?: number;
  shopping_cart: any;
  gps?: string;
}

interface DetailRowProps {
  label: string;
  value: any;
  className?: string;
  valueClassName?: string;
}

function DetailRow({
  label,
  value,
  className = "",
  valueClassName = "text-zinc-300",
}: DetailRowProps) {
  return (
    <div className={`flex justify-between items-start ${className}`}>
      <span className="text-sm text-zinc-400 font-medium">{label}:</span>
      <span className={`text-sm ${valueClassName} text-right ml-4`}>
        {value}
      </span>
    </div>
  );
}

function CustomerListMobile({ filteredItems, handleSelectCustomer }: any) {
  const { t } = useTranslation();
  // Controla la apertura/cierre del modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Guarda el cliente seleccionado para mostrar sus datos en el modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  // Maneja el clic en la flecha
  const handleArrowClick = (customer: any) => {
    // Si ya está abierto el modal para ESTE cliente, al hacer click cerramos
    if (selectedCustomer?.id === customer.id && isModalOpen) {
      setIsModalOpen(false);
      setSelectedCustomer(null);
    } else {
      // Abrimos el modal (o lo reasignamos) para un nuevo cliente
      setSelectedCustomer(customer);
      setIsModalOpen(true);
    }
  };

  return (
    <>
      {/* Listado de clientes */}
      <div className="bg-primary shadow-sm">
        {filteredItems?.map((customer: any) => (
          <div key={customer.id}>
            <div className="flex items-center gap-3 p-3 active:bg-gray-50 transition-colors">
              {/* Avatar compacto */}
              <div className="rounded-full h-9 w-9 bg-white text-primary flex justify-center items-center text-sm font-medium flex-shrink-0">
                {customer.name.charAt(0).toUpperCase()}
              </div>

              {/* Contenido principal */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div
                  onClick={() => handleArrowClick(customer)}
                  className="flex items-baseline gap-2 cursor-pointer"
                >
                  <span className="text-[15px] font-medium text-white truncate">
                    {customer.name}
                  </span>
                  <span className="text-xs text-white flex-shrink-0">
                    #{customer.id}
                  </span>
                </div>
              </div>

              {/* Flecha que rota al hacer click */}
              <svg
                onClick={() => handleArrowClick(customer)}
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 text-gray-400 flex-shrink-0 cursor-pointer transition-transform duration-200 ${
                  selectedCustomer?.id === customer.id && isModalOpen
                    ? "rotate-90"
                    : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        ))}

        {/* Estado vacío mobile-friendly */}
        {!filteredItems?.length && (
          <div className="p-6 text-center">
            <div className="text-gray-400 text-3xl mb-2">🧑💼</div>
            <p className="text-sm text-gray-500">
              {t("customerListMobile.noCustomersFound")}
            </p>
          </div>
        )}
      </div>

      {/* Modal con más datos del cliente seleccionado */}
      {isModalOpen && selectedCustomer && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">
                {selectedCustomer.name}
              </h2>
              <button
                className="p-2 bg-red-500 rounded-md text-white"
                onClick={() => handleSelectCustomer(selectedCustomer.id)}
              >
                <Key />
              </button>
            </div>

            <div className="space-y-3">
              <DetailRow label={t("customerListMobile.id")} value={selectedCustomer.id} />
              <DetailRow label={t("customerListMobile.address")} value={selectedCustomer.address} />
              <DetailRow label={t("customerListMobile.locality")} value={selectedCustomer.locality} />
              <DetailRow label={t("customerListMobile.state")} value={selectedCustomer.state} />
              <DetailRow
                label={t("customerListMobile.paymentCondition")}
                value={selectedCustomer.payment_condition_id}
                className="border-b border-zinc-800 pb-3"
              />
              <DetailRow
                label={t("customerListMobile.accountStatus")}
                value={selectedCustomer.status_account}
                valueClassName="text-green-400"
              />
              <DetailRow
                label={t("customerListMobile.expiredDebt")}
                value={selectedCustomer.status_account_expired}
                valueClassName="text-red-400"
              />
              <DetailRow
                label={t("customerListMobile.cartItems")}
                value={selectedCustomer.shopping_cart.length.toString()}
              />
              <DetailRow label={t("customerListMobile.gps")} value={selectedCustomer.gps} />
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-6 w-full bg-zinc-800 text-white py-2.5 px-4 rounded-md hover:bg-zinc-700 transition-colors font-medium"
            >
              {t("customerListMobile.close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default CustomerListMobile;
