import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"


interface Props {
    name: string;
    onAccept: () => void
    onCancel: () => void
    cargando: boolean
}

export default function ConfirmDeleteModal({ name, onAccept, onCancel, cargando }: Props) {
    return (
        <Card className="w-[562px]  rounded-xl border-none background-custom">
            <CardContent className="flex flex-col items-start gap-2 px-[30px] py-3">
                <h2 className="text-2xl font-bold text-[var(--brand)] dark:text-[var(--primary)]">
                    ¿Seguro que desea eliminar la inscripción de <span className=" text-[#142e38] dark:text-[var(--brand)]">{name}</span>?
                </h2>
                <p className="text-base ">
                    Esta acción no se puede deshacer.
                </p>
                <div className="flex items-center justify-between w-full mt-4">
                    <Button
                        className="w-[180px] h-[43px] text-white rounded-lg font-bold text-[13px] button3-custom"
                        disabled={cargando}
                        onClick={onAccept}
                    >
                        Eliminar Inscripción
                    </Button>
                    <Button
                        className="w-[180px] h-[43px] text-white rounded-lg font-bold text-[13px] button4-custom"
                        disabled={cargando}
                        onClick={onCancel}
                    >
                        Cancelar
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
