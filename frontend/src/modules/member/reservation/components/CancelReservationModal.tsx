import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ReservaInformacionBasica } from "../pages/Reservas"
import { useMutation } from "@tanstack/react-query"
import { deleteReservation } from "@/lib/api/apiReservationInscription"
import { toast } from "sonner"

interface Props {
    reserva: ReservaInformacionBasica
    onAccept: () => void
    onCancel: () => void
}

export default function CancelReservationModal({ reserva, onAccept, onCancel }: Props) {



    return (
        <Card className="w-[562px] bg-[#f3f0ea] rounded-xl border-none background-custom">
            <CardContent className="flex flex-col items-start gap-2 px-[30px] py-[10px]">
                <h2 className="text-2xl font-bold text-[var(--brand)] dark:text-[var(--primary)]">
                    ¿Seguro que quieres anular tu reserva?
                </h2>
                <p className="text-base text-[#142e38] dark:text-[var(--primary)]">
                    Si haces click en ‘Aceptar’ se procederá con la cancelación de la reserva de espacio. Esta acción es irreversible. Se realizará la devolución de acuerdo a las políticas de la empresa de aplicarse.
                </p>
                <div className="flex items-center justify-between w-full mt-4">
                    <ReservationDelete id={reserva.id} onAccept={onAccept} />
                    <Button
                        className="w-[180px] h-[43px] rounded-lg font-bold text-[13px]  dark:text-[var(--primary)] button4-custom"
                        onClick={onCancel}
                    >
                        Mantener mi reserva
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function ReservationDelete({ id, onAccept }: { id: number; onAccept: () => void }) {
    const mutation = useMutation({
        mutationFn: deleteReservation,
        onError: () => {
            toast("Error", {
                description: "Algo salio mal en la cancelacion de la reserva. Intente mas tarde."
            })
        },
        onSuccess: () => {
            toast("Reserva cancelada", {
                description: "Se cancelo la reserva."
            })
            onAccept();
        },
    })

    return (
        <Button
            disabled={mutation.isPending}
            className="w-[180px] h-[43px] bg-[#6c886e] hover:bg-[#5d7a5f] rounded-lg font-bold text-[13px] dark:text-[var(--primary)] button3-custom"
            onClick={() => mutation.mutate({ id })}
        >
            {mutation.isPending ? "..." : "Aceptar"}
        </Button>
    );
}