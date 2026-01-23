import { z } from "zod";
import { eventInscriptionInsertSchema } from "../../../db/schema/EventInscription"
import {createEventSchema} from "./event"
import {createInscriptionXUserSchema} from "./inscriptionXUser"
export const createEventInscriptionISchema = z.object({
  ...eventInscriptionInsertSchema.omit({ id: true, eventId: true, inscriptionXUser: true}).shape, // Mantiene las otras reglas
  eventId: createEventSchema,inscriptionXUser :createInscriptionXUserSchema,
});
export type CreateEventInscription=z.infer<typeof createEventInscriptionISchema>;