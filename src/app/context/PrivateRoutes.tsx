"use client";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { usePathname } from "next/navigation";

interface PrivateRouteProps {
  children: ReactNode;
  requiredRoles?: string[]; 
}

const PrivateRoute = ({ children, requiredRoles }: PrivateRouteProps) => {
  const { isAuthenticated, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (pathname === "/catalogues") {
        return;
      }
      if (!isAuthenticated) {
        router.push("/login");
      } else if (requiredRoles && !requiredRoles.includes(role!)) {
        router.push("/unauthorized");
      }
    }
  }, [isAuthenticated, role, requiredRoles, loading, router, pathname]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {isAuthenticated && (!requiredRoles || requiredRoles.includes(role!)) || pathname === "/catalogues"
        ? children
        : null}
    </>
  );
};

export default PrivateRoute;
