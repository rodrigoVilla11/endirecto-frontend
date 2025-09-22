"use client";

import React from "react";
import { useTranslation } from "react-i18next";

const Unauthorized = () => {
  const { t } = useTranslation();
  return (
    <div className="flex justify-center items-center w-full h-screen text-center">
      {t("unauthorized.message", "No tienes acceso a esta página.")}
    </div>
  );
};

export default Unauthorized;
