"use client"

import { useState } from "react"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState("COMPROBANTES")
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 z-50" onClick={onClose}>
      <div className="h-full flex flex-col bg-zinc-900 max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-white">
              ←
            </button>
            <h2 className="text-xl font-semibold text-white">Pago</h2>
          </div>
          <span className="text-white">📄</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="border-b border-zinc-800">
            <InfoRow label="Fecha" value="20/01/2025" />
            <InfoRow
              label={
                <div className="flex items-center gap-2">
                  Gps <span className="text-red-500">📍</span>
                </div>
              }
              value={<span className="text-yellow-500">No Insitu</span>}
            />
            <InfoRow label="Importe Bruto" value="$ 0,00" />
            <InfoRow label="Importe Neto" value="$ 0,00" />
            <InfoRow label="Valores" value="$ 0,00" />
            <InfoRow label="Diferencia" value="$ 0,00" valueClassName="text-emerald-500" />
            <InfoRow label="Días de Pago" value="0 (0)" />
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-3">
            {["COMPROBANTES", "VALORES", "COMENTARIOS"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`p-4 text-sm font-medium ${
                  activeTab === tab ? "bg-white text-black" : "bg-zinc-900 text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === "COMPROBANTES" && <div className="text-white">Contenido de Comprobantes</div>}
            {activeTab === "VALORES" && <div className="text-white">Contenido de Valores</div>}
            {activeTab === "COMENTARIOS" && <div className="text-white">Contenido de Comentarios</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 mt-auto border-t border-zinc-800">
          <button
            onClick={() => setIsConfirmModalOpen(true)}
            className="w-full bg-blue-500 text-white py-3 rounded-md font-medium"
          >
            ENVIAR
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="bg-zinc-800 p-6 rounded-lg w-full max-w-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Confirmar Pago</h3>
            <input
              type="number"
              placeholder="Monto"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 mb-4 bg-zinc-700 text-white rounded"
            />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 mb-4 bg-zinc-700 text-white rounded"
            >
              <option value="">Seleccionar método de pago</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
            <div className="flex justify-end gap-4">
              <button onClick={() => setIsConfirmModalOpen(false)} className="px-4 py-2 bg-zinc-600 text-white rounded">
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Aquí iría la lógica para procesar el pago
                  console.log("Pago confirmado:", { amount, paymentMethod })
                  setIsConfirmModalOpen(false)
                  onClose()
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface InfoRowProps {
  label: React.ReactNode
  value: React.ReactNode
  valueClassName?: string
}

function InfoRow({ label, value, valueClassName = "text-white" }: InfoRowProps) {
  return (
    <div className="p-4 flex justify-between items-center border-b border-zinc-800">
      <span className="text-zinc-400">{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  )
}