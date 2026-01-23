import { db } from "../../../../db";
import { recomendationMember } from "../../../../db/schema/RecommendationMember";
import { sql, desc, eq, like, type ExtractTablesWithRelations,  } from "drizzle-orm";

export const findById = async (id: number) => {
  const [rec] = await db
    .select()
    .from(recomendationMember)
    .where(eq(recomendationMember.id, id));
  return rec;
};