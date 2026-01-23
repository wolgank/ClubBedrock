import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "@/shared/context/UserContext";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { account, loading } = useUser();

  if (loading) return <p>Cargando...</p>;
  if (!account) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(account.role ?? "")) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}
