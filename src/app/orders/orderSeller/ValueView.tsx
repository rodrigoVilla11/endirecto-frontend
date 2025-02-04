"use client";
import AddValueModal from "./AddValueModal";

export default function ValueView({ newValues, setNewValues }: any) {
  // 📌 newValues es un array de objetos con { amount, selectedReason }

  return (
    <div className="bg-gray-950 p-6 flex flex-col items-center justify-center space-y-4">
      {/* Botón para abrir el modal y agregar valores */}
      <AddValueModal
        onSubmit={(newValue) =>
          setNewValues((prev: any) => [...prev, newValue])
        }
      />

      {/* 📌 Mostrar la lista de valores agregados */}
      <ul className="text-white text-lg">
        {newValues.length === 0 ? (
          <li>No hay valores agregados.</li>
        ) : (
          newValues.map(
            (
              value: { amount: string; selectedReason: string; currency: string; },
              index: number
            ) => (
              <li key={index}>
                {value.amount} & {value.selectedReason} & {value.currency}
              </li>
            )
          )
        )}
      </ul>
    </div>
  );
}
