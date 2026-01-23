import { db } from "../../../db";
import { membershipXMember } from "../../../db/schema/MembershipXMember";
import { user } from "../../../db/schema/User";
import { member } from "../../../db/schema/Member";
import { memberType } from "../../../db/schema/MemberType";
import { eq, inArray, and, isNull } from "drizzle-orm";

export const getUsersByCommonMemberships = async (memberId: number) => {
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      memberType: memberType.name, // Tipo de miembro
    })
    .from(user)
    .innerJoin(membershipXMember, eq(user.id, membershipXMember.memberId))
    .innerJoin(member, eq(user.id, member.id)) // user.id === member.id
    .innerJoin(memberType, eq(member.memberTypeId, memberType.id))
    .where(
      and(
        inArray(
          membershipXMember.membershipId,
          db
            .select({ membershipId: membershipXMember.membershipId })
            .from(membershipXMember)
            .where(eq(membershipXMember.memberId, memberId))
        ),
        isNull(membershipXMember.reasonToEnd)
        //not(eq(user.id, memberId)) // Excluir el que hace la consulta
      )
    )
    .execute();

  return users;
};
