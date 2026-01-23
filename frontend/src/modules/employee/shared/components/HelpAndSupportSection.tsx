import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LayoutGrid, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export function AttendanceSummarySection() {
    const location = useLocation();
    const navigate = useNavigate();

    // Determinamos cuál está activo según la ruta
    const isConfiguracion = location.pathname === "/configuracion";
    const isAyuda = location.pathname === "/ayuda";

    // Funciones para navegar
    const goConfiguracion = () => navigate("/configuracion");
    const goAyuda = () => navigate("/ayuda");

    // Clase base para ambos botones
    const baseBtn = "flex items-center gap-2 h-auto px-2 py-1";

    // Clases para estados
    const activeBtn = "text-[#142e38] dark:text-[var(--brand)]";
    const inactiveBtn = "text-[var(--brand)] hover:text-[var(--brand-light)]";

    return (
        <section className="flex justify-center w-full p-2.5">
            <Card className="flex flex-row items-center justify-center gap-8 p-4 rounded-2xl shadow-md background-custom">
                {/* Configuración */}
                <Button
                    variant="ghost"
                    onClick={goConfiguracion}
                    className={`${baseBtn} ${isConfiguracion ? activeBtn : inactiveBtn}`}
                >
                    <Settings className="w-6 h-6" />
                    <span className="font-medium">Configuración</span>
                </Button>

                {/* Soporte / Ayuda */}
                <Button
                    variant="ghost"
                    onClick={goAyuda}
                    className={`${baseBtn} ${isAyuda ? activeBtn : inactiveBtn}`}
                >
                    <LayoutGrid className="w-6 h-6" />
                    <span className="font-medium">Soporte / Ayuda</span>
                </Button>
            </Card>
        </section>
    );
};

export default AttendanceSummarySection;
