"use client"

import { useState } from "react"
import { CartItem } from "./cart-item"

interface Item {
  id: string
  name: string
  price: number
  quantity: number
  selected: boolean
}

export default function Page() {
  const [items, setItems] = useState<Item[]>([
    { id: "1", name: "Producto 1", price: 13568.94, quantity: 2, selected: true },
    { id: "2", name: "Producto 2", price: 9999.99, quantity: 1, selected: false },
  ])

  const handleToggle = (id: string, selected: boolean) => {
    setItems(items.map((item) => (item.id === id ? { ...item, selected } : item)))
  }

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity < 1) return
    setItems(items.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const total = items.filter((item) => item.selected).reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="min-h-screen bg-black p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 bg-zinc-800/50 p-4 rounded-lg">
        <h1 className="text-white font-medium">Carro De Compras</h1>
        <div className="text-right">
          <p className="text-zinc-400 text-sm">Total sin impuestos</p>
          <p className="text-white font-medium">${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Cart Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <CartItem key={item.id} {...item} onToggle={handleToggle} onQuantityChange={handleQuantityChange} />
        ))}
      </div>
    </div>
  )
}

