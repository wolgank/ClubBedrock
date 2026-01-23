// application/membership_service.ts
import { db } from "../../../db";
import { membership, membershipInsertSchema } from "../../../db/schema/Membership";
import { and, eq, desc, like, sql } from "drizzle-orm";
import { membershipXMember } from "../../../db/schema/MembershipXMember";
import { member } from "../../../db/schema/Member";
import { user } from "../../../db/schema/User";


export const getAllMemberships = () => db.select().from(membership);

//work in progress export const getAllMembershipsPerMember = (idMember) => db.select().from(membership).where(eq(membership.id, idMember));

export const getMembershipById = (id: number) =>
  db
    .select()
    .from(membership)
    .where(eq(membership.id, id))
    .then((res) => res[0]);


export type MembershipInfo = {
  membershipId: number;
  code: string;
  state: string;
  startDate: Date;
  endDate: Date | null;
  active: boolean;
};

/**
 * Dado un accountId (auth.id), devuelve la membresía más reciente
 * (si existe) del miembro correspondiente, con un flag `active`
 * que indica si está vigente (endDate IS NULL).
 * Si no hay NINGÚN vínculo en membership_x_member, devuelve null.
 */
export const getMembershipByAccountId = async (
  accountId: number
): Promise<MembershipInfo | null> => {
  // 1) Encontrar el user → member
  const [link] = await db
    .select({
      membershipId: membership.id,
      code:         membership.code,
      state:        membership.state,
      startDate:    membershipXMember.startDate,
      endDate:      membershipXMember.endDate,
      // activo si endDate IS NULL
      active:       sql<boolean>`CASE WHEN ${membershipXMember.endDate} IS NULL THEN TRUE ELSE FALSE END`,
    })
    .from(user)
    .innerJoin(member,           eq(member.id,           user.id))
    .innerJoin(membershipXMember,eq(membershipXMember.memberId, member.id))
    .innerJoin(membership,       eq(membership.id,       membershipXMember.membershipId))
    .where(eq(user.accountID, accountId))
    .orderBy(desc(membershipXMember.startDate))
    .limit(1);

  // 2) Si no hay vínculo, devolvemos null
  if (!link) {
    return null;
  }

  return link;
};


export const createMembership = async (data: typeof membershipInsertSchema._input) => {

  const insertId = await db
  .insert(membership)
  .values(data)
  .$returningId()
  .then((res) => res[0]);

  // Obtenemos el evento recién creado utilizando su ID
  if (!insertId?.id) {
    throw new Error("Failed to retrieve the inserted event ID.");
  }
  const [createdEvent] = await db
    .select()
    .from(membership)
    .where(eq(membership.id, insertId.id));
  return createdEvent;
};

export const updateMembership = async (
  id: number,
  data: Partial<typeof membershipInsertSchema._input>
) => {
  await db
    .update(membership)
    .set(data) 
    .where(eq(membership.id, id)); 
    
  const updatedMembership = await db
    .select()
    .from(membership)
    .where(eq(membership.id, id));
  if (!updatedMembership.length) {
    throw new Error("Failed to update the event.");
  }

  return updatedMembership[0]; // Retorna la primer membresia actualizada
};

export const deleteMembership = (id: number) =>
  db.delete(membership).where(eq(membership.id, id));



