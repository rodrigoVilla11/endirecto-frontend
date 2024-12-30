"use client";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import React, { useEffect } from "react";

const Instance = ({ instances }: any) => {
  

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
      className={`h-auto m-5 p-1 flex justify-between items-center text-sm`}
      style={{ backgroundColor: bgColor }}
    >
      <h3 className="font-bold px-4">INSTANCE</h3>
      <div className="flex justify-center items-center w-full">
        <p className="font-bold px-4">Type: {instances.type}</p>
        <p className="font-bold px-4">Notes: {instances.notes}</p>
      </div>
    </div>
  );
};

export default Instance;
