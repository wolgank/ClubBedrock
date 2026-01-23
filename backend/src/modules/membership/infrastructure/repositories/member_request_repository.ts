import { db } from "../../../../db";
import { memberRequest } from "../../../../db/schema/MemberRequest";
import { sql, desc, eq, like, type ExtractTablesWithRelations,  } from "drizzle-orm";

export const findById = async (id: number) => {
  const [req] = await db
    .select()
    .from(memberRequest)
    .where(eq(memberRequest.id, id));
  return req;
};