import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClipboardList, LayoutGrid, BarChart3 } from "lucide-react";


export function SpacesAcademiesSection() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  // Determinamos cuál está activo según la ruta
  const isEspacios = ["/employee-sport/espacios", "/employee-sport/nuevo-espacio", "/employee-sport/agregar-horario"].includes(path) || /^\/employee-sport\/espacios\/\d+$/.test(path);
  const isAcademias = ["/employee-sport/academias", "/employee-sport/nueva-academia", "/employee-sport/agregar-cursos"].includes(path) || /^\/employee-sport\/academias\/\d+$/.test(path);
  const isReportes = ["/employee-sport/reportes"].includes(path);

  // Funciones para navegar
  const goEspacios = () => navigate("/employee-sport/espacios");
  const goAcademias = () => navigate("/employee-sport/academias");
  const goReportes = () => navigate("/employee-sport/reportes");

  // Clase base para ambos botones
  const baseBtn = "flex items-center gap-2 h-auto p-0";

  // Clases para estados
  const activeBtn = "text-[#142e38] dark:text-[var(--brand)] ";
  const inactiveBtn = "text-[var(--brand)] hover:text-[#1e4e3e]   dark:text-[var(--primary)]";

  return (
    <section className="flex justify-center w-full p-2.5">
      <Card className="flex flex-row items-center justify-center gap-8 p-4 rounded-2xl shadow-md background-custom">
        {/* Dashboard */}
        <Button
          variant="ghost"
          onClick={goEspacios}
          className={`${baseBtn} ${isEspacios ? activeBtn : inactiveBtn}`}
        >
          <ClipboardList className="w-6 h-6" />
          <span className="font-medium text-lg ">Espacios Deportivos</span>
        </Button>

        {/* Eventos */}
        <Button
          variant="ghost"
          onClick={goAcademias}
          className={`${baseBtn} ${isAcademias ? activeBtn : inactiveBtn}`}
        >
          <LayoutGrid className="w-6 h-6" />
          <span className="font-medium text-lg">Academias Deportivas</span>
        </Button>
        {/* Reportes */}
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

export default SpacesAcademiesSection;
