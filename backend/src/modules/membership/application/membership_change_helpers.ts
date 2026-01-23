import { db } from "../../../db";

import { eq, desc, and, like, sql, type ExtractTablesWithRelations } from "drizzle-orm";
import type { SendSuspensionRequestDto } from "../dto/SendSuspensionRequestDto";
import { requestState } from "../../../shared/enums/RequestState";
import { membershipChangeType, type MembershipChangeType } from "../../../shared/enums/MembershipChangeType";
import { membershipChangeRequest, membershipChangeRequestInsertSchema } from "../../../db/schema/MembershipChangeRequest";
import type { SendDisaffiliationRequestDto } from "../dto/SendDisaffiliationRequestDto";
import { membershipXMember } from "../../../db/schema/MembershipXMember";
import type { ManagerChangeRequestDto } from "../dto/ManagerChangeRequestDTO";
import type { ChangeRequestDetail } from "../dto/ChangeRequestDetail";
import { user } from "../../../db/schema/User";
import { member } from "../../../db/schema/Member";
import { memberType } from "../../../db/schema/MemberType";
import { membership } from "../../../db/schema/Membership";
import type { MemberChangeRequestInfo } from "../dto/MemberChangeRequestInfo";
import type { MySql2PreparedQueryHKT, MySql2QueryResultHKT } from "drizzle-orm/mysql2";
import type { MySqlTransaction } from "drizzle-orm/mysql-core";
import { membershipState } from "../../../shared/enums/MembershipState";

// Definimos la shape mínima que nos interesa de un registro de cambio ya creado
export type ChangeRequestRow = {
  id: number;
  membership: number;
  type: MembershipChangeType;
  changeStartDate: Date;
};

// Helper: si la fecha de inicio ya pasó, marca como terminado
export async function endMembershipWithMotives(
  tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>,
  reqRow: ChangeRequestRow
 ){
   const now = new Date();
  if (reqRow.changeStartDate <= now) {
    // 1) cerrar todos los enlaces activos de esa membresía
    await tx
      .update(membershipXMember)
      .set({
        endDate:     reqRow.changeStartDate,
        reasonToEnd: reqRow.type,
      })
      .where(
        and(
        eq(membershipXMember.membershipId, reqRow.membership),
        // solo los que aún no tienen endDate
        sql`${membershipXMember.endDate} IS NULL`
        )
      );

    // 2) marcar la membresía como ENDED (temporalmente)
    await tx
      .update(membership)
      .set({ state: membershipState[0] }) // ENDED
      .where(eq(membership.id, reqRow.membership));

  }
}