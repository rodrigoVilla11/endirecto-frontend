"use client";

import { useClient } from "@/app/context/ClientContext";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import {
  Package,
  DollarSign,
  MapPin,
  X,
  FileText,
  ShoppingCart,
  MessageSquare,
  Bell,
} from "lucide-react";
import { useRouter } from "next/navigation";
import PaymentModal from "./PaymentModal";
import { useState } from "react";
import VisitModal from "./VisitModal";
import {
  useGetBalancesSummaryQuery,
  useGetCustomerInformationByCustomerIdQuery,
} from "@/redux/services/customersInformations";
import { useMobile } from "@/app/context/ResponsiveContext";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/app/context/AuthContext";

interface CustomerDashboardProps {
  customer: {
    id: string;
    name: string;
    accountBalance: number;
    expiredBalance: number;
  };
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const { selectedClientId } = useClient();
  const { isMobile } = useMobile();
  const { t } = useTranslation();
  const { userData } = useAuth();

  const {
    data: customer,
    error,
    isLoading,
    refetch,
  } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });
  const {
    data,
    error: errorCustomerInfo,
    isLoading: isLoadingCustomerInfo,
  } = useGetCustomerInformationByCustomerIdQuery({
    id: selectedClientId ?? undefined,
  });
  const queryParams =
    selectedClientId && selectedClientId !== ""
      ? { customerId: selectedClientId }
      : userData?.role === "VENDEDOR"
      ? { sellerId: userData.seller_id }
      : {};

  const { data: totalDebt } = useGetBalancesSummaryQuery(queryParams);

  const formatedSumAmount = Number(
    totalDebt?.documents_balance
  )?.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formatedExpiredSumAmount = Number(
    totalDebt?.documents_balance_expired
  )?.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (!customer) {
    return <>{t("customerDashboard.notFoundCustomer")}</>;
  }

  const handleNewOrder = () => {
    router.push("/catalogue");
  };

  const formatCurrency = (n?: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(n ?? 0);

  const clamp = (v: number, min = 0, max = 100) =>
    Math.max(min, Math.min(max, v));

  const salesTarget = Number(customer.obs6) || 0;
  const salesSold = 320_000;

  const pct = salesTarget > 0 ? clamp((salesSold / salesTarget) * 100) : 0;

  const category = customer.obs5 || "";
  const visitDay = customer.obs4 || "";

  // DATOS HARDCODEADOS (avisar cuáles son):
  const monthlyOrders = 2; // HARDCODEADO - Total de pedidos mensuales
  const notificationsCount = 0; // HARDCODEADO - Cantidad de notificaciones

  return (
    <PrivateRoute
      requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"]}
    >
      <div className="min-h-screen p-4 mt-4">
        <div className="max-w-2xl mx-auto">
          {/* Main Card with Gradient Border */}
          <div className="bg-gradient-to-r from-red-500 via-white to-blue-500 p-[2px] rounded-3xl">
            <div className="bg-zinc-950 rounded-3xl p-6 space-y-6">
              {/* Customer Header */}
              <h1 className="text-2xl font-bold text-white text-center">
                {customer.id} - {customer.name}
              </h1>

              {/* Action Cards Grid */}
              <div className="grid grid-cols-4 gap-3">
                <ActionCard
                  icon={<Package className="h-8 w-8 text-orange-400" />}
                  title="NUEVO PEDIDO"
                  onClick={handleNewOrder}
                />
                <ActionCard
                  icon={<DollarSign className="h-8 w-8 text-green-400" />}
                  title="NUEVO PAGO"
                  onClick={() => setIsPaymentModalOpen(true)}
                />
                <ActionCard
                  icon={<MapPin className="h-8 w-8 text-red-400" />}
                  title="NUEVA VISITA"
                  onClick={() => setIsVisitModalOpen(true)}
                />
                <ActionCard
                  icon={<X className="h-8 w-8 text-red-500" />}
                  title="NO VENTA"
                  onClick={() => {}}
                  disabled
                />

                <PaymentModal
                  isOpen={isPaymentModalOpen}
                  onClose={() => setIsPaymentModalOpen(false)}
                />
                <VisitModal
                  isOpen={isVisitModalOpen}
                  onClose={() => setIsVisitModalOpen(false)}
                />
              </div>

              {/* Info Section */}
              {(customer.obs4 || customer.obs5 || customer.obs6) && (
                <div className="bg-zinc-800 rounded-2xl p-6 space-y-4">
                  {/* Info Grid */}
                  <div className="space-y-3">
                    <InfoRow
                      label="Categoría"
                      value={category || "A"} // HARDCODEADO: "A" si no hay categoría
                    />
                    <InfoRow
                      label="Día de visita"
                      value={visitDay || "LUNES"} // HARDCODEADO: "LUNES" si no hay día
                    />
                    <InfoRow
                      label="Objetivo de venta"
                      value={formatCurrency(salesTarget)}
                    />
                    <InfoRow label="Vendido" value={formatCurrency(salesSold)} />
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-10 bg-white rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-end pr-4">
                      <span className="text-lg font-bold text-zinc-900">
                        {Math.round(pct)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Status */}
              <section
                className="bg-zinc-800 rounded-2xl p-6 cursor-pointer hover:bg-zinc-700 transition-colors"
                onClick={() => router.push("/accounts/status")}
              >
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="h-7 w-7 text-white" />
                  <h2 className="text-xl font-bold text-white">
                    Estado de cuenta
                  </h2>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-white">
                    ${formatedSumAmount}
                  </p>
                  <p className="text-base text-red-400">
                    Vencido: ${formatedExpiredSumAmount}
                  </p>
                </div>
              </section>

              {/* Monthly Orders */}
              <section
                className="bg-zinc-800 rounded-2xl p-6 cursor-pointer hover:bg-zinc-700 transition-colors"
                onClick={() => router.push("/orders/orders")}
              >
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingCart className="h-7 w-7 text-white" />
                  <h2 className="text-xl font-bold text-white">
                    Pedidos mensuales
                  </h2>
                </div>
                <p className="text-lg text-gray-300">Total: {monthlyOrders}</p>
              </section>

              {/* CRM */}
              <section
                className="bg-zinc-800 rounded-2xl p-6 cursor-pointer hover:bg-zinc-700 transition-colors"
                onClick={() => router.push("/reclaims")}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-7 w-7 text-white" />
                  <h2 className="text-xl font-bold text-white">CRM</h2>
                </div>
              </section>

              {/* Notifications */}
              <section
                className="bg-zinc-800 rounded-2xl p-6 cursor-pointer hover:bg-zinc-700 transition-colors"
                onClick={() => router.push("/notifications")}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bell className="h-7 w-7 text-white" />
                    {notificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notificationsCount}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Notificaciones
                  </h2>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}

function ActionCard({ icon, title, onClick, disabled }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-700 rounded-2xl transition-all hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="rounded-xl bg-zinc-800 p-3">{icon}</div>
      <span className="text-xs font-bold text-white text-center leading-tight">
        {title}
      </span>
    </button>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-base text-white flex items-center gap-2">
        <span className="w-2 h-2 bg-white rounded-full" />
        {label}
      </span>
      <span className="text-base font-bold bg-white text-zinc-900 rounded-lg px-4 py-2">
        {value}
      </span>
    </div>
  );
}