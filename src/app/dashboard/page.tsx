"use client"
import React from "react";
import DashboardPage from "../components/Dashboard/DashboardPage";
import PrivateRoute from "../context/PrivateRoutes";
import { useAuth } from "../context/AuthContext";
import DashboardSeller from "../components/Dashboard/DashboardSeller";
import { useMobile } from "../context/ResponsiveContext";

const Dashboard = () => {
  const { role } = useAuth();

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
        {role === "VENDEDOR" && isMobile ? <DashboardSeller /> : <DashboardPage />}
      </PrivateRoute>
    </div>
  );
};

export default Dashboard;
