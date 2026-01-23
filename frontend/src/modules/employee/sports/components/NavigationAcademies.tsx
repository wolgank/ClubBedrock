import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NavigationAcademies() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const path = location.pathname;

    const isAcademias = ["/employee-sport/academias"].includes(path) || /^\/employee-sport\/academias\/\d+$/.test(path);
    const isNuevaAcademia = pathname === "/employee-sport/nueva-academia";
    const isAgregarCurso = pathname === "/employee-sport/agregar-cursos";

    const goAcademias = () => navigate("/employee-sport/academias");
    const goNuevaAcademia = () => navigate("/employee-sport/nueva-academia");
    const goAgregarCurso = () => navigate("/employee-sport/agregar-cursos");

    const baseBtn = "flex items-center gap-2 h-auto p-0";
    const activeText = "text-[#142e38] dark:text-[var(--brand)]";          // texto activo
    const inactiveText = "text-[var(--brand)] dark:text-[var(--primary)]";        // texto inactivo
    const underline = "border-b-2 border-[var(--brand)]";

    return (
        <section className="flex justify-start w-full p-2.5">
            <section className="flex items-center justify-center gap-8 p-4  rounded-2xl ">
                {/* Academias */}
                <Button
                    variant="ghost"
                    onClick={goAcademias}
                    className={`
            ${baseBtn}
            ${isAcademias ? `${activeText} ${underline}` : inactiveText}
          `}
                >
                    <span className="font-medium text-lg">Academias Deportivas</span>
                </Button>

                {/* Nuevo Academia */}
                <Button
                    variant="ghost"
                    onClick={goNuevaAcademia}
                    className={`
            ${baseBtn}
            ${isNuevaAcademia ? `${activeText} ${underline}` : inactiveText}
          `}
                >
                    <span className="font-medium text-lg">Nueva Academia</span>
                </Button>

                {/* Agregar Curso */}
                <Button
                    variant="ghost"
                    onClick={goAgregarCurso}
                    className={`
            ${baseBtn}
            ${isAgregarCurso ? `${activeText} ${underline}` : inactiveText}
          `}
                >
                    <span className="font-medium text-lg">Agregar Cursos</span>
                </Button>
            </section>
        </section>
    );
};

export default NavigationAcademies;
