"use client"
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface PrivateRouteProps {
  children: ReactNode;
  requiredRoles?: string[]; // Múltiples roles permitidos
}

const PrivateRoute = ({ children, requiredRoles }: PrivateRouteProps) => {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (requiredRoles && !requiredRoles.includes(role!)) {
      router.push("/unauthorized");
    }
  }, [isAuthenticated, role, requiredRoles, router]);

  return <>{isAuthenticated && (!requiredRoles || requiredRoles.includes(role!)) ? children : null}</>;
};

export default PrivateRoute;
