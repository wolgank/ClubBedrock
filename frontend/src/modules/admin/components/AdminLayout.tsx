import { Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import EmployeeNavbar from "@/shared/components/ui/EmployeeNavBar";
import BackButton from "@/shared/components/ui/BackButton";

export default function AdminLayout() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col p-4 space-y-4">
      <BackButton/>
      {/* Navbar de Rol */}
      <EmployeeNavbar/>
      {/* Contenido de la página */}
      <div className="mt-4">
        <Outlet />
      </div>
    </div>
  );
}
