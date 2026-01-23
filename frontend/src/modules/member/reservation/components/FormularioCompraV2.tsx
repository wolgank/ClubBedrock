import { Accordion } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import CardPaymentDropDown from "@/shared/components/ui/CardPaymentDropDown";
import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Reservation, Space } from "../pages/NuevaReserva";

type PaymentSpacePurchaseModalProps = {
    userID: number;
    spaceValue: Space;
    reservationValue: Reservation;
    costo: number; // Costo total de la reserva
    nombreCompleto: string;
    correo: string;
    onPurchase: () => void;
    onCancel: () => void;
};

export default function PaymentSpacePurchaseModal({
    userID,
    spaceValue,
    reservationValue,
    costo,
    nombreCompleto,
    correo,
    onPurchase,
    onCancel,
}: PaymentSpacePurchaseModalProps) {
    const navigate = useNavigate();
    const [loadingPayment, setLoadingPayment] = useState(false);
    const paymentStartedRef = useRef(false);

    // Genera descripción (concepto) de la reserva
    const concepto = `${spaceValue.name} - ${reservationValue.name}`;

    const handlePayment = useCallback(async () => {
        if (paymentStartedRef.current) return;
        paymentStartedRef.current = true;
        setLoadingPayment(true);

        try {
            // Ejecuta tu llamada API de reserva y pago
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/reservationSpaceInscription`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nombre: nombreCompleto,
                        correo,
                        espacio: spaceValue.name,
                        bill: {
                            finalAmount: costo,
                            status: "PAID",
                            description: reservationValue.description,
                            createdAt: new Date().toISOString(),
                            dueDate: new Date().toISOString(),
                            userId: Number(userID),
                        },
                        billDetail: {
                            price: costo,
                            discount: 0.0,
                            finalPrice: costo,
                            description: spaceValue.description,
                        },
                        inscription: { isCancelled: false, userId: Number(userID) },
                        reservationInscription: { isCancelled: false },
                        reservation: {
                            name: reservationValue.name,
                            date: reservationValue.date,
                            startHour: reservationValue.startHour,
                            endHour: reservationValue.endHour,
                            capacity: reservationValue.capacity,
                            allowOutsiders: reservationValue.allowOutsiders,
                            description: reservationValue.description,
                            spaceId: reservationValue.spaceId,
                        },
                    }),
                }
            );

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || "Error desconocido");
            }

            toast.success(<><strong>Reserva creada correctamente.</strong></>);
            onPurchase();
            navigate("/reservas");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Error desconocido";
            toast.error(msg);
        } finally {
            setLoadingPayment(false);
        }
    }, [costo, correo, nombreCompleto, onPurchase, reservationValue, spaceValue.name, userID, spaceValue.description, navigate]);

    return (
        <div className="fixed inset-0 bg-[#000]/60 flex items-center justify-center z-50">
            <Card className="background-custom rounded-xl shadow-lg w-sm sm:w-2/3 sm:max-w-xl relative p-6">
                {/* Botón de cerrar */}
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-[var(--text-dark)] dark:text-white dark:hover:text-gray-400"
                    onClick={onCancel}
                >
                    &times;
                </button>

                {/* Título */}
                <h2 className="text-xl font-bold text-[var(--brand)] text-center mb-4">
                    Confirmar compra
                </h2>

                {/* Detalles de la compra */}
                <div className="space-y-4 mb-6 border-b border-[#DCDCDC] pb-4">
                    <h3 className="text-lg font-semibold text-[var(--brand-light)]">
                        Detalles de la compra
                    </h3>

                    <div className="flex gap-5">
                        <div>
                            <label className="block text-sm font-medium mb-1">Importe</label>
                            <p>S/. {costo}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Concepto</label>
                            <p>{concepto}</p>
                        </div>
                    </div>
                </div>

                {/* Métodos de pago */}
                {costo > 0 ? (
                    // CASO 1: Si hay costo, muestra los métodos de pago
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-[var(--brand-light)]">
                            Métodos de pago
                        </h3>
                        <div className="rounded-md p-4 mx-auto">
                            <Accordion type="single" collapsible>
                                <CardPaymentDropDown
                                    loadingPayment={loadingPayment}
                                    onPay={handlePayment}
                                />
                            </Accordion>
                        </div>
                    </div>
                ) : (
                    // CASO 2: Si es gratis, muestra solo un botón de confirmación
                    <div className="flex flex-col items-center justify-center mt-6">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Esta reserva no tiene costo.
                        </p>
                        <button
                            onClick={handlePayment}
                            disabled={loadingPayment}
                            className="w-full max-w-xs h-[46px] text-white font-bold text-xl rounded-lg button3-custom"
                        >
                            {loadingPayment ? "Confirmando..." : "Confirmar Reserva"}
                        </button>
                    </div>
                )}
            </Card>
        </div>
    );
}
