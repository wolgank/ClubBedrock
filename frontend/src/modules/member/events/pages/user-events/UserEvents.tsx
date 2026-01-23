import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserEventsTable from "./components/UserEventsTable";


export default function UserEvents() {
    const navigate = useNavigate();
    
    return (
        <div className="flex flex-col items-center justify-center gap-8 px-4 sm:px-6 lg:px-12 py-8">
            {/* Botón Regresar */}
            <div className="relative w-full max-w-[1343px] ">
                <Button
                    onClick={() => navigate("/eventos")}
                    variant="ghost"
                    className="navigate-custom"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-normal text-base ">Regresar</span>
                </Button>
            </div>

            {/* Encabezado */}
            <div className="relative w-full max-w-[1343px] dark:text-[var(--primary)] flex justify-between items-end">
                <h1 className="font-bold text-5xl leading-[48px] ">
                    Historial de eventos
                </h1>
            </div>

            <Separator />

            <UserEventsTable />
      </div>
    )
}