import { z } from "zod";
import { memberInsertSchema } from "../../../db/schema/Member"
//import { createReservationSchema } from "./reservation"
export const createMemberSchema = z.object({
  ...memberInsertSchema.omit({ id: true}).shape, // Mantiene las otras reglas
  //reservationId: createReservationSchema, // Sobrescribe el campo date
  id: z.number().int(), // Permite que id sea opcional
  isActive: z.boolean(), // Permite que isActive sea opcional
});
export type CreateMember=z.infer<typeof createMemberSchema>;