import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEventInscriptionContext } from "../components/EventInscriptionContext";
import { getInscriptionDescription } from "@/modules/member/academy/pages/academy-inscription/utils/CourseInscriptionOperations";
import { useUser } from "@/shared/context/UserContext";
import { processCancellations, processNewInscriptions } from "../utils/EventInscriptionOperations";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import CardPaymentDropDown from "@/shared/components/ui/CardPaymentDropDown";
import { Button } from "@/components/ui/button";

type PaymentEventInscriptionModalProps = {
    onClose: () => void
}

export default function PaymentEventInscriptionModal({ onClose }: PaymentEventInscriptionModalProps) {
    const navigate = useNavigate();
    const [loadingPayment, setLoadingPayment] = useState(false);
    const {
        event,
        newInscriptions,
        newInscriptionsTotalCost,
        cancelledInscriptions,
    } = useEventInscriptionContext();

    const inscriptionDescription = useMemo(() => getInscriptionDescription(
        event.name,
        newInscriptions.length
    ), [event?.name, newInscriptions?.length])
    
    const paymentStartedRef = useRef(false);
    
    const { user, account } = useUser();
    
    const handlePayment = useCallback(async () => {
        // Si, de algún modo, un usuario presiona rápido cuando
        // el botón se vuelve a habilitar, esto lo evita, pues
        // paymentStarted se habrá puesto en 'true'
        if (paymentStartedRef.current) return;
        paymentStartedRef.current = true;
        
        setLoadingPayment(true);
        
        try {
            const userId = user?.id;
            
            if (!userId) throw new Error("No se pudo obtener el ID del usuario autenticado.");

            const userFullname = `${user.name} ${user.lastname}`;
            const userEmail = account.email;
            
            if(cancelledInscriptions.length > 0)
                await processCancellations(event, cancelledInscriptions, userFullname, userEmail);

            if(newInscriptions.length > 0)
                await processNewInscriptions(event, newInscriptions, newInscriptionsTotalCost, userId, inscriptionDescription, userFullname, userEmail);
            
            setTimeout(() => {
                setLoadingPayment(false);
                navigate("/eventos");
            }, 1000);
            
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Error desconocido";
            console.error("Error en la operación:", msg);
            toast.error(msg);
            onClose();
        } finally {
            setLoadingPayment(false);
        }
    }, [account?.email, cancelledInscriptions, event, inscriptionDescription, navigate, newInscriptions, newInscriptionsTotalCost, user?.id, user?.lastname, user?.name, onClose]);

    return (
        <div className="fixed inset-0 bg-[#000]/60 flex items-center justify-center z-100 h-full">
            <Card className="background-custom rounded-xl shadow-lg w-sm sm:w-2/3 sm:max-w-xl relative p-6">
                {/* Botón X */}
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-[var(--text-dark)] dark:text-white dark:hover:text-gray-400"
                    onClick={onClose}
                >
                    &times;
                </button>

                {/* Titulo */}
                <h2 className="text-xl font-bold text-[var(--brand)] text-center">
                    Pago de inscripciones
                </h2>
                
                {/* Contenido del panel */}
                <div>
                    {/* Detalles de la compra */}
                    <div className="space-y-4 mb-6 border-b border-[#DCDCDC] pb-4">
                        {/* Subtitulo */}
                        <h3 className="text-lg font-semibold text-[var(--brand-light)]">
                            Detalles de la compra
                        </h3>

                        {/* Detalles - contenido */}
                        <div className="flex gap-5">
                            {/* Importe */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Importe
                                </label>
                                <p>
                                    S/. {newInscriptionsTotalCost}
                                </p>
                            </div>
                            {/* Concepto */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Concepto:
                                </label>
                                <p>
                                    {inscriptionDescription}
                                </p>
                            </div>
                        </div>

                    </div>
                    {/* Métodos de pago */}
                    <div className="space-y-1">
                        {/* Subtitulo */}
                        <h3 className="text-lg font-semibold text-[var(--brand-light)]">
                            Métodos de pago
                        </h3>
                        {/* Métodos de pago - contenido (solo tarjeta por ahora) */}
                        { newInscriptionsTotalCost === 0.0 ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="text-sm text-gray-500 dark:text-gray-300">Esta inscripción no tiene costo</div>
                                <Button onClick={handlePayment} disabled={loadingPayment} className="button3-custom text-[var(--text-light)] w-52">
                                    { loadingPayment ? "..." : "Confirmar inscripciones" }
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-md p-4 mx-auto">
                                <Accordion type="single" collapsible>
                                    {/* Tarjeta */}
                                    <CardPaymentDropDown
                                        loadingPayment={loadingPayment}
                                        onPay={handlePayment}
                                    />
                                    {/* Otros métodos (si llega a haber) */}
                                </Accordion>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}