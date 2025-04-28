"use client";
import React from "react";
import DashboardPage from "../components/Dashboard/DashboardPage";
import PrivateRoute from "../context/PrivateRoutes";
import { useAuth } from "../context/AuthContext";
import DashboardSeller from "../components/Dashboard/DashboardSeller";
import { useMobile } from "../context/ResponsiveContext";
import { useClient } from "../context/ClientContext";
import CustomerDashboard from "../orders/orderSeller/page";

const Dashboard = () => {
  const { role } = useAuth();
  const { selectedClientId } = useClient();

  const { isMobile } = useMobile();

  return (
    <div className="w-full">
      <PrivateRoute
        requiredRoles={[
          "ADMINISTRADOR",
          "OPERADOR",
          "MARKETING",
          "VENDEDOR",
          "CUSTOMER",
        ]}
      >
        {role === "VENDEDOR" && selectedClientId ? (
          <CustomerDashboard />
        ) : role === "VENDEDOR" && isMobile ? (
          <DashboardSeller />
        ) : (
          <DashboardPage />
        )}
      </PrivateRoute>
    </div>
  );
};

export default Dashboard;
