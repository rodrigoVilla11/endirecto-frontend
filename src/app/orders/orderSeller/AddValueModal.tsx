import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface AddValueModalProps {
  onSubmit: (data: {
    amount: string;
    selectedReason: string;
    currency: string;
  }) => void;
}

export default function AddValueModal({ onSubmit }: AddValueModalProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("0.00");
  const [selectedReason, setSelectedReason] = useState("");
  const [currency, setCurrency] = useState("");

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = () => {
    if (!amount || !selectedReason || !currency) return;

    onSubmit({ amount, selectedReason, currency });
    setIsOpen(false);

    setAmount("0.00");
    setSelectedReason("");
    setCurrency("");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        {t("add_value")}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md bg-gray-900 rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-gray-100">
                {t("add_value")}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                ✖
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <span className="text-sm text-gray-400">{t("total_entered")}:</span>
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

              <div className="space-y-2">
                <span className="text-sm text-gray-400">{t("value_type")}:</span>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled></option>
                  <option value="efectivo_pesos">{t("cash_pesos")}</option>
                  <option value="transferencia_pesos">{t("transfer_pesos")}</option>
                  <option value="tc">{t("credit_card")}</option>
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-gray-400">{t("currency")}:</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled></option>
                  <option value="PESOS">{t("pesos")}</option>
                  <option value="DOLARES">{t("dollars")}</option>
                  <option value="EUROS">{t("euros")}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between gap-4 p-4 border-t border-gray-800">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 bg-transparent border border-gray-700 text-gray-300 rounded-md hover:bg-gray-800 hover:text-gray-100 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {t("accept")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}