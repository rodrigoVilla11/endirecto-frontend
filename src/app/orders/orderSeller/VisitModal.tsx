"use client"

import { useState } from "react"

interface VisitModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function VisitModal({ isOpen, onClose }: VisitModalProps) {
  const [showPredefinedComments, setShowPredefinedComments] = useState(false)
  const [observations, setObservations] = useState("")

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
            <h2 className="text-xl font-semibold text-white">Visita</h2>
          </div>
          <button className="text-white">ℹ️</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="border-b border-zinc-800">
            <InfoRow label="Fecha" value="20/01/2025" />
            <InfoRow
              label={
                <div className="flex items-center gap-2">
                  Gps
                  <span className="text-emerald-500">📍</span>
                  <span className="text-white">🌐</span>
                </div>
              }
              value={<span className="text-yellow-500">No Insitu</span>}
            />
          </div>

          {/* Predefined Comments Section */}
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
                {/* Add your predefined comments here */}
                <p className="text-zinc-400">No hay comentarios predefinidos</p>
              </div>
            )}
          </div>

          {/* Observations */}
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
            onClick={() => {
              console.log("Enviando visita:", { observations })
              onClose()
            }}
            className="w-full bg-blue-500 text-white py-3 rounded-md font-medium"
          >
            ENVIAR
          </button>
        </div>
      </div>
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

