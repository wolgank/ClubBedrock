import { z } from "zod";
import { reservationInsertSchema } from "../../../db/schema/Reservation"

export const createReservationSchema = z.object({
  ...reservationInsertSchema.omit({ id: true}).shape, // Mantiene las otras reglas
});
export type CreateReservation=z.infer<typeof createReservationSchema>;


export const reservationSchema = z.object({
  name: z.string().min(1),
  startHour: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
  endHour: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
  capacity: z.number().int().nonnegative(),
  allowOutsiders: z.boolean(),
  description: z.string().optional(),
  spaceId: z.number().int().positive(),
});
