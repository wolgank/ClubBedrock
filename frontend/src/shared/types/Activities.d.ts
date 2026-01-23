// Eventos
export type EventInfo = {
    id: number,
    name: string,
    date: string,
    startHour: string,
    endHour: string,
    allowOutsiders: boolean,
    description: string,
    spaceUsed: string,
    ticketPriceMember: number,
    ticketPriceGuest: number,
    capacity: number,
    numberOfAssistants: number,
    urlImage: string
    registerCount: number
}

// Academias
export type Academy = {
    id: number,
    name: string,
    sport?: string,
    description: string,
    urlImage: string,
    isActive: boolean
}

type CourseType = 'FIXED' | 'FLEXIBLE';

export type AcademyCourse = {
    id: number,
    academyId: number,
    name: string,
    courseType: CourseType
    startDate: string,
    endDate: string,
    capacity: number,
    description: string,
    allowOutsiders: boolean,
    isActive: boolean,
    schedule: CourseTimeSlot[]
    pricing: CoursePricingByDays[]
    registerCount: number,
    urlImage: string
}


type DayOfTheWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export type CourseTimeSlot = {
    id?: number,
    day: DayOfTheWeek,
    startTime: string,
    endTime: string
}

export type CoursePricingByDays = {
    id: number,
    numberDays: string,
    inscriptionPriceMember: string,
    inscriptionPriceGuest: string,
}

// Otros
export type InscriptionActionAllowed = 'no-action' | 'only-inscription' | 'inscription-modification';