import { db } from "../../../../db";
import { sql, desc, eq, like, type ExtractTablesWithRelations,  } from "drizzle-orm";
import { membershipApplication } from "../../../../db/schema/MembershipApplication";
export const findById = async (id: number) => {
  const [app] = await db
    .select()
    .from(membershipApplication)
    .where(eq(membershipApplication.id, id));
  return app;
};
