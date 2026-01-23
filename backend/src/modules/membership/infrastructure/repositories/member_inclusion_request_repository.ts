import { db } from "../../../../db";
import { sql, desc, eq, like, type ExtractTablesWithRelations,  } from "drizzle-orm";
import { membershipApplication } from "../../../../db/schema/MembershipApplication";
import { memberInclusionRequest } from "../../../../db/schema/MemberInclusionRequest";
export const findById = async (id: number) => {
  const [inclusion] = await db
    .select()
    .from(memberInclusionRequest)
    .where(eq(memberInclusionRequest.id, id));
  return inclusion;
};
