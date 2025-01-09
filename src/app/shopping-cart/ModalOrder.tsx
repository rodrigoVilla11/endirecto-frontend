'use client'

import { X } from 'lucide-react'
import { useState } from 'react'
import { CiGps } from 'react-icons/ci'

interface OrderConfirmationProps {
  total: string
  itemCount: number
  onCancel: () => void
  order: any
}

export default function OrderConfirmation({
  total,
  itemCount,
  onCancel,
  order
}: OrderConfirmationProps) {
  const [observations, setObservations] = useState('')

  console.log(order)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-medium text-gray-800">Cierre de PEDIDO</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Total and Items Count */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600">Total Sin Impuestos</p>
              <p className="text-2xl font-semibold">$ {total}</p>
            </div>
            <p className="text-gray-600">{itemCount} Artículos</p>
          </div>

          {/* Warning Message */}
          <p className="text-sm text-gray-500 italic">
            Atención: El pedido está sujeto a disponibilidad de stock y/o cambios de precio sin previo aviso.
          </p>

          {/* GPS Section */}
          <div className="space-y-2">
            <p className="font-medium text-gray-700">Gps</p>
            <div className="flex items-center space-x-2">
              <button className="w-6 h-6 rounded-full bg-emerald-500 cursor-pointer flex justify-center items-center"> <CiGps className='text-white '/> </button>
              <span className="text-gray-600">No insitu</span>
            </div>
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <label htmlFor="observations" className="block font-medium text-gray-700">
              Observaciones
            </label>
            <textarea
              id="observations"
              rows={3}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Ingrese un comentario"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
            >
              Aceptar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
