import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function NoInscriptionsAllowedPanel() {
    return (
        <Card className="background-custom rounded-[10px] shadow-lg w-full max-w-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
                {/* Titulo */}
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-[var(--brand)]">Nuevas inscripciones no permitidas</h2>
                </div>
                {/* Contenido */}
                <div className="flex gap-5">
                    <Info />
                    <p className="text-sm">
                        Esta actividad ha llegado a su aforo máximo. Solo puede realizar cancelaciones de las inscripciones vigentes de esta actividad.
                    </p>
                </div>
            </div>
        </Card>
    )
}