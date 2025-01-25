"use client"
import React from "react";
import DashboardPage from "../components/Dashboard/DashboardPage";
import PrivateRoute from "../context/PrivateRoutes";
import { useAuth } from "../context/AuthContext";
import DashboardSeller from "../components/Dashboard/DashboardSeller";

const Dashboard = () => {
  const { role } = useAuth();

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
        {role !== "VENDEDOR" ? <DashboardPage /> : <DashboardSeller />}
      </PrivateRoute>
    </div>
  );
};

export default Dashboard;
