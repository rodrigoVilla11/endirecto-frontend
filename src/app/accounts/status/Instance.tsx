"use client";
import React from "react";
import { useTranslation } from "react-i18next";

const Instance = ({ instances }: any) => {
  const { t } = useTranslation();

  const priorityColors: Record<string, string> = {
    HIGH: "#F2420A", // Red-orange
    MEDIUM: "#FFBD59", // Yellow-orange
    LOW: "#00BF63", // Green
  };

  const bgColor = instances.priority
    ? priorityColors[instances.priority] || "#FFFFFF"
    : "#FFFFFF"; 

  return (
    <div
      className="h-auto m-5 p-1 flex justify-between items-center text-sm"
      style={{ backgroundColor: bgColor }}
    >
      <h3 className="font-bold px-4">{t("instance")}</h3>
      <div className="flex justify-center items-center w-full">
        <p className="font-bold px-4">
          {t("type")}: {instances.type}
        </p>
        <p className="font-bold px-4">
          {t("notes")}: {instances.notes}
        </p>
      </div>
    </div>
  );
};

export default Instance;
