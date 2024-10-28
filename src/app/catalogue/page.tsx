import React from "react";
import CataloguePage from "../components/Catalogue/CataloguePage";
import PrivateRoute from "../context/PrivateRoutes";

const Page = () => {
  return (
    <div>
      <PrivateRoute
        requiredRoles={[
          "ADMINISTRADOR",
          "OPERADOR",
          "MARKETING",
          "VENDEDOR",
          "CUSTOMER",
        ]}
      >
        <div className="h-full overflow-auto no-scrollbar">
          <CataloguePage />
        </div>
      </PrivateRoute>
    </div>
  );
};

export default Page;
