import React from "react";
import DashboardPage from "../components/Dashboard/DashboardPage";
import PrivateRoute from "../context/PrivateRoutes";

const Dashboard = () => {
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
        <DashboardPage />
      </PrivateRoute>
    </div>
  );
};

export default Dashboard;
