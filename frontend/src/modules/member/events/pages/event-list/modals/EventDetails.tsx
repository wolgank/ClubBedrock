import { EventInfo } from "@/shared/types/Activities";
import { useMemo } from "react";
import useEventInscriptionCheck from "../hooks/UseEventInscriptionCheck";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users } from "lucide-react";
import { isBeforeActivityDate, transformDate, transformHour } from "@/shared/utils/utils";

type EventDetailsProps = {
    event: EventInfo,
    canInscribeAndPay: boolean
    onGoToInscription: () => void,
    onClose: () => void
}

export default function EventDetails({ event, canInscribeAndPay, onGoToInscription, onClose } : EventDetailsProps) {
    const { inscribedList, loadingInscribed } = useEventInscriptionCheck(event);

    const isAnyoneInscribed = useMemo(() => {
        if(!inscribedList) return false;
        for(const userId in inscribedList)
            if(inscribedList[userId]) {
                return true;
            }
        return false;
    }, [inscribedList]);

    const isFull = useMemo(() => {
        return event.registerCount >= event.capacity;
    }, [event.capacity, event.registerCount]);

    const isAvailable = useMemo(() => {
        return isBeforeActivityDate(event.date);
    }, [event.date]);

    const buttonText = useMemo(() => {
        if(isAvailable) {
            if(isAnyoneInscribed)
                return `Modificar inscripción${isFull ? " (solo cancelaciones)": ""}`;
            else
                return `${isFull ? "Aforo máximo alcanzado" : "Ir a inscripción"}`;
        } else {
            return "Inscripciones cerradas"
        }
    }, [isAnyoneInscribed, isAvailable, isFull]);
    
    return (
        <div className="fixed inset-0 bg-[#000]/60 flex items-center justify-center z-100 h-full">
            <Card className="background-custom rounded-xl relative p-6">
                {/* Botón X */}
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-[var(--text-dark)] dark:text-white dark:hover:text-gray-400"
                    onClick={onClose}
                >
                    &times;
                </button>

                {/* Título */}
                <div className="flex items-center justify-between pl-5 pr-0 py-px">
                    <h1 className="font-bold text-[40.5px] text-[#142e38] tracking-[-1.22px] leading-[48.6px] dark:text-[var(--primary)]">
                        {event.name}
                    </h1>                    
                </div>

                <div className="flex items-start gap-2.5 px-2.5 ">
                    {/* Imagen e inscripción*/}
                    <div className="flex flex-col h-[397px] items-center justify-center gap-2.5 p-2.5">
                        <img
                            className="w-[446px] h-[324px] object-cover rounded-xl image-custom"
                            alt={event.name}
                            src={event.urlImage}
                        />
                        { !canInscribeAndPay ? null : (
                            loadingInscribed ? (
                                    <Button
                                        className="w-full background-custom text-[var(--text-dark)] dark:text-[var(--text-light)]"
                                        disabled
                                    >
                                        ...
                                    </Button>
                                ) : (
                                    <Button
                                        className={`w-full text-[var(--text-light)] font-medium rounded-[10px] cursor-pointer
                                            ${ isAnyoneInscribed || isFull || !isAvailable ? "button4-custom" : "button3-custom"}`}
                                        onClick={onGoToInscription}
                                        disabled={!isAvailable || (!isAnyoneInscribed && isFull)}
                                    >
                                        {buttonText}
                                    </Button>
                                )
                            )
                        }
                    </div>

                    {/* Información */}
                    <div className="flex flex-col w-[458px] items-start p-2.5 justify-center">
                        <div className="flex">
                            <div className="flex items-center gap-2.5 px-3 ">
                                <div className="inline-flex items-center gap-2.5 pl-0 pr-2.5 py-2.5 w-full">
                                    <Calendar className="w-6 h-6"/>
                                    <span className="font-bold text-base text-[#142e38] tracking-[-0.48px] leading-[19.2px] dark:text-[var(--primary)]">
                                        {transformDate(event.date)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 px-3 ">
                                <div className="inline-flex items-center gap-2.5 pl-0 pr-2.5 py-2.5 w-full">
                                    <Clock className="w-6 h-6"/>
                                    <span className="font-bold text-base text-[#142e38] tracking-[-0.48px] leading-[19.2px] dark:text-[var(--primary)]">
                                        {transformHour(event.startHour)} &gt; {transformHour(event.endHour)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 px-3 w-full">
                            <div className="inline-flex items-center gap-2.5 pl-0 pr-2.5 py-2.5">
                                <Users className={`w-6 h-6 ${isFull ? "text-red-800 dark:text-red-300" : ""}`} />
                                <span className={
                                    `font-bold text-base tracking-[-0.48px] leading-[19.2px] dark:text-[var(--primary)]
                                    ${ isFull ? "text-red-800 dark:text-red-300" : "text-[#142e38] dark:text-[var(--primary)]"}`
                                }
                                >
                                    {`${event.registerCount} / ${event.capacity}`}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-start justify-center gap-2.5 p-2.5 w-full">
                            <p className="w-[410px] font-medium text-sm text-[#142e38] tracking-[-0.42px] leading-[19.6px]  text-justify dark:text-[var(--primary)] break-words whitespace-pre-line">
                                {event.description}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}