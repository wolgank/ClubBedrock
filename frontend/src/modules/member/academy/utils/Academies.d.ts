import { type Academy, type AcademyCourse, type CoursePricingByDays, type CourseTimeSlot } from "@/shared/types/Activities"
import { Member } from "@/shared/types/Person"

export type AcademyCourseInscription = {
    id?: number,
    member: Member,
    timeSlotsSelected: CourseTimeSlot[],
    pricingToApply: CoursePricingByDays
}

export type AcademyPageState = {
    selectedAcademy: Academy,
    hasCourseInfo: false
} | {
    selectedAcademy: Academy,
    hasCourseInfo: true,
    selectedCourse: AcademyCourse
}

export type UserCourseInscription = {
    academy: Academy,
    course: AcademyCourse,
    timeSlotsSelected: CourseTimeSlot[],
    pricingToApply?: CoursePricingByDays
}