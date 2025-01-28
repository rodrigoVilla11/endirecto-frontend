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
} from "lucide-react";
import { useRouter } from "next/navigation";
import PaymentModal from "./PaymentModal";
import { useState } from "react";
import VisitModal from "./VisitModal";

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
  const {
    data: customer,
    error,
    isLoading,
    refetch,
  } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  if (!customer) {
    return <>NOT FOUND CUSTOMER</>;
  }

  const handleNewOrder = () => {
    router.push("/catalogue");
  };

  return (
    <PrivateRoute
      requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"]}
    >
      <div className="min-h-screen bg-zinc-900 p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Customer Header */}
          <h1 className="text-xl font-bold text-white mb-6">
            {customer.id} - {customer.name}
          </h1>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-3 gap-3">
            <ActionCard
              icon={<Package className="h-6 w-6 text-red-500" />}
              title="Nuevo Pedido"
              onClick={handleNewOrder}
            />
            <ActionCard
              icon={<DollarSign className="h-6 w-6 text-red-500" />}
              title="Nuevo Pago"
              onClick={() => setIsPaymentModalOpen(true)}
            />

            <PaymentModal
              isOpen={isPaymentModalOpen}
              onClose={() => setIsPaymentModalOpen(false)}
            />
            <ActionCard
              icon={<MapPin className="h-6 w-6 text-red-500" />}
              title="Nueva Visita"
              onClick={() => setIsVisitModalOpen(true)}
            />
            <VisitModal
              isOpen={isVisitModalOpen}
              onClose={() => setIsVisitModalOpen(false)}
            />
          </div>

          {/* Full Width Action Card */}
          <ActionCard
            icon={<AlertCircle className="h-6 w-6 text-red-500" />}
            title="Nuevo Reclamo"
            onClick={() => {}}
            className="w-full"
          />

          {/* Catalog Section */}
          <section className="bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Archive className="h-6 w-6 text-zinc-400" />
              <h2 className="text-lg font-semibold text-white">Catálogo</h2>
            </div>
            <p className="text-sm text-zinc-300">
              Accedé a nuestro catálogo de artículos
            </p>
          </section>

          {/* Account Status */}
          <section className="bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-6 w-6 text-emerald-500" />
              <h2 className="text-lg font-semibold text-white">
                Estado de Cuenta
              </h2>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">
                $ customer.accountBalance
              </p>
              <p className="text-sm text-zinc-300">
                VENCIDO: $ customer.expiredBalance
              </p>
            </div>
          </section>

          {/* Pending Claims */}
          <section className="bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-zinc-400" />
              <h2 className="text-lg font-semibold text-white">
                Reclamos Pendientes
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
