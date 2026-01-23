import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Reservation } from "../pages/NuevaReserva";

interface Props {
    reservationValue: Reservation;
    onClose: () => void;
}

export default function MensajeDeAviso({ reservationValue, onClose }: Props) {
    return (
        <Card className="w-[527px]  rounded-xl background-custom">
            <CardContent className="flex flex-col items-start gap-2 px-[30px] py-[2px]">
                <h2 className="text-2xl font-bold text-[var(--brand)]  tracking-[0] leading-[normal] dark:text-[var(--primary)]">
                    ¡Reserva completada!
                </h2>

                <p className="self-stretch  font-medium text-[#222222] text-base tracking-[0] leading-[normal] dark:text-[var(--primary)]">
                    Pronto recibirás más información sobre tu reserva al correo
                </p>

                <div className="flex items-center justify-center w-full gap-5 px-5 py-[5px] mt-1">
                    <Button className="w-[137px] h-[43px]  rounded-lg border-0 font-bold text-white text-[13px] button3-custom" onClick={onClose}>
                        Ok
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}