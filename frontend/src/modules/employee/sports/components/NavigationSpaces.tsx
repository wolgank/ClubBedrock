import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NavigationSpaces() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const path = location.pathname;

    const isEspacios = ["/employee-sport/espacios"].includes(path) || /^\/employee-sport\/espacios\/\d+$/.test(path);


    const isNuevoEspacio = pathname === "/employee-sport/nuevo-espacio";
    const isAgregarHorario = pathname === "/employee-sport/agregar-horario";

    const goEspacios = () => navigate("/employee-sport/espacios");
    const goNuevoEspacio = () => navigate("/employee-sport/nuevo-espacio");
    const goAgregarHorario = () => navigate("/employee-sport/agregar-horario");

    const baseBtn = "flex items-center gap-2 h-auto p-0";
    const activeText = "text-[#142e38] dark:text-[var(--brand)]";          // texto activo
    const inactiveText = "text-[var(--brand)] dark:text-[var(--primary)]";        // texto inactivo
    const underline = "border-b-2 border-[var(--brand)]";

    return (
        <section className="flex justify-start w-full p-2.5">
            <section className="flex items-center justify-center gap-8 p-4  rounded-2xl ">
                <Button
                    variant="ghost"
                    onClick={goEspacios}
                    className={`${baseBtn} ${isEspacios ? `${activeText} ${underline}` : inactiveText}`}
                >
                    <span className="font-medium text-lg">Espacios Deportivos</span>
                </Button>
                <Button
                    variant="ghost"
                    onClick={goNuevoEspacio}
                    className={`${baseBtn} ${isNuevoEspacio ? `${activeText} ${underline}` : inactiveText}`}
                >
                    <span className="font-medium text-lg">Nuevo Espacio</span>
                </Button>
                <Button
                    variant="ghost"
                    onClick={goAgregarHorario}
                    className={`${baseBtn} ${isAgregarHorario ? `${activeText} ${underline}` : inactiveText}`}
                >
                    <span className="font-medium text-lg">Gestionar Horarios</span>
                </Button>
            </section>
        </section>
    );
};

export default NavigationSpaces;
