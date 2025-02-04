"use client"

interface CartItemProps {
  id: string
  name: string
  price: number
  quantity: number
  onToggle: (id: string, selected: boolean) => void
  onQuantityChange: (id: string, quantity: number) => void
  selected: boolean
}

export function CartItem({ id, name, price, quantity, onToggle, onQuantityChange, selected }: CartItemProps) {
  return (
    <div className="flex items-center gap-4 bg-zinc-800/50 p-4 rounded-lg">
      {/* Toggle Switch */}
      <div className="relative inline-block w-12 h-6">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={selected}
          onChange={(e) => onToggle(id, e.target.checked)}
          id={`toggle-${id}`}
        />
        <label
          htmlFor={`toggle-${id}`}
          className="absolute cursor-pointer inset-0 rounded-full bg-zinc-700 peer-checked:bg-blue-600 transition-colors"
        >
          <span className="absolute inset-1 aspect-square h-4 rounded-full bg-white transition-all peer-checked:translate-x-6" />
        </label>
      </div>

      {/* Item Details */}
      <div className="flex-1">
        <h3 className="text-white font-medium">{name}</h3>
        <p className="text-zinc-400 text-sm">${price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</p>
      </div>

      {/* Quantity Input */}
      <input
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => onQuantityChange(id, Number.parseInt(e.target.value, 10))}
        className="w-16 bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white text-center"
      />

      {/* Total */}
      <div className="text-right min-w-[100px]">
        <p className="text-white font-medium">
          ${(price * quantity).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  )
}
