"use client";
import React from "react";
import Header from "@/app/components/components/Header";
import { FaKey } from "react-icons/fa6";
import PrivateRoute from "@/app/context/PrivateRoutes";
import { useAuth } from "@/app/context/AuthContext";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";

const Page = () => {
  const { userData } = useAuth();
  console.log(userData);
  const { data: branchsData, isLoading: isLoadingBranchs } =
    useGetBranchesQuery(null);

  const branch = branchsData?.find((data) => data.id === userData?.branch);

  const headerBody = {
    buttons: [
      {
        logo: <FaKey />,
        title: "Change Password",
      },
    ],
    filters: [],
    results: "",
  };

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
      <div className="gap-4">
        <h3 className="font-bold p-4">MY PROFILE</h3>
        <Header headerBody={headerBody} />
        <div className="h-auto m-5 bg-white p-4 flex flex-col justify-between text-sm gap-8">
          <p>
            Id: <span className="font-bold">{userData?._id}</span>
          </p>
          <p>
            Name: <span className="font-bold">{userData?.username}</span>
          </p>
          <p>
            Role:{" "}
            <span className="font-bold">{userData?.role?.toUpperCase()}</span>
          </p>
          <p>
            Email: <span className="font-bold">{userData?.email}</span>
          </p>
          <p>
            Branch:{" "}
            <span className="font-bold">
              {branch
                ? branch.name
                : isLoadingBranchs
                ? "Loading branch..."
                : "Branch not found"}
            </span>
          </p>
        </div>
      </div>
    </PrivateRoute>
  );
};

export default Page;
