"use client"
import { useState } from "react"
import { Key } from "lucide-react"
import { useTranslation } from "react-i18next"
import { IoEnter, IoEnterOutline } from "react-icons/io5"

interface Customer {
  id: number
  name: string
  address: string
  locality: string
  state: string
  payment_condition_id: string
  status_account?: number
  status_account_expired?: number
  shopping_cart: any
  gps?: string
}

interface DetailRowProps {
  label: string
  value: any
  className?: string
  valueClassName?: string
}

function DetailRow({ label, value, className = "", valueClassName = "text-zinc-300" }: DetailRowProps) {
  return (
    <div className={`flex justify-between items-start ${className}`}>
      <span className="text-sm text-zinc-400 font-medium">{label}:</span>
      <span className={`text-sm ${valueClassName} text-right ml-4`}>{value}</span>
    </div>
  )
}

function CustomerListMobile({ filteredItems, handleSelectCustomer }: any) {
  const { t } = useTranslation()
  // Controla la apertura/cierre del modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  // Guarda el cliente seleccionado para mostrar sus datos en el modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Maneja el clic en la flecha
  const handleArrowClick = (customer: any) => {
    // Si ya está abierto el modal para ESTE cliente, al hacer click cerramos
    if (selectedCustomer?.id === customer.id && isModalOpen) {
      setIsModalOpen(false)
      setSelectedCustomer(null)
    } else {
      // Abrimos el modal (o lo reasignamos) para un nuevo cliente
      setSelectedCustomer(customer)
      setIsModalOpen(true)
    }
  }

  return (
    <>
      {/* Listado de clientes */}
      <div className="bg-primary rounded-lg shadow-lg overflow-hidden">
        {filteredItems?.map((customer: any, index: number) => (
          <div key={customer.id} className={index !== 0 ? "border-t border-primary-foreground/10" : ""}>
            <div
              className={`flex items-center gap-3 p-4 transition-colors hover:bg-primary-foreground/5 active:bg-primary-foreground/10 ${
                selectedCustomer?.id === customer.id && isModalOpen ? "bg-primary-foreground/10" : ""
              }`}
            >
              {/* Avatar mejorado */}
              <div className="rounded-full h-10 w-10 bg-white text-primary flex justify-center items-center text-base font-semibold flex-shrink-0 shadow-sm">
                {customer.name.charAt(0).toUpperCase()}
              </div>

              {/* Contenido principal */}
              <div className="flex-1 min-w-0 space-y-1 py-1" onClick={() => handleArrowClick(customer)}>
                <div className="flex items-baseline gap-2 cursor-pointer">
                  <span className="text-base font-medium text-white truncate">{customer.name}</span>
                  <span className="text-xs text-zinc-400 flex-shrink-0 font-mono">#{customer.id}</span>
                </div>
                <div className="text-xs text-zinc-400 truncate">
                  {customer.address}, {customer.locality}
                </div>
              </div>

              {/* Flecha con mejor animación */}
              <div
                onClick={() => handleArrowClick(customer)}
                className="p-2 rounded-full hover:bg-primary-foreground/10 active:bg-primary-foreground/20 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 text-zinc-400 flex-shrink-0 transition-transform duration-300 ease-in-out ${
                    selectedCustomer?.id === customer.id && isModalOpen ? "rotate-90 text-white" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}

        {/* Estado vacío mejorado */}
        {!filteredItems?.length && (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/10 text-3xl mb-4">
              🧑‍💼
            </div>
            <p className="text-zinc-400 font-medium">{t("customerListMobile.noCustomersFound")}</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
              Intenta ajustar los filtros de búsqueda para encontrar clientes
            </p>
          </div>
        )}
      </div>

      {/* Modal mejorado */}
      {isModalOpen && selectedCustomer && (
        <div
          className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/70 z-50 p-4 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl border border-zinc-800 animate-in slide-in-from-bottom duration-300 sm:max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <div className="rounded-full h-12 w-12 bg-white text-primary flex justify-center items-center text-xl font-bold">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">{selectedCustomer.name}</h2>
                  <p className="text-xs text-zinc-500 font-mono">ID: {selectedCustomer.id}</p>
                </div>
              </div>
              <button
                className="p-2.5 bg-green-600 hover:bg-primary/90 active:bg-primary/80 rounded-full text-white shadow-lg transition-colors duration-200"
                onClick={() => handleSelectCustomer(selectedCustomer.id)}
                aria-label="Select customer"
              >
                <IoEnterOutline className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 mt-6">
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <h3 className="text-xs uppercase text-zinc-500 font-semibold mb-3">
                  {t("customerListMobile.contactInfo")}
                </h3>
                <div className="space-y-3">
                  <DetailRow
                    label={t("customerListMobile.address")}
                    value={selectedCustomer.address}
                    valueClassName="text-white font-medium"
                  />
                  <DetailRow
                    label={t("customerListMobile.locality")}
                    value={selectedCustomer.locality}
                    valueClassName="text-white font-medium"
                  />
                  <DetailRow
                    label={t("customerListMobile.state")}
                    value={selectedCustomer.state}
                    valueClassName="text-white font-medium"
                  />
                  <DetailRow
                    label={t("customerListMobile.gps")}
                    value={selectedCustomer.gps || "—"}
                    valueClassName="text-white font-medium"
                  />
                </div>
              </div>

              <div className="bg-zinc-800/50 rounded-xl p-4">
                <h3 className="text-xs uppercase text-zinc-500 font-semibold mb-3">
                  {t("customerListMobile.financialInfo")}
                </h3>
                <div className="space-y-3">
                  <DetailRow
                    label={t("customerListMobile.paymentCondition")}
                    value={selectedCustomer.payment_condition_id}
                    valueClassName="text-white font-medium"
                  />
                  <DetailRow
                    label={t("customerListMobile.accountStatus")}
                    value={selectedCustomer.status_account ? `$${selectedCustomer.status_account}` : "$0"}
                    valueClassName="text-emerald-400 font-semibold"
                  />
                  <DetailRow
                    label={t("customerListMobile.expiredDebt")}
                    value={
                      selectedCustomer.status_account_expired ? `$${selectedCustomer.status_account_expired}` : "$0"
                    }
                    valueClassName={
                      selectedCustomer.status_account_expired ? "text-red-400 font-semibold" : "text-zinc-400"
                    }
                  />
                  <DetailRow
                    label={t("customerListMobile.cartItems")}
                    value={selectedCustomer.shopping_cart.length}
                    valueClassName={
                      selectedCustomer.shopping_cart.length > 0 ? "text-amber-400 font-semibold" : "text-zinc-400"
                    }
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-6 w-full bg-zinc-800 text-white py-3 px-4 rounded-xl hover:bg-zinc-700 active:bg-zinc-600 transition-colors font-medium text-sm"
            >
              {t("customerListMobile.close")}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default CustomerListMobile

