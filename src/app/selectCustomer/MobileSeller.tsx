"use client"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { IoEnterOutline } from "react-icons/io5"

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

function DetailRow({ label, value, className = "", valueClassName = "text-gray-300" }: DetailRowProps) {
  return (
    <div className={`flex justify-between items-start ${className}`}>
      <span className="text-sm text-gray-400 font-semibold">{label}:</span>
      <span className={`text-sm ${valueClassName} text-right ml-4 font-medium`}>{value}</span>
    </div>
  )
}

function CustomerListMobile({ filteredItems, handleSelectCustomer }: any) {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const handleArrowClick = (customer: any) => {
    if (selectedCustomer?.id === customer.id && isModalOpen) {
      setIsModalOpen(false)
      setSelectedCustomer(null)
    } else {
      setSelectedCustomer(customer)
      setIsModalOpen(true)
    }
  }

  return (
    <>
      {/* Listado de clientes */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        {filteredItems?.map((customer: any, index: number) => (
          <div 
            key={customer.id} 
            className={index !== 0 ? "border-t border-gray-200" : ""}
          >
            <div
              className={`flex items-center gap-3 p-4 transition-all duration-200 hover:bg-gradient-to-r hover:from-pink-50 hover:via-purple-50 hover:to-blue-50 ${
                selectedCustomer?.id === customer.id && isModalOpen 
                  ? "bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100" 
                  : ""
              }`}
            >
              {/* Avatar */}
              <div className="rounded-full h-12 w-12 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white flex justify-center items-center text-lg font-bold flex-shrink-0 shadow-md">
                {customer.name.charAt(0).toUpperCase()}
              </div>

              {/* Contenido principal */}
              <div 
                className="flex-1 min-w-0 space-y-1 cursor-pointer" 
                onClick={() => handleArrowClick(customer)}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold text-gray-900 truncate">
                    {customer.name}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0 font-mono">
                    #{customer.id}
                  </span>
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {customer.address}, {customer.locality}
                </div>
              </div>

              {/* Flecha */}
              <div
                onClick={() => handleArrowClick(customer)}
                className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 cursor-pointer transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 flex-shrink-0 transition-all duration-300 ease-in-out ${
                    selectedCustomer?.id === customer.id && isModalOpen 
                      ? "rotate-90 text-purple-600" 
                      : "text-gray-400"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}

        {/* Estado vacío */}
        {!filteredItems?.length && (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 text-4xl mb-4">
              👥
            </div>
            <p className="text-gray-700 font-bold text-lg mb-2">
              {t("customerListMobile.noCustomersFound")}
            </p>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Intenta ajustar los filtros de búsqueda para encontrar clientes
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedCustomer && (
        <div
          className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/70 z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full mx-auto shadow-2xl border border-gray-200 animate-in slide-in-from-bottom duration-300 sm:max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full h-14 w-14 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white flex justify-center items-center text-xl font-bold shadow-lg">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    {selectedCustomer.name}
                  </h2>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    ID: {selectedCustomer.id}
                  </p>
                </div>
              </div>
              <button
                className="p-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:opacity-90 rounded-full text-white shadow-lg transition-all duration-200 hover:scale-110"
                onClick={() => handleSelectCustomer(selectedCustomer.id)}
                aria-label="Select customer"
              >
                <IoEnterOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Información del cliente */}
            <div className="space-y-4">
              {/* Información de contacto */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200">
                <h3 className="text-xs uppercase text-gray-600 font-bold mb-4 tracking-wide">
                  📍 {t("customerListMobile.contactInfo")}
                </h3>
                <div className="space-y-3">
                  <DetailRow
                    label={t("customerListMobile.address")}
                    value={selectedCustomer.address}
                    valueClassName="text-gray-900 font-semibold"
                  />
                  <DetailRow
                    label={t("customerListMobile.locality")}
                    value={selectedCustomer.locality}
                    valueClassName="text-gray-900 font-semibold"
                  />
                  <DetailRow
                    label={t("customerListMobile.state")}
                    value={selectedCustomer.state}
                    valueClassName="text-gray-900 font-semibold"
                  />
                  {selectedCustomer.gps && (
                    <DetailRow
                      label={t("customerListMobile.gps")}
                      value={selectedCustomer.gps}
                      valueClassName="text-blue-600 font-semibold"
                    />
                  )}
                </div>
              </div>

              {/* Información financiera */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200">
                <h3 className="text-xs uppercase text-gray-600 font-bold mb-4 tracking-wide">
                  💰 {t("customerListMobile.financialInfo")}
                </h3>
                <div className="space-y-3">
                  <DetailRow
                    label={t("customerListMobile.paymentCondition")}
                    value={selectedCustomer.payment_condition_id}
                    valueClassName="text-gray-900 font-semibold"
                  />
                  <DetailRow
                    label={t("customerListMobile.accountStatus")}
                    value={selectedCustomer.status_account ? `$${selectedCustomer.status_account.toLocaleString()}` : "$0"}
                    valueClassName="text-green-600 font-bold"
                  />
                  <DetailRow
                    label={t("customerListMobile.expiredDebt")}
                    value={
                      selectedCustomer.status_account_expired 
                        ? `$${selectedCustomer.status_account_expired.toLocaleString()}` 
                        : "$0"
                    }
                    valueClassName={
                      selectedCustomer.status_account_expired 
                        ? "text-red-600 font-bold" 
                        : "text-gray-400"
                    }
                  />
                  <DetailRow
                    label={t("customerListMobile.cartItems")}
                    value={`${selectedCustomer.shopping_cart.length} ${selectedCustomer.shopping_cart.length === 1 ? 'artículo' : 'artículos'}`}
                    valueClassName={
                      selectedCustomer.shopping_cart.length > 0 
                        ? "text-orange-600 font-bold" 
                        : "text-gray-400"
                    }
                  />
                </div>
              </div>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-6 w-full bg-gray-200 text-gray-900 py-3.5 px-4 rounded-2xl hover:bg-gray-300 active:bg-gray-400 transition-colors font-bold text-sm"
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