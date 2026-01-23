import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useCourseInscriptionContext } from "../components/CourseInscriptionContext"
import { useCallback, useRef, useState } from "react"
import { processCancellations } from "../utils/CourseInscriptionOperations"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { useUser } from "@/shared/context/UserContext"

type ConfirmCourseIncriptionModalProps = {
    onGoToPayment: () => void
    onClose: () => void,
}

export default function ConfirmCourseIncriptionModal({ onGoToPayment, onClose }: ConfirmCourseIncriptionModalProps) {
    const navigate = useNavigate();
    const [loadingOperation, setLoadingOperation] = useState(false);
    const operationStartedRef = useRef(false);
    const {
        course,
        newInscriptions,
        newInscriptionsTotalCost,
        cancelledInscriptions,
    } = useCourseInscriptionContext();

    const { user, account } = useUser();

    const handleConfirm = useCallback(async () => {
        if (operationStartedRef.current) return;
        operationStartedRef.current = true;

        setLoadingOperation(true);

        const hasInscriptions = newInscriptions.length > 0;

        // caso general: NO HAY INS => solo cancelar y volver
        // caso -1: no hay cancelaciones, no hay ins (imposible, pues se chequea antes) -> se puede descartar
        // caso 1: hay cancelaciones, no hay ins => solo cancelar y volver

        // caso general: HAY INS => ir a pago
        // caso 2: hay cancelaciones, hay ins => ir a pago
        // caso 3: no hay cancelaciones, hay ins => ir a pago

        if(hasInscriptions) {
            setLoadingOperation(false);
            onGoToPayment();
        } else {
            try {
                if (!user?.id) throw new Error("No se pudo obtener el ID del usuario autenticado.");
                const userFullname = `${user.name} ${user.lastname}`;
                const userEmail = account.email;

                await processCancellations(course, cancelledInscriptions, userFullname, userEmail);

                setTimeout(() => {
                    setLoadingOperation(false);
                    navigate("/academias");
                }, 1000);
            }
            catch(error: unknown) {
                const msg = error instanceof Error ? error.message : "Error desconocido";
                console.error("Error en la operación:", msg);
                toast.error(msg);
            }
        }
    }, [cancelledInscriptions, course, navigate, newInscriptions.length, onGoToPayment]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-100 h-screen">
            <Card className="background-custom rounded-xl shadow-lg w-sm sm:w-2/3 sm:max-w-xl relative p-6">
            
                {/* Botón X */}
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-[var(--text-dark)]"
                    onClick={onClose}
                >
                    &times;
                </button>

                {/* Título del modal */}
                <h2 className="text-xl font-bold -mb-3 text-[var(--brand)]">
                    Confirmar cambios
                </h2>

                {/* Contenido del modal (resumen de los cambios a la inscripción)*/}
                <p className="-mb-1">
                    Se realizará:
                    { newInscriptions.length > 0 && (
                        <span className="block">
                            + Nuevas inscripciones: {newInscriptions.length} (Pago: S/. {newInscriptionsTotalCost})
                        </span>
                    )}
                    { cancelledInscriptions.length > 0 && (
                        <span className="block">
                            - Nuevas cancelaciones: {cancelledInscriptions.length}
                        </span>
                    )}
                </p>

                {/* Botones */}
                <div className="flex justify-center space-x-2 gap-4">
                    <Button
                        className="w-44 text-[var(--text-light)] font-medium cursor-pointer button3-custom"
                        onClick={handleConfirm}
                        disabled={loadingOperation}
                    >
                        { loadingOperation ? "..." : "Aceptar" }
                    </Button>
                    <Button
                        className="w-44 text-[var(--text-light)] font-medium cursor-pointer button4-custom"
                        onClick={onClose}
                        disabled={loadingOperation}
                    >
                        Cancelar
                    </Button>
                </div>

            </Card>
        </div>
    )
}