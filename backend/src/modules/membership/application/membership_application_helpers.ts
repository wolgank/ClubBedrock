// application/membership_application_service.ts
import { db } from "../../../db";
import { sql, desc, eq, like,not ,and, type ExtractTablesWithRelations, inArray,  } from "drizzle-orm";
import { user } from '../../../db/schema/User';
import { userInsertSchema } from "../../../db/schema/User";
import { memberInsertSchema } from "../../../db/schema/Member";
import { membershipState } from "../../../shared/enums/MembershipState";
import {formatMembershipCode, formatMemberSubCode} from "../../../shared/utils/formatMembershipCode";

import {
  memberRequest,
} from "../../../db/schema/MemberRequest";
import {
  memberInclusionRequest,
} from "../../../db/schema/MemberInclusionRequest";
import {
  recomendationMember,
} from "../../../db/schema/RecommendationMember";
import {
  membershipApplication,
} from "../../../db/schema/MembershipApplication";

import type {
  CreateMembershipApplicationDto,
  InclusionDto,
  LaxInclusionDto,
} from "../dto/CreateMembershipApplicationDto";
import { requestState } from "../../../shared/enums/RequestState";
import { role } from "../../../shared/enums/Role";
import { memberType } from "../../../db/schema/MemberType";
import type { MySqlTransaction } from "drizzle-orm/mysql-core";
import type { MySql2QueryResultHKT, MySql2PreparedQueryHKT } from "drizzle-orm/mysql2";
import { member } from "../../../db/schema/Member";
import { membershipXMember, membershipXMemberInsertSchema } from "../../../db/schema/MembershipXMember";
import { membership, membershipInsertSchema } from "../../../db/schema/Membership";

// PARA CREAR |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
/** Paso 1: crea un MemberRequest y devuelve su ID */
export async function createMemberRequest(
  tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>,
  reason: string
): Promise<number> {
  const [id] = await tx
    .insert(memberRequest)
    .values({
      reason,
      submissionDate: sql`CURRENT_TIMESTAMP()`,
      requestState: requestState[0], // PENDING por defecto
    })
    .$returningId();
    // console.log(new Date());
    // const [hola] = await tx.select().from(memberRequest).where(eq(memberRequest.id,id?.id!)).limit(1);
    // console.log("la fecha submission fue ", hola?.submissionDate );
  if (!id) throw new Error("No se creó MemberRequest");
  return id.id;
}

/** Paso 2: busca un MemberType por nombre (LIKE) y lo devuelve */
export async function findMemberType(
  tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>,
  nameLike: string
) {
  const [mt] = await tx
    .select()
    .from(memberType)
    .where(like(memberType.name, `%${nameLike}%`));
  if (!mt) throw new Error(`No existe MemberType LIKE "${nameLike}"`);
  return mt;
}

/** Paso 3: inserta el MemberInclusionRequest asociado a un requestId */
export async function addInclusion(
  tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>,
  requestId: number,
  inclusion: CreateMembershipApplicationDto["inclusion"],
  typeId: number
) {
  await tx.insert(memberInclusionRequest).values({
    id: requestId,
    newMemberType: typeId,
    //...inclusion,
  });
}

/** Paso 4: inserta una recomendación y devuelve su ID */
export async function addRecommendation(
  tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>,
  rec: CreateMembershipApplicationDto["recommendation1"] | CreateMembershipApplicationDto["recommendation2"]
): Promise<number> {
  
  const possibleSubCode = rec.subCodeInserted;
  let memberId: number | null = null;

  ////console.log("possibleSubCode: " + possibleSubCode)
  if (possibleSubCode != null) {
    const [realMember] = await tx
      .select()
      .from(member)
      .where(eq(member.subCode, possibleSubCode));
    ////console.log("entré, los valores son: " + member.subCode + ", " + possibleSubCode)
    if (realMember) {
      memberId = realMember.id;
    }
  }

  const [id] = await tx
    .insert(recomendationMember)
    .values({
      subCodeInserted: rec.subCodeInserted,
      memberId,
      namesAndLastNamesInserted: rec.namesAndLastNamesInserted,
    })
    .$returningId();
  if (!id) throw new Error("No se creó RecommendationMember");
  return id.id;
}
type ApplicationMeta = {
  applicantJobInfo: string;
  accountID: number;
  accountPosiblyPartnerID: number | undefined;
};
/** Paso 5: inserta el registro final en membershipApplication */
export async function addApplicationRecord(
  tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>,
  requestId: number,
  partnerRequestId: number | null,
  rec1Id: number,
  rec2Id: number,
   meta: ApplicationMeta
) {
  await tx.insert(membershipApplication).values({
    id: requestId,
    idPosiblyPartner: partnerRequestId ?? undefined,
    applicantJobInfo: meta.applicantJobInfo,
    accountID: meta.accountID,
    accountPosiblyPartnerID: meta.accountPosiblyPartnerID,
    idRecommendationMember1: rec1Id,
    idRecommendationMember2: rec2Id,
  });
}

/** Helper: crea o actualiza un registro en `user` basado en los datos de inclusión */
export async function upsertUserFromInclusion(
  tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>,
  accountID: number,
   inc: LaxInclusionDto      
): Promise<number | undefined> {
   const dto = {
    lastname:          inc.newMemberLastName,
    name:              inc.newMemberName,
    documentType:      inc.newMemberDocumentType,
    documentID:        inc.newMemberDocumentId,
    phoneNumber:       inc.newMemberPhone,
    birthDate:         inc.newMemberBirthDate,
    gender:            undefined,
    address:           inc.newMemberAddress,
    profilePictureURL: undefined,
    accountID,
  };

  // 2) Valida con Zod
  const parsed = userInsertSchema.parse(dto);

  // 3) Intenta actualizar
  const updateResult = await tx
    .update(user)
    .set(parsed)
    .where(eq(user.accountID, accountID));

  if (updateResult[0].affectedRows > 0) {
    // 4a) Si ya existía, devuelve el ID
    const [existing] = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.accountID, accountID));

    return existing?.id;
  }

  // 4b) Si no existía, inserta uno nuevo
  const [newRec] = await tx
    .insert(user)
    .values(parsed)
    .$returningId();

  if (!newRec) {
    throw new Error("No se pudo crear el registro de User");
  }
  return newRec.id;
}
// PARA APROBAR |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||

/** Inserta un nuevo miembro con el userId y tipo */
export async function insertMemberFromUser(
  tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>,
  userId: number,
  memberTypeId: number,
   membershipCode: string,
  memberIndex: number 
): Promise<void> {
  const subCode = formatMemberSubCode(membershipCode, userId);
  const dto = {
    id: userId,
    subCode,
    isActive: true,
    memberTypeId,
  };
  const parsed = memberInsertSchema.parse(dto);
  const { isActive,id, ...rest } = parsed;
  const insertPayload = {
     id,
    ...rest,
    // si no viene, asumimos 'true' o 'false' según tu lógica de negocio
    isActive: isActive ?? false,
  };
  await tx.insert(member).values(insertPayload);
}

/** Paso C: crea un registro de membership y lo devuelve */
export async function createMembershipRecord(
  tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>,
): Promise<{ membershipId: number; code: string }> {
  //const code = await generateUniqueMembershipCode(tx);
  const dto = { code:"AAAAAAAAA", state: membershipState[3] /* PRE_ADMITTED, para que vea que aun debe pagar */ };
  const parsed = membershipInsertSchema.parse(dto);
  const [newId] = await tx.insert(membership).values(parsed).$returningId();

  if (!newId) throw new Error("No se creó la membresía");
  // 2) Formatear el código con el ID real
  const code = formatMembershipCode(newId.id);

  // 3) Actualizar el registro con el código final
  await tx
    .update(membership)
    .set({ code })
    .where(eq(membership.id, newId.id));
    
  return { membershipId: newId.id, code };
}
/** Paso D: vincula member y membership en membership_x_member */
export async function assignMembershipToMember(
  tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>,
  memberId: number,
  membershipId: number
): Promise<void> {
  const dto = {
    memberId,
    membershipId,
    startDate: new Date(),
    endDate: undefined,
    reasonToEnd: undefined,
  };
  const parsed = membershipXMemberInsertSchema.parse(dto);
  await tx.insert(membershipXMember).values(parsed);
}

/** Inserta un nuevo usuario basado en datos de inclusión */
export async function insertUserFromInclusion(
  tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>,
  inc: {
    newMemberName: string;
    newMemberLastName: string;
    newMemberDocumentType: string;
    newMemberDocumentId: string;
    newMemberPhone: string;
    newMemberBirthDate: Date;
    newMemberAddress: string;
    newMemberEmail: string;
  },
  accountID: number
): Promise<number> {
  // Construimos y validamos el DTO de usuario
  const dto = {
    name:            inc.newMemberName,
    lastname:        inc.newMemberLastName,
    documentType:    inc.newMemberDocumentType,
    documentID:      inc.newMemberDocumentId,
    phoneNumber:     inc.newMemberPhone,
    birthDate:       inc.newMemberBirthDate,
    gender:          undefined,
    address:         inc.newMemberAddress,
    profilePictureURL: undefined,
    accountID,
  };
  const parsed = userInsertSchema.parse(dto);
  // Insertamos
  const [newId] = await tx.insert(user).values(parsed).$returningId();
  if (!newId) throw new Error("No se creó el usuario");
  return newId.id;
}

