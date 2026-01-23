import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function EventosTabsSection() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const path = location.pathname;

    const isEventos = ["/employee-event/eventos"].includes(path) || /^\/employee-event\/eventos\/\d+$/.test(path);
    const isNuevoEvento = pathname === "/employee-event/nuevo-evento";

    const goEventos = () => navigate("/employee-event/eventos");
    const goNuevoEvento = () => navigate("/employee-event/nuevo-evento");

    const baseBtn = "flex items-center gap-2 h-auto p-0";
    const activeText = "text-[#142e38] dark:text-[var(--brand)]";          // texto activo
    const inactiveText = "text-[var(--brand)] dark:text-[var(--primary)]";        // texto inactivo
    const underline = "border-b-2 border-[var(--brand)]";

    return (
        <section className="flex justify-start w-full p-2.5">
            <section className="flex items-center justify-center gap-8 p-4  rounded-2xl ">
                {/* Eventos */}
                <Button
                    variant="ghost"
                    onClick={goEventos}
                    className={`
            ${baseBtn}
            ${isEventos ? `${activeText} ${underline}` : inactiveText}
          `}
                >
                    <span className="font-medium text-lg">Eventos</span>
                </Button>

                {/* Nuevo Evento */}
                <Button
                    variant="ghost"
                    onClick={goNuevoEvento}
                    className={`
            ${baseBtn}
            ${isNuevoEvento ? `${activeText} ${underline}` : inactiveText}
          `}
                >
                    <span className="font-medium text-lg">Nuevo Evento</span>
                </Button>


            </section>
        </section>
    );
};

export default EventosTabsSection;
