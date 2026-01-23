import { z } from "zod";
import { spaceInsertSchema } from "../../../db/schema/Space"
import { createReservationSchema } from "../../reservations/domain/reservation"
export const createSpaceSchema = z.object({
  ...spaceInsertSchema.omit({ id: true}).shape, // Mantiene las otras reglas
});