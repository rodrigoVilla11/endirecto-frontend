"use client";

import { useClient } from "@/app/context/ClientContext";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import {
  Package,
  DollarSign,
  MapPin,
  AlertCircle,
  Archive,
  FileText,
  AlertTriangle,
  Link,
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
  const salesSold =  320_000;

  const pct = salesTarget > 0 ? clamp((salesSold / salesTarget) * 100) : 0;

  const category = customer.obs5 || "";
  const visitDay = customer.obs4 || "";

  return (
    <PrivateRoute
      requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"]}
    >
      <div
        className={`min-h-screen ${isMobile ? "bg-zinc-900" : ""} p-4 mt-10`}
      >
        <div className="max-w-md mx-auto space-y-4">
          {/* Customer Header */}
          <h1
            className={`text-xl font-bold ${isMobile ? "text-white" : ""} mb-6`}
          >
            {customer.id} - {customer.name}
          </h1>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-3 gap-3">
            <ActionCard
              icon={<Package className="h-6 w-6 text-red-500" />}
              title={t("customerDashboard.newOrder")}
              onClick={handleNewOrder}
            />
            <ActionCard
              icon={<DollarSign className="h-6 w-6 text-red-500" />}
              title={t("customerDashboard.newPayment")}
              onClick={() => setIsPaymentModalOpen(true)}
            />

            <PaymentModal
              isOpen={isPaymentModalOpen}
              onClose={() => setIsPaymentModalOpen(false)}
            />
            <ActionCard
              icon={<MapPin className="h-6 w-6 text-red-500" />}
              title={t("customerDashboard.newVisit")}
              onClick={() => setIsVisitModalOpen(true)}
            />
            <VisitModal
              isOpen={isVisitModalOpen}
              onClose={() => setIsVisitModalOpen(false)}
            />
          </div>

          {(customer.obs4 || customer.obs5 || customer.obs6) && (
            <>
              <section className="bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-lg p-4">
                <div className="mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">
                      Objetivo de venta
                    </span>
                    <span className="text-xs font-semibold bg-zinc-200 text-zinc-900 rounded-md px-2 py-1">
                      {formatCurrency(salesTarget)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">Vendido</span>
                    <span className="text-xs font-semibold bg-zinc-200 text-zinc-900 rounded-md px-2 py-1">
                      {formatCurrency(salesSold)}
                    </span>
                  </div>
                </div>

                {/* Barra de progreso estilo “rojo→verde” */}
                <div className="w-full h-6 bg-zinc-600/70 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-white drop-shadow-sm">
                      {Math.round(pct)}%
                    </span>
                  </div>
                </div>
              </section>

              <section className="bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-300">Categoría</span>
                  <span className="text-xs font-bold bg-zinc-200 text-zinc-900 rounded-md px-3 py-1">
                    {category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">Día de visita</span>
                  <span className="text-xs font-extrabold bg-zinc-200 text-zinc-900 rounded-md px-3 py-1">
                    {visitDay}
                  </span>
                </div>
              </section>
            </>
          )}

          {/* Catalog Section */}
          <section
            className="bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-lg p-4"
            onClick={() => router.push("/catalogue")}
          >
            <div className="flex items-center gap-3 mb-2">
              <Archive className="h-6 w-6 text-zinc-400" />
              <h2 className="text-lg font-semibold text-white">
                {t("customerDashboard.catalog")}
              </h2>
            </div>
            <p className="text-sm text-zinc-300">
              {t("customerDashboard.catalogDescription")}
            </p>
          </section>

          {/* Account Status */}
          <section
            className="bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-lg p-4"
            onClick={() => router.push("/accounts/status")}
          >
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-6 w-6 text-emerald-500" />
              <h2 className="text-lg font-semibold text-white">
                {t("customerDashboard.accountStatus")}
              </h2>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">
                $ {formatedSumAmount}
              </p>
              <p className="text-sm text-zinc-300">
                {t("customerDashboard.expired")} $ {formatedExpiredSumAmount}
              </p>
            </div>
          </section>

          {/* Pending Claims */}
          <section
            className="bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-lg p-4"
            onClick={() => router.push("/reclaims")}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-zinc-400" />
              <h2 className="text-lg font-semibold text-white">
                {t("customerDashboard.pendingClaims")}
              </h2>
            </div>
          </section>
        </div>
      </div>
    </PrivateRoute>
  );
}

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  className?: string;
}

function ActionCard({ icon, title, onClick, className = "" }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 
        bg-gradient-to-b from-zinc-700 to-zinc-800
        rounded-lg transition-colors hover:from-zinc-600 hover:to-zinc-700
        ${className}`}
    >
      <div className="rounded-full bg-white/10 p-3">{icon}</div>
      <span className="text-sm font-medium text-white text-center">
        {title}
      </span>
    </button>
  );
}
