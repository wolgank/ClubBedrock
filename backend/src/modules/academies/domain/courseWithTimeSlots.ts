import { z } from 'zod';
import { dayOfTheWeek } from '../../../shared/enums/DayOfTheWeek';
import { reservationSchema } from '../../reservations/domain/reservation';
import { academyCourse } from '../../../db/schema/AcademyCourse';
import { academyCourseType } from '../../../shared/enums/AcademyCourseType';
export const timeSlotSchema = z.object({
  day: z.enum(dayOfTheWeek),
  startHour: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endHour: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  spaceUsed: z.string().min(1),
  spaceId: z.number().int().positive(),
  reservation: reservationSchema,
});

export const coursePricingSchema = z.object({
  numberDays: z.number().nonnegative(), // 0 = ilimitado
  inscriptionPriceMember: z.string(), // o z.number().transform(...) si ya lo transformás
  inscriptionPriceGuest: z.string(),
  isActive: z.boolean().default(true),
});

export const createCourseWithTimeSlotsSchema = z.object({
  academyCourse: z.object({
    name: z.string().min(1),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    description: z.string().optional(),
    urlImage: z.string().nullable(),
    academyId: z.number().int().positive(),
    capacity: z.number().int().nonnegative(), // 0 = ilimitado
    allowOutsiders: z.boolean(),
    isActive: z.boolean().default(true),
    courseType: z.enum(academyCourseType), // Default to ONLINE if not provided
  }),
  timeSlots: z.array(timeSlotSchema).min(1),
  coursePricingList: z.array(coursePricingSchema).min(1),
});