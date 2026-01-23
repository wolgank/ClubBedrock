import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClipboardList, LayoutGrid, BarChart3 } from "lucide-react";
export function AttendanceSummarySection() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  // Determinamos cuál está activo según la ruta
  //const isDashboard = location.pathname === "/employee-event/dashboard";
  const isEventos =
    ["/employee-event/eventos",
      "/employee-event/nuevo-evento"
    ].includes(path)                                                  // rutas fijas :contentReference[oaicite:0]{index=0}
    || /^\/employee-event\/eventos\/\d+$/.test(path);
  const isReportes = ["/employee-event/reportes"].includes(path);
  const isEspacios = ["/employee-event/espacios", "/employee-event/nuevo-espacio", "/employee-event/agregar-horario"].includes(path) || /^\/employee-event\/espacios\/\d+$/.test(path);
  // Funciones para navegar
  //const goDashboard = () => navigate("/employee-event/dashboard");
  const goEventos = () => navigate("/employee-event/eventos");
  const goEspacios = () => navigate("/employee-event/espacios");
  const goReportes = () => navigate("/employee-event/reportes");
  // Clase base para ambos botones
  const baseBtn = "flex items-center gap-2 h-auto p-0";

  // Clases para estados
  const activeBtn = "text-[#142e38] dark:text-[var(--brand)] ";
  const inactiveBtn = "text-[var(--brand)] hover:text-[#1e4e3e]   dark:text-[var(--primary)]";

  return (
    <section className="flex justify-center w-full p-2.5">
      <Card className="flex flex-row items-center justify-center gap-8 p-4 rounded-2xl shadow-md background-custom">
        {/* Dashboard 
        <Button
          variant="ghost"
          onClick={goDashboard}
          className={`${baseBtn} ${isDashboard ? activeBtn : inactiveBtn}`} 
        >
          <ClipboardList className="w-6 h-6" />
          <span className="font-medium text-lg ">Dashboard</span>
        </Button>
        */}
        {/* Espacios */}
        <Button
          variant="ghost"
          onClick={goEspacios}
          className={`${baseBtn} ${isEspacios ? activeBtn : inactiveBtn}`}
        >
          <LayoutGrid className="w-6 h-6" />
          <span className="font-medium text-lg">Espacios</span>
        </Button>
        {/* Eventos */}
        <Button
          variant="ghost"
          onClick={goEventos}
          className={`${baseBtn} ${isEventos ? activeBtn : inactiveBtn}`}
        >
          <LayoutGrid className="w-6 h-6" />
          <span className="font-medium text-lg">Eventos</span>
        </Button>
        <Button
          variant="ghost"
          onClick={goReportes}
          className={`${baseBtn} ${isReportes ? activeBtn : inactiveBtn}`}
        >
          <BarChart3 className="w-6 h-6" />
          <span className="font-medium text-lg">Reportes</span>
        </Button>
      </Card>
    </section>
  );
};

export default AttendanceSummarySection;
