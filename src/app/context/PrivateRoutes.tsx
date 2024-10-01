"use client";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface PrivateRouteProps {
  children: ReactNode;
  requiredRoles?: string[]; 
}

const PrivateRoute = ({ children, requiredRoles }: PrivateRouteProps) => {
  const { isAuthenticated, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (requiredRoles && !requiredRoles.includes(role!)) {
        router.push("/unauthorized");
      }
    }
  }, [isAuthenticated, role, requiredRoles, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {isAuthenticated && (!requiredRoles || requiredRoles.includes(role!))
        ? children
        : null}
    </>
  );
};
export default PrivateRoute;
