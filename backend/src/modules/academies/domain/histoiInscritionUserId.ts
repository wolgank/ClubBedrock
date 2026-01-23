import { z } from 'zod';
import { dayOfTheWeek } from '../../../shared/enums/DayOfTheWeek';
import { academyCourseType } from '../../../shared/enums/AcademyCourseType';
import { formatDateToYMD, formatHourFromISOString } from '../../../shared/utils/formatsTime';
// Schema para cada bloque de horario
export const courseScheduleSchema = z.object({
  id: z.number().int().positive(),
  day: z.enum(dayOfTheWeek),
  startTime: z.string().regex(/^\d{2}:\d{2}h$/), // Ej. "17:00h"
  endTime: z.string().regex(/^\d{2}:\d{2}h$/),
});

// Schema para precios
export const coursePricingByDaysSchema = z.object({
  id: z.number().int().positive(),
  numberDays: z.string(), // se espera como string tipo "3"
  inscriptionPriceMember: z.string(),
  inscriptionPriceGuest: z.string(),
});

// Schema principal del curso
export const inscribedCourseSchema = z.object({
  course: z.object({
    id: z.number().int().positive(),
    academyId: z.number().int().positive(),
    name: z.string(),
    courseType: z.enum(academyCourseType),
    allowOutsiders: z.boolean(),
    registerCount: z.number().int().nonnegative(),
    capacity: z.number().int().nonnegative(),
    startDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'startDate debe estar en formato ISO 8601 válido' }
    ),
    endDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'endDate debe estar en formato ISO 8601 válido' }
    ),
    isActive: z.boolean(),
    description: z.string(),
    urlImage: z.string(),
    schedule: z.array(courseScheduleSchema),
    pricing: z.array(coursePricingByDaysSchema),
  }),
  selectedDays: z.array(z.number().int().min(1).max(7)), // Ej. [1,2,3]
});

// Esquema final de la respuesta
export const getHistoricUserIdResponseSchema = z.object({
  inscribedCourses: z.array(inscribedCourseSchema),
});
//===================
type RawHistoricItem = {
  id: number;
  academyId: number;
  name: string;
  courseType: string;
  allowOutsiders: boolean;
  registerCount?: number;
  capacity: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean | number;
  urlImage: string;
  description?: string;
  daySelection?: number[];
  inscriptionPriceMember?: string;
  inscriptionPriceGuest?: string;
  timeSlot: {
    id: number;
    day: typeof dayOfTheWeek[number];
    startHour: string;
    endHour: string;
    spaceUsed: string;
    reservationId: number;
  }[];
  pricing: {
    id: number;
    numberDays: string;
    inscriptionPriceMember: string;
    inscriptionPriceGuest: string;
  }[]
};


type TimeSlot = {
  id: number;
  day: typeof dayOfTheWeek[number];
  startHour: string;
  endHour: string;
  spaceUsed: string;
  reservationId: number;
};

type MappedResponse = {
  inscribedCourses: {
    course: {
      id: number;
      academyId: number;
      name: string;
      courseType: string;
      allowOutsiders: boolean;
      registerCount: number;
      capacity: number;
      startDate: string;
      endDate: string;
      isActive: boolean;
      description: string;
      urlImage: string;
      schedule: {
        id: number;
        day: string;
        startTime: string;
        endTime: string;
      }[];
      pricing: {
        id: number;
        numberDays: string;
        inscriptionPriceMember: string;
        inscriptionPriceGuest: string;
      }[];
    };
    selectedDays: number[];
  }[];
};

export function mapHistoricToResponse(historic: RawHistoricItem[]): MappedResponse {
  try {
    if (!Array.isArray(historic)) {
      throw new Error('Input must be an array');
    }

    const inscribedCourses = historic.map((item, index) => {
      if (!item.id || !item.academyId || !item.name || !item.startDate || !item.endDate || !item.timeSlot) {
        throw new Error(`Invalid course data at index ${index}`);
      }

      return {
        course: {
          id: item.id,
          academyId: item.academyId,
          name: item.name,
          courseType: item.courseType,
          allowOutsiders: item.allowOutsiders,
          registerCount: item.registerCount ?? 0,
          capacity: item.capacity,
          startDate: typeof item.startDate === "string" ? item.startDate : item.startDate.toISOString(),
          endDate: typeof item.endDate === "string" ? item.endDate : item.endDate.toISOString(),
          isActive: Boolean(item.isActive),
          urlImage: item.urlImage,
          description: item.description ?? '',
          schedule: item.timeSlot.map((slot) => ({
            id: slot.id,
            day: slot.day,
            startTime: formatHourFromISOString(slot.startHour),
            endTime: formatHourFromISOString(slot.endHour),
          })),
          pricing: item.pricing.map((price) => ({
            id: price.id,
            numberDays: price.numberDays ?? "0",
            inscriptionPriceMember: price.inscriptionPriceMember ?? "0",
            inscriptionPriceGuest: price.inscriptionPriceGuest ?? "0",
          })),
        },
        selectedDays: item.daySelection ?? [],
      };
    });

    return { inscribedCourses };

  } catch (error) {
    console.error('Error mapping historic response:', error);
    throw new Error('Failed to map historic response');
  }
}

