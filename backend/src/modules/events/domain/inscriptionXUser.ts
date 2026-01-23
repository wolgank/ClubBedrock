import { z } from "zod";
import { inscriptionXUserInsertSchema } from "../../../db/schema/InscriptionXUser"

export const createInscriptionXUserSchema = z.object({
  ...inscriptionXUserInsertSchema.omit({ id: true, userId:true}).shape,
});
export type CreateInscriptionXUser=z.infer<typeof createInscriptionXUserSchema>;