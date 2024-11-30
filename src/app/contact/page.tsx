import React from "react";
import PrivateRoute from "../context/PrivateRoutes";

const Page = () => {
  return (
    <PrivateRoute
      requiredRoles={[
        "ADMINISTRADOR",
        "OPERADOR",
        "MARKETING",
        "VENDEDOR",
        "CUSTOMER",
      ]}
    >
      <div>Page</div>
    </PrivateRoute>
  );
};

export default Page;
