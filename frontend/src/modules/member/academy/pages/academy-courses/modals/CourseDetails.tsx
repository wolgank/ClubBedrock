import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { type AcademyCourse } from "@/shared/types/Activities"
import { Calendar, Users } from "lucide-react"
import { useMemo } from "react"
import useCourseInscriptionCheck from "../hooks/UseCourseInscriptionCheck"
import { isBeforeActivityDate, transformDate } from "@/shared/utils/utils"


type CourseDetailsProps = {
    course: AcademyCourse,
    canInscribeAndPay: boolean
    onGoToInscription: () => void,
    onClose: () => void
}

export default function CourseDetails({ course, canInscribeAndPay, onGoToInscription, onClose } : CourseDetailsProps) {
    const { inscribedList, loadingInscribed } = useCourseInscriptionCheck(course);

    const isAnyoneInscribed = useMemo(() => {
        if(!inscribedList) return false;
        for(const userId in inscribedList) if(inscribedList[userId]) return true;
        return false;
    }, [inscribedList]);

    const isAvailable = useMemo(() => {
        return isBeforeActivityDate(course.startDate);
    }, [course.startDate]);

    const buttonText = useMemo(() => {
        if(isAvailable) {
            return `${isAnyoneInscribed ? "Modificar inscripción" : "Ir a inscripción"}`;
        } else {
            return "Inscripciones cerradas";
        }
    }, [isAnyoneInscribed, isAvailable]);
    
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
                        {course.name}
                    </h1>                    
                </div>

                <div className="flex items-start gap-2.5 px-2.5 ">
                    {/* Imagen e inscripción*/}
                    <div className="flex flex-col h-[397px] items-center justify-center gap-2.5 p-2.5">
                        <img
                            className="w-[446px] h-[324px] object-cover rounded-xl image-custom"
                            alt={course.name}
                            src={course.urlImage || `${import.meta.env.VITE_BACKEND_URL_MEDIA}/Placeholder.png`}
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
                                            ${ isAnyoneInscribed || !isAvailable ? "button4-custom" : "button3-custom"}`}
                                        onClick={onGoToInscription}
                                        disabled={!isAvailable}
                                    >
                                        { buttonText }
                                    </Button>
                                )
                            )
                        }
                    </div>

                    {/* Información */}
                    <div className="flex flex-col w-[458px] items-start p-2.5 justify-center">
                        <div className="flex items-center gap-2.5 px-3 ">
                            <div className="inline-flex items-center gap-2.5 pl-0 pr-2.5 py-2.5 w-full">
                                <Calendar className="w-6 h-6"/>
                                <span className="font-bold text-base text-[#142e38] tracking-[-0.48px] leading-[19.2px] dark:text-[var(--primary)]">
                                    {transformDate(course.startDate)} &gt; {transformDate(course.endDate)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 px-3 w-full">
                            <div className="inline-flex items-center gap-2.5 pl-0 pr-2.5 py-2.5">
                                <Users className="w-6 h-6" />
                                <span className="font-bold text-base text-[#142e38] tracking-[-0.48px] leading-[19.2px] dark:text-[var(--primary)] ">
                                    {`${course.capacity} vacante${course.capacity > 1 ? "s" : ""}`}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-start justify-center gap-2.5 p-2.5 w-full">
                            <p className="w-[410px] font-medium text-sm text-[#142e38] tracking-[-0.42px] leading-[19.6px]  text-justify dark:text-[var(--primary)] break-words whitespace-pre-line">
                                {course.description}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
