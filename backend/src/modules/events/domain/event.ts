import { z } from "zod";
import { eventInsertSchema } from "../../../db/schema/Event"
export const createEventSchema = z.object({
  ...eventInsertSchema.omit({ id: true,reservationId: true}).shape, // Mantiene las otras reglas
  //reservationId: createReservationSchema, // Sobrescribe el campo date
  reservationId: z.number().int(), // Cambia a number para la validación de ID
  ticketPriceGuest: z.number().nonnegative(), // Asegura que sea un número positivo
  ticketPriceMember: z.number().nonnegative(), // Asegura que sea un número positivo
});
export type CreateEvent=z.infer<typeof createEventSchema>;

export const querySchemaEvents  = z.object({
  ...eventInsertSchema.omit({id:true, ticketPriceGuest: true,
    ticketPriceMember: true,name:true,
    spaceUsed:true,description:true,
    reservationId:true,capacity:true,
    urlImage:true,numberOfAssistants:true,
  }).shape, // Mantiene las otras reglas
  date: z.string().optional(), // Cambia a number para la validación de ID
  startHour: z.string().optional(), // Cambia a number para la validación de ID
  endHour: z.string().optional(), // Cambia a number para la validación de ID
  isActive: z.coerce.boolean().default(true).optional(),
  allowOutsiders: z.coerce.boolean().default(false).optional(),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(10),
  orden: z.enum(['reciente', 'antiguo']).default('reciente')
});




export interface EventFilter {
  page: number;
  size: number;
  orden: 'reciente' | 'antiguo';
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  startHour: string | null;
  endHour: string | null;
  allowOutsiders: boolean;
}
