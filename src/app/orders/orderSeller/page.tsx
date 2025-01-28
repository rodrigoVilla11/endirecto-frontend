"use client";
import PrivateRoute from "@/app/context/PrivateRoutes";
import React from "react";

const OrderSeller = () => {
  return (
    <PrivateRoute
      requiredRoles={["ADMINISTRADOR", "OPERADOR", "MARKETING", "VENDEDOR"]}
    >
      <div></div>
    </PrivateRoute>
  );
};

export default OrderSeller;
