import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AcademyCourse } from "@/shared/types/Activities"
import { Calendar, Users } from "lucide-react"
import { dayMap } from "../../../utils/utils"
import { transformDate } from "@/shared/utils/utils"

type CourseCardProps = {
    course: AcademyCourse,
    onSeeMore: () => void
}

function priceFormat(str: string) {
    return str === "0.00" ? "GRATIS" : `S/. ${str}`;
}

export default function CourseCard({ course, onSeeMore }: CourseCardProps) {
    return (
            <Card
                key={`course-${course.id}`}
                className="w-full p-6 rounded-md shadow-md bg-[#f3f0ea] dark:bg-gray-800 transition-transform hover:scale-[1.02]"
            >
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-semibold mb-1">
                            {course.name}
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar size={18}/>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {transformDate(course.startDate)} &gt; {transformDate(course.endDate)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users size={18}/>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {course.capacity} vacantes
                                </span>
                            </div>
                        </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm
                        ${course.courseType === 'FIXED'
                            ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}
                    >
                        {course.courseType}
                    </span>
                </div>

                {/* Cuerpo */}
                <div className="text-sm mb-4">
                    <Accordion type="multiple" className="w-full mt-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Horarios */}
                        <AccordionItem value={`horario-${course.id}`} className="md:border-none">
                            <AccordionTrigger className="text-left text-sm font-medium">
                                Horario del curso
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-gray-700 dark:text-gray-300 ml-1">
                                {course.courseType === 'FLEXIBLE' && (
                                    <p className="italic text-blue-700 dark:text-blue-300 mb-1">
                                        Elige tus días entre:
                                    </p>
                                )}
                                <ul className="space-y-0.5">
                                    {course.schedule.map((slot) => (
                                    <li key={slot.day}>
                                        <span className="font-medium">{dayMap[slot.day]}:</span>{' '}
                                        {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                                    </li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Precios */}
                        <AccordionItem value={`precios-${course.id}`}>
                            <AccordionTrigger className="text-left text-sm font-medium">
                                Ver precios
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-gray-700 dark:text-gray-300 ml-1">
                            {course.courseType === 'FIXED' && course.pricing.length === 1 ? (
                                <ul className="space-y-0.5">
                                    <li key="precio-socios">
                                        <span className="font-medium">Socios:</span> {priceFormat(course.pricing[0].inscriptionPriceMember)}
                                    </li>
                                    { course.allowOutsiders && (
                                        <li key="precio-externos">
                                            <span className="font-medium">Externos:</span> {priceFormat(course.pricing[0].inscriptionPriceGuest)}
                                        </li>
                                    )}
                                </ul>
                            ) : (
                                <ul className="divide-y">
                                    {course.pricing.map((price) => {
                                        return (
                                            <li key={price.id} className="ml-1 py-0.5 border-gray-400 dark:border-gray-500">
                                                <span className="font-medium">{price.numberDays} día(s)/semana:</span><br />
                                                <span className="ml-2">Socios: {priceFormat(price.inscriptionPriceMember)}</span>
                                                { course.allowOutsiders && (
                                                    <span>, Externos: {priceFormat(price.inscriptionPriceGuest)}</span>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                {/* Botón de 'Ver más' */}
                <div className="flex justify-end">
                    <Button
                        className="mt-2 text-[var(--text-light)] font-medium rounded-[10px] cursor-pointer button3-custom"
                        size="sm"
                        onClick={onSeeMore}
                    >
                        Ver más
                    </Button>
                </div>
            </Card>
    )
}