import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function EmptyInscriptionsPanel() {
    return (
        <Card className="background-custom rounded-[10px] shadow-lg w-full max-w-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
                {/* Titulo */}
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-[var(--brand)]">Sin inscripciones previas</h2>
                </div>
                {/* Contenido */}
                <div className="flex gap-5">
                    <Info />
                    <p className="text-sm">
                        Esta actividad aún no tiene socios inscritos. Usa el otro panel para agregar nuevas inscripciones a la actividad.
                    </p>
                </div>
            </div>
        </Card>
    )
}