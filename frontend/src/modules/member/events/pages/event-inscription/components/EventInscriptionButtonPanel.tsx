import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import ConfirmEventInscriptionModal from "../modals/ConfirmEventInscriptionModal";
import RestoreInscriptionModal from "@/shared/modals/RestoreInscriptionModal";
import PaymentEventInscriptionModal from "../modals/PaymentEventInscriptionModal";

type ButtonPanelAction = 'restore' | 'summary' | 'pay' | null;

type EventInscriptionButtonPanelProps = {
    inscriptionsHaveNotChanged: boolean,
    isOnlyInscription: boolean
    onRestore: () => void
}

export default function EventInscriptionButtonPanel({ inscriptionsHaveNotChanged , isOnlyInscription, onRestore }: EventInscriptionButtonPanelProps) {
    // Acciones de la botonera general
    const [buttonPanelAction, setButtonPanelAction] = useState<ButtonPanelAction>(null);

    const handleConfirmClick = useCallback(() => {
        if(inscriptionsHaveNotChanged) {
            toast.error("Agregue o anule por lo menos una inscripción para continuar");
        } else {
            setButtonPanelAction('summary');
        }
    }, [inscriptionsHaveNotChanged]);

    const handleRestoreClick = useCallback(() => {
        if(inscriptionsHaveNotChanged) {
            toast.error("No es posible restaurar si no ha realizado cambios en la inscripción.");
        } else {
            setButtonPanelAction('restore');
        }
    }, [inscriptionsHaveNotChanged]);

    return (
        <div className="flex flex-wrap items-center justify-center gap-4 mx-auto">
                <Button
                    className="w-56 text-[var(--text-light)] font-medium cursor-pointer button3-custom"
                    size="lg"
                    onClick={handleConfirmClick}
                >
                    Confirmar { isOnlyInscription ? "inscripciones" : "cambios" }
                </Button>

                <Button
                    className="w-56 text-[var(--text-light)] font-medium cursor-pointer button4-custom"
                    size="lg"
                    onClick={handleRestoreClick}
                >
                    Restaurar cambios
                </Button>
    
                { buttonPanelAction === 'summary' &&
                    <ConfirmEventInscriptionModal
                        onGoToPayment={() => setButtonPanelAction('pay')}
                        onClose={() => setButtonPanelAction(null)}
                    />
                }

                { buttonPanelAction === 'restore' &&
                    <RestoreInscriptionModal
                        onRestore={() => {
                            onRestore();
                            setButtonPanelAction(null);
                        }}
                        onClose={() => setButtonPanelAction(null)}
                    />
                }


                { buttonPanelAction === 'pay' && 
                    <PaymentEventInscriptionModal
                        onClose={() => setButtonPanelAction(null)}
                    />
                }
            </div>
    )
}