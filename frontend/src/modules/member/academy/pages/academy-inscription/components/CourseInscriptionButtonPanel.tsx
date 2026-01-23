import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";
import ConfirmCourseIncriptionModal from "../modals/ConfirmCourseInscriptionModal";
import RestoreInscriptionModal from "../../../../../../shared/modals/RestoreInscriptionModal";
import PaymentCourseInscriptionModal from "../modals/PaymentCourseInscriptionModal";
import { toast } from "sonner";

type ButtonPanelAction = 'restore' | 'summary' | 'pay' | null;

type CourseInscriptionButtonPanelProps = {
    inscriptionsHaveNotChanged: boolean,
    isOnlyInscription: boolean
    onRestore: () => void
}

export default function CourseInscriptionButtonPanel({ inscriptionsHaveNotChanged , isOnlyInscription, onRestore }: CourseInscriptionButtonPanelProps) {
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
                    <ConfirmCourseIncriptionModal
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
                    <PaymentCourseInscriptionModal
                        onClose={() => setButtonPanelAction(null)}
                    />
                }
            </div>
    )
}