//import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ClipboardList,
  LayoutGrid,
  CalendarDays,
  Home,
  Users,
  Info,
} from "lucide-react";
import { useUser } from "../../context/UserContext";


export default function EmployeeNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const { account, loading } = useUser();

  // Estilos
  const baseBtn = "flex items-center gap-2 h-auto p-0";
  const activeBtn = "text-[#142e38] dark:text-[var(--brand)]";
  const inactiveBtn = "text-[var(--brand)] hover:text-[#1e4e3e] dark:text-[var(--primary)]";

  if (loading || !account) return null; // aún cargando o no hay cuenta

  const userRole = account.role;


  const isEmployeeDashboard = path === "/employee-event/espacios";
  const isEmployeeEvents =
    ["/employee/events", "/employee/nuevo-evento"].includes(path) ||
    /^\/employee\/events\/\d+$/.test(path);

  const isEmployeeReservas = path.startsWith("/employee/reservas");

  const isAdminHome = path === "/admin";
  const isAdminAccounts =
    ["/admin/accounts", "/admin/accounts/nuevo"].includes(path) ||
    /^\/admin\/accounts\/\d+$/.test(path);

  const isAdminConfig =
    ["/admin/config", "/admin/config/ajustes"].includes(path) ||
    /^\/admin\/config\/.+$/.test(path);

  return (
    <div className="flex justify-center w-full p-2.5">
      <Card className="flex flex-row items-center justify-center gap-8 p-4 rounded-2xl shadow-md background-custom">
        {/* EVENTOS */}
        {userRole === "EVENTS" && (
          <>
            <Button
              variant="ghost"
              onClick={() => navigate("/employee-event/espacios")}
              className={`${baseBtn} ${isEmployeeDashboard ? activeBtn : inactiveBtn}`}
            >
              <ClipboardList className="w-5 h-5" />
              <span className="text-lg font-medium">Dashboard</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate("/employee-event/eventos")}
              className={`${baseBtn} ${isEmployeeEvents ? activeBtn : inactiveBtn}`}
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="text-lg font-medium">Eventos</span>
            </Button>
          </>
        )}

        {/* DEPORTES */}
        {userRole === "SPORTS" && (
          <Button
            variant="ghost"
            onClick={() => navigate("/employee/reservas")}
            className={`${baseBtn} ${isEmployeeReservas ? activeBtn : inactiveBtn}`}
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-lg font-medium">Reservas</span>
          </Button>
        )}

        {/* ADMIN */}
        {userRole === "ADMIN" && (
          <>
            <Button
              variant="ghost"
              onClick={() => navigate("/admin")}
              className={`${baseBtn} ${isAdminHome ? activeBtn : inactiveBtn}`}
            >
              <Home className="w-5 h-5" />
              <span className="text-lg font-medium">Home</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate("/admin/accounts")}
              className={`${baseBtn} ${isAdminAccounts ? activeBtn : inactiveBtn}`}
            >
              <Users className="w-5 h-5" />
              <span className="text-lg font-medium">Gestión de Cuentas</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate("/admin/config")}
              className={`${baseBtn} ${isAdminConfig ? activeBtn : inactiveBtn}`}
            >
              <Info className="w-5 h-5" />
              <span className="text-lg font-medium">Configuración del Club</span>
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
