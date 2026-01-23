import { db } from "../../../db";
import { coursepricicing as coursepricicingTable, coursePricicingInsertSchema } from "../../../db/schema/CoursePricing";
import { eq, and } from "drizzle-orm";


export const createCoursePricingTransaction = async (
  data: typeof coursePricicingInsertSchema._input,
  client: any // puedes tiparlo mejor si sabes que es un `Transaction`
) => {
    const validated = coursePricicingInsertSchema.parse(data);
    const result = await client
    .insert(coursepricicingTable)
    .values({
      numberDays: validated.numberDays,
      inscriptionPriceMember: validated.inscriptionPriceMember,
      inscriptionPriceGuest: validated.inscriptionPriceGuest,
      isActive: validated.isActive ?? true,
      academyCourseId: validated.academyCourseId,
    });

  return result;
};