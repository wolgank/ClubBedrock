import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"


interface Props {
    onAccept: () => void
    onCancel: () => void
}

export default function CancelPreReservaationModal({ onAccept, onCancel }: Props) {
    return (
        <Card className="w-[562px] rounded-xl border-none background-custom">
            <CardContent className="flex flex-col items-start gap-2 px-[30px] py-[25px]">
                <h2 className="text-2xl font-bold text-[var(--brand)] dark:text-[var(--primary)]">
                    ¿Quieres salir sin guardar los cambios?
                </h2>
                <p className="text-base text-[#142e38] dark:text-[var(--primary)]">
                    Tienes información sin guardar en el formulario de reserva. Si sales ahora, perderás todos los datos ingresados.


                </p>
                <div className="flex items-center justify-between w-full mt-4">
                    <Button
                        className="w-[180px] h-[43px] bg-[#5d7a5f] hover:bg-[#276e52] rounded-lg font-bold text-[13px] button3-custom dark:text-[var(--primary)]"
                        onClick={onAccept}
                    >
                        Continuar editando
                    </Button>
                    <Button
                        className="w-[180px] h-[43px] bg-[#142e38] hover:bg-[#276e52] rounded-lg font-bold text-[13px] button4-custom dark:text-[var(--primary)]"
                        onClick={onCancel}
                    >
                        Salir sin guardar
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
