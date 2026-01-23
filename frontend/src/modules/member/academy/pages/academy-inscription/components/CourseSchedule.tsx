import { AcademyCourse, CourseTimeSlot } from "@/shared/types/Activities";
import { dayLabels } from "../../../utils/utils";

type CourseScheduleProps = {
    course: AcademyCourse,
    timeSlotsSelected: CourseTimeSlot[]
}

export default function CourseSchedule({ course, timeSlotsSelected }: CourseScheduleProps) {
    return (
        <ul className="flex justify-center gap-5">
            { course.schedule
                .map((timeSlot) => {
                    const wasSelected = timeSlotsSelected.includes(timeSlot);
                    return (
                        <li
                            key={timeSlot.day}
                            className={`rounded-full w-10 h-10 flex items-center justify-center
                                ${wasSelected ?
                                    'bg-[var(--brand)] text-white' :
                                    'bg-gray-300 dark:bg-gray-600 border text-gray-700 dark:text-gray-300'
                            }`
                        }>
                            {dayLabels[timeSlot.day]}
                        </li>
                    )
                })
            }
        </ul>
    )
}