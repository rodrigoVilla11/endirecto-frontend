import { useState, useEffect } from "react";

interface AddValueModalProps {
  onSubmit: (data: {
    amount: string;
    selectedReason: string;
    currency: string;
  }) => void;
}

export default function AddValueModal({ onSubmit }: AddValueModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("0.00");
  const [selectedReason, setSelectedReason] = useState("");
  const [currency, setCurrency] = useState("");

  // 📌 Cerrar modal con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // 📌 Prevenir scroll cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // 📌 Manejo del envío del formulario
  const handleSubmit = () => {
    if (!amount || !selectedReason || !currency) return; // Validación básica

    onSubmit({ amount, selectedReason, currency }); // 📌 Agregar al estado de ValueView
    setIsOpen(false);

    // Resetear el formulario
    setAmount("0.00");
    setSelectedReason("");
    setCurrency("")
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Agregar Valor
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md bg-gray-900 rounded-lg shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-gray-100">
                Agregar Valor
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                ✖
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Amount Input */}
              <div className="space-y-2">
                <span className="text-sm text-gray-400">Total Ingresado:</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    $
                  </span>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-8 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Reason Select */}
              <div className="space-y-2">
                <span className="text-sm text-gray-400">Tipo de Valor:</span>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled></option>
                  <option value="efectivo_pesos">EFECITO PESOS</option>
                  <option value="transferencia_pesos">
                    TRANSFERENCIA PESOS
                  </option>
                  <option value="tc">TC</option>
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-gray-400">Moneda:</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled></option>
                  <option value="PESOS">PESOS</option>
                  <option value="DOLARES">DOLARES</option>
                  <option value="EUROS">EUROS</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between gap-4 p-4 border-t border-gray-800">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 bg-transparent border border-gray-700 text-gray-300 rounded-md hover:bg-gray-800 hover:text-gray-100 transition-colors"
              >
                CANCELAR
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                ACEPTAR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
