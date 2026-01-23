import { Card } from "@/components/ui/card"
import { type AcademyCourse, type DayOfTheWeek } from "@/shared/types/Activities"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { type AcademyCourseInscription } from "../../../utils/Academies"
import { type Member } from "@/shared/types/Person"
import { dayLabels } from "../../../utils/utils"
import { toast } from "sonner"

type CourseDaySelectionProps = {
    course: AcademyCourse,
    member: Member,
    onConfirm: (inscription: AcademyCourseInscription) => void,
    onClose: () => void
}

const days : DayOfTheWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const dayBaseClass = "w-12 h-12 rounded-full flex items-center justify-center font-semibold cursor-pointer transition";

export default function CourseDaySelection({ course, member, onConfirm, onClose } : CourseDaySelectionProps) {

    const availableDays = course.schedule.map((timeSlot) => timeSlot.day);
    
    const [daysSelected, setDaysSelected] = useState<DayOfTheWeek[]>([]);

    // handlers
    const handleDayClick = (day: DayOfTheWeek) => {
        if(!availableDays.includes(day)) return;

        // Si el número actual de días está en el límite de lo permitido,
        // no permitir seleccionar

        if(daysSelected.includes(day)) {
            setDaysSelected((prev) => prev.filter(d => d !== day));
        } else {
            // Si el número actual de días está en el límite de lo permitido,
            // // no permitir seleccionar
            if(daysSelected.length >= course.pricing.length) {
                toast.error("Está sobrepasando el límite de días que puede seleccionar. Retire algún otro día para seleccionar este.");
                return;
            }
            setDaysSelected((prev) => [...prev, day]);
        }
    }
    
    const handleConfirmSelectionClick = () => {
        if(daysSelected.length === 0) {
            toast.error("Seleccione por lo menos un día para continuar");
            return;
        }

        const timeSlotsSelected = course.schedule.filter((timeSlot) => {
            return daysSelected.includes(timeSlot.day);
        });

        const pricingToApply = course.pricing.find((pricing) => {
            return daysSelected.length.toString() === pricing.numberDays;
        });

        onConfirm({ member, timeSlotsSelected, pricingToApply });
    }    

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

                <h2 className="text-xl font-bold text-[var(--brand)] text-center">
                    Selección de días para el curso
                </h2>
                <p>
                    Selecciona los días a los que te inscribirás para <span className="font-bold">{course.name}</span> ({course.pricing.length} día(s) como máximo):
                </p>
                <div className="flex gap-5 flex-wrap justify-center">
                    {days.map((day, index) => {
                        const isAvailable = availableDays.includes(day);
                        const isSelected = daysSelected.includes(day);

                        if(!isAvailable) {
                            return (
                                <div
                                    key={`day-${index}`}
                                    className={`${dayBaseClass} bg-gray-200 text-gray-400 cursor-not-allowed`}
                                >
                                    {dayLabels[day]}
                                </div>
                            )
                        } else {
                            const time = (() => {
                                for(const timeSlot of course.schedule) {
                                    if(timeSlot.day === day) return `${timeSlot.startTime.slice(0, -3)} - ${timeSlot.endTime.slice(0, -3)}`;
                                }
                                return "";
                            })();

                            return (
                                <div key={`day-${index}`} className="flex flex-col items-center min-w-[64px]">
                                    <div
                                        className={`${dayBaseClass}
                                            ${isSelected ?
                                                'bg-[var(--brand)] text-white' :
                                                'bg-gray-300 dark:bg-gray-600 border text-gray-700 dark:text-gray-300'
                                            }`
                                        }
                                        onClick={() => handleDayClick(day)}
                                    >
                                        {dayLabels[day]}
                                    </div>
                                    <span className="text-[10px] leading-tight mt-1 text-center">
                                        {time}
                                    </span>
                                </div>
                            )
                        }
                    })}
                </div>
                <Button
                    className="mx-auto text-[var(--text-light)] font-medium rounded-[10px] cursor-pointer button3-custom"
                    size="default"
                    onClick={handleConfirmSelectionClick}
                >
                    Confirmar selección
                </Button>
            </Card>
        </div>
    )
}