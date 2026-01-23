import { db } from "../../../db";

import { eq, desc, and, like, sql } from "drizzle-orm";
import type { SendSuspensionRequestDto } from "../dto/SendSuspensionRequestDto";
import { requestState } from "../../../shared/enums/RequestState";
import { membershipChangeType } from "../../../shared/enums/MembershipChangeType";
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
import { endMembershipWithMotives, type ChangeRequestRow } from "./membership_change_helpers";
import { membershipState } from "../../../shared/enums/MembershipState";
import { reasonToEndMembership } from "../../../shared/enums/ReasonToEndMembership";




/**
 * Permite a un miembro (titular o cónyuge) solicitar la suspensión de su membresía.
 * Inserta un registro en la tabla membershipChangeRequest con:
 * - requestState = PENDING
 * - type         = SUSPENSION
 * - madeByAMember = true
 * - submissionDate = ahora
 * - memberReason  = opcional
 * - changeStartDate, changeEndDate = según dto
 *
 * @param dto   Datos de la solicitud (motivo opcional, fecha inicio, fecha fin opcional)
 * @returns     El registro creado (incluye su id)
 */
export const sendSuspensionRequestByMember = async (
  dto: SendSuspensionRequestDto
) => {
  // 1) Preparamos los datos para insertar
  const now = new Date();
  const toInsert = {
    membership: dto.membership,
    requestState:    requestState[0],
    type:            membershipChangeType[0],
    madeByAMember:   true,
    memberReason:    dto.memberReason,
    submissionDate:  now,
    resolutionDate:  undefined,
    managerNotes:    undefined,
    changeStartDate: dto.changeStartDate,
    changeEndDate:   dto.changeEndDate,
  };

  // 2) Validamos con Zod
  const parsed = membershipChangeRequestInsertSchema.parse(toInsert);

  // 3) Insertamos y devolvemos el registro recién creado
  const [newId] = await db
    .insert(membershipChangeRequest)
    .values(parsed)
    .$returningId();

  if (!newId) {
    throw new Error("No se pudo crear la solicitud de suspensión");
  }

  // 4) Obtenemos y retornamos el registro completo
  const [created] = await db
    .select()
    .from(membershipChangeRequest)
    .where(eq(membershipChangeRequest.id, newId.id));

  return created;
};

/**
 * Envía una solicitud de desafiliación de membresía hecha por un miembro.
 * Inserta un registro en membershipChangeRequest con:
 * - requestState  = PENDING (0)
 * - type          = DISAFFILIATION (1)
 * - madeByAMember = true
 * - memberReason  = opcional
 * - submissionDate = ahora
 * - changeStartDate = dto.changeStartDate
 */
export const sendDisaffiliationRequestByMember = async (
  dto: SendDisaffiliationRequestDto
) => {
  const now = new Date();
  const toInsert = {
    membership: dto.membership,
    requestState:    requestState[0],                // 0
    type:            membershipChangeType[1], // 1
    madeByAMember:   true,
    memberReason:    dto.memberReason,
    submissionDate:  now,
    resolutionDate:  undefined,
    managerNotes:    undefined,
    changeStartDate: dto.changeStartDate,
    changeEndDate:   undefined,
  };

  // Validación Zod
  const parsed = membershipChangeRequestInsertSchema.parse(toInsert);

  // Insertar
  const [newId] = await db
    .insert(membershipChangeRequest)
    .values(parsed)
    .$returningId();

  if (!newId) {
    throw new Error("No se pudo crear la solicitud de desafiliación");
  }

  // Recuperar el registro recién creado
  const [created] = await db
    .select()
    .from(membershipChangeRequest)
    .where(eq(membershipChangeRequest.id, newId.id));

  return created;
};


export const getAllChangeRequests = async () => {
  return await db
    .select()
    .from(membershipChangeRequest)
    .orderBy(desc(membershipChangeRequest.submissionDate));
};

/**
 * Devuelve todas las Change Requests hechas por miembros (madeByAMember = true)
 * con información útil para el frontend:
 * - Código de la membresía
 * - SubCode y nombre completo del titular
 * - Razón dada por el miembro
 * - Campos del registro de solicitud
 */
export const getMemberChangeRequests = async (): Promise<MemberChangeRequestInfo[]> => {
  return await db
    .select({
      requestId:       membershipChangeRequest.id,
      membershipCode:  membership.code,
      membershipId:    membership.id,
      titularSubCode:  member.subCode,
      titularFullName: sql<string>`CONCAT(${user.name}, ' ', ${user.lastname})`,
      memberReason:    membershipChangeRequest.memberReason,
      requestState:    membershipChangeRequest.requestState,
      type:            membershipChangeRequest.type,
      madeByAMember:   membershipChangeRequest.madeByAMember,
      submissionDate:  membershipChangeRequest.submissionDate,
      changeStartDate: membershipChangeRequest.changeStartDate,
      changeEndDate:   membershipChangeRequest.changeEndDate,
      resolutionDate:  membershipChangeRequest.resolutionDate,
      managerNotes:    membershipChangeRequest.managerNotes,
    })
    .from(membershipChangeRequest)
    .where(eq(membershipChangeRequest.madeByAMember, true))
    .innerJoin(membership, eq(membership.id, membershipChangeRequest.membership))
    .innerJoin(membershipXMember, eq(membershipXMember.membershipId, membership.id))
    .innerJoin(member, eq(member.id, membershipXMember.memberId))
    .innerJoin(memberType, and(
      eq(memberType.id, member.memberTypeId),
      sql`${memberType.name} LIKE '%TITULAR%'`
    ))
    .innerJoin(user, eq(user.id, member.id))
    .orderBy(sql`membership_change_request.submissionDate DESC`);
};

export const getAllMemberChangeRequests = async (): Promise<MemberChangeRequestInfo[]> => {
  return await db
    .select({
      requestId:       membershipChangeRequest.id,
      membershipCode:  membership.code,
      membershipId:    membership.id,
      titularSubCode:  member.subCode,
      titularFullName: sql<string>`CONCAT(${user.name}, ' ', ${user.lastname})`,
      memberReason:    membershipChangeRequest.memberReason,
      requestState:    membershipChangeRequest.requestState,
      type:            membershipChangeRequest.type,
      madeByAMember:   membershipChangeRequest.madeByAMember,
      submissionDate:  membershipChangeRequest.submissionDate,
      changeStartDate: membershipChangeRequest.changeStartDate,
      changeEndDate:   membershipChangeRequest.changeEndDate,
      resolutionDate:  membershipChangeRequest.resolutionDate,
      managerNotes:    membershipChangeRequest.managerNotes,
    })
    .from(membershipChangeRequest)
    //.where(eq(membershipChangeRequest.madeByAMember, true))
    .innerJoin(membership, eq(membership.id, membershipChangeRequest.membership))
    .innerJoin(membershipXMember, eq(membershipXMember.membershipId, membership.id))
    .innerJoin(member, eq(member.id, membershipXMember.memberId))
    .innerJoin(memberType, and(
      eq(memberType.id, member.memberTypeId),
      sql`${memberType.name} LIKE '%TITULAR%'`
    ))
    .innerJoin(user, eq(user.id, member.id))
    .orderBy(sql`membership_change_request.submissionDate DESC`);
};

export const getChangeRequestDetailById = async (
  requestId: number
): Promise<ChangeRequestDetail> => {
  // 1) Leer la solicitud de cambio
  const [req] = await db
    .select({
      membershipId: membershipChangeRequest.membership,
      memberReason: membershipChangeRequest.memberReason,
      changeStartDate: membershipChangeRequest.changeStartDate,
      changeEndDate: membershipChangeRequest.changeEndDate,
    })
    .from(membershipChangeRequest)
    .where(eq(membershipChangeRequest.id, requestId));
  if (!req) throw new Error("ChangeRequest no encontrada");

  const { membershipId, memberReason, changeStartDate, changeEndDate } = req;

  // 2) Leer la membership (código y estado)
  const [memb] = await db
    .select({
      code: membership.code,
      state: membership.state,
    })
    .from(membership)
    .where(eq(membership.id, membershipId));
  if (!memb) throw new Error("Membresía asociada no encontrada");

  // 3) Encontrar al miembro de tipo "TITULAR" en esa membresía
  const [titular] = await db
    .select({
      name: user.name,
      lastname: user.lastname,
    })
    .from(membershipXMember)
    .innerJoin(member, eq(member.id, membershipXMember.memberId))
    .innerJoin(memberType, eq(memberType.id, member.memberTypeId))
    .innerJoin(user, eq(user.id, member.id))
    .where(
    and(
      eq(membershipXMember.membershipId, membershipId),
      like(memberType.name, `%TITULAR%`),
    )
  )

    .limit(1);
  if (!titular) throw new Error("Titular de la membresía no encontrado");

  return {
    membershipCode:   memb.code,
    membershipState:  memb.state,
    titularName:     `${titular.name} `,
    titularLastName:      `${titular.lastname}`,
    memberReason,
    changeStartDate,
    changeEndDate,
  };
};

/** Aprueba una solicitud y, si toca, finaliza la membresía */
export const approveChangeRequest = async (requestId: number,  managerNotes?: string) => {
  return db.transaction(async (tx) => {
    const [req] = await tx
      .select()
      .from(membershipChangeRequest)
      .where(eq(membershipChangeRequest.id, requestId));
    if (!req) throw new Error("ChangeRequest no encontrada");

    const now = new Date();
    await tx
      .update(membershipChangeRequest)
      .set({
        requestState:   requestState[2],
        resolutionDate: now,
        managerNotes,
      })
      .where(eq(membershipChangeRequest.id, requestId));

    // Si la suspensión/anulación ya comienza hoy o antes, finalizamos la membresía, AQUÍ TAMBIÉN QUIERO USAR EL HELPER
    await endMembershipWithMotives(tx, req as ChangeRequestRow);

    return { requestId };
  });
};

/** Rechaza una solicitud */
export const rejectChangeRequest = async (requestId: number,managerNotes?: string) => {
  return db.transaction(async (tx) => {
    const [req] = await tx
      .select()
      .from(membershipChangeRequest)
      .where(eq(membershipChangeRequest.id, requestId));
    if (!req) throw new Error("ChangeRequest no encontrada");

    const now = new Date();
    await tx
      .update(membershipChangeRequest)
      .set({
        requestState:   requestState[1],
        resolutionDate: now,
         managerNotes,    
      })
      .where(eq(membershipChangeRequest.id, requestId));

    return { requestId };
  });
};

/**
 * Crea una solicitud de cambio de membresía en estado APPROVED,
 * con submissionDate y resolutionDate a ahora, y madeByAMember = false.
 */
export const createAndApproveChangeRequestByManager = async (
  dto: ManagerChangeRequestDto
) => {

  const now = new Date();
  const toInsert = {
    membership:      dto.membership,
    requestState:    requestState[2],
    type:            dto.type,
    madeByAMember:   false,
    memberReason:    undefined,
    submissionDate:  now,
    resolutionDate:  now,
    managerNotes:    dto.managerNotes,
    changeStartDate: dto.changeStartDate,
    changeEndDate:   dto.changeEndDate,
  };
  return db.transaction(async (tx) => {
    // Validar y insertar
    const parsed = membershipChangeRequestInsertSchema.parse(toInsert);
    const [newId] = await tx.insert(membershipChangeRequest).values(parsed).$returningId();
    if (!newId) throw new Error("No se creó la solicitud de cambio");

    const [req] = await tx
      .select()
      .from(membershipChangeRequest)
      .where(eq(membershipChangeRequest.id, newId.id));
    if (!req) throw new Error("No se creó la solicitud de cambio");

    if (!req) throw new Error("No se encontró la solicitud tras crearla");

    // aplicar cierre inmediato si corresponde
    await endMembershipWithMotives(tx, req as ChangeRequestRow);

    // if (toInsert.changeStartDate <= now) {
    //     await tx
    //       .update(membershipXMember)
    //       .set({
    //         endDate:     toInsert.changeStartDate,
    //         reasonToEnd: toInsert.type,
    //       })
    //       .where(eq(membershipXMember.membershipId, toInsert.membership));
    //   }

    // Devolver el registro completo
    const [created] = await tx
      .select()
      .from(membershipChangeRequest)
      .where(eq(membershipChangeRequest.id, newId.id));
    return created;
  })
  
};

/**
 * Reactiva una membresía:
 * 1) Cambia el estado de la membership a ACTIVE.
 * 2) Busca todos los membership_x_member donde:
 *    - membershipId coincida
 *    - endDate IS NOT NULL
 *    - reasonToEnd = 'SUSPENSION'
 * 3) Para cada uno, inserta un nuevo registro de membership_x_member
 *    con startDate = ahora, endDate = NULL, reasonToEnd = NULL.
 *
 * @param membershipId  ID de la membresía a reactivar
 */
export const reactivateSuspendedMembers = async (membershipId: number): Promise<{
  membershipId: number;
  reactivatedCount: number;
}> => {
  return await db.transaction(async (tx) => {
    // 1) Poner la membership en ACTIVE
    await tx
      .update(membership)
      .set({ state: membershipState[1] }) // 'ACTIVE'
      .where(eq(membership.id, membershipId));

    // 2) Recuperar los miembros que estaban suspendidos
    const suspended = await tx
      .select({ memberId: membershipXMember.memberId })
      .from(membershipXMember)
      .where(
        and(
          eq(membershipXMember.membershipId, membershipId),
          sql`${membershipXMember.endDate} IS NOT NULL`,
          eq(membershipXMember.reasonToEnd, reasonToEndMembership[0]) // 'SUSPENSION'
        )
      );
        // está un poco mal programado todo esto pero creo que no hace daño, por ahora.
    const now = new Date();
    let count = 0;

    // 3) Reinsertar cada miembro como activo nuevamente
    for (const row of suspended) {
      await tx.insert(membershipXMember).values({
        memberId:    row.memberId,
        membershipId,
        startDate:   now,
        endDate:     null,
        reasonToEnd: null,
      });
      count++;
    }

    return { membershipId, reactivatedCount: count };
  });
};


export const getOwnChangeRequests = async (idAuth :number): Promise<MemberChangeRequestInfo[]> => {
  return await db
    .selectDistinct({
      requestId:       membershipChangeRequest.id,
      membershipCode:  membership.code,
      membershipId:    membership.id,
      titularSubCode:  member.subCode,
      titularFullName: sql<string>`CONCAT(${user.name}, ' ', ${user.lastname})`,
      memberReason:    membershipChangeRequest.memberReason,
      requestState:    membershipChangeRequest.requestState,
      type:            membershipChangeRequest.type,
      madeByAMember:   membershipChangeRequest.madeByAMember,
      submissionDate:  membershipChangeRequest.submissionDate,
      changeStartDate: membershipChangeRequest.changeStartDate,
      changeEndDate:   membershipChangeRequest.changeEndDate,
      resolutionDate:  membershipChangeRequest.resolutionDate,
      managerNotes:    membershipChangeRequest.managerNotes,
    })
    
    .from(membershipChangeRequest)
    
    .innerJoin(membership, eq(membership.id, membershipChangeRequest.membership))
    .innerJoin(membershipXMember, eq(membershipXMember.membershipId, membership.id))
    .innerJoin(member, eq(member.id, membershipXMember.memberId))
    .innerJoin(memberType, and(
      eq(memberType.id, member.memberTypeId),
      sql`${memberType.name} LIKE '%TITULAR%'`
    ))
    .innerJoin(user, eq(user.id, member.id))
    .where( 
      and( 
      eq(membershipChangeRequest.madeByAMember, true), eq(user.accountID, idAuth)  
      )
    )
    .orderBy(sql`membership_change_request.submissionDate DESC`);
};

/**
 * Reactiva una membresía y los miembros suspendidos
 * @param membershipId ID de la membresía a reactivar
 * @throws Error si la membresía no existe o no está en estado ENDED
 */
export async function reactivateMembership(membershipId: number): Promise<void> {
  await db.transaction(async (tx) => {
    // 1) Obtener la membresía
    const [mem] = await tx
      .select({ id: membership.id, state: membership.state })
      .from(membership)
      .where(eq(membership.id, membershipId));
    if (!mem) throw new Error(`Membresía ${membershipId} no encontrada`);
    if (mem.state !== 'ENDED') throw new Error(`Membresía ${membershipId} no está suspendida`);

    // 2) Actualizar estado a ACTIVE
    await tx
      .update(membership)
      .set({ state: 'ACTIVE' })
      .where(eq(membership.id, membershipId));

    // 3) Buscar filas suspendidas (últimos) con reasonToEnd = 'SUSPENSION'
    const suspendedRows = await tx
      .select({ memberId: membershipXMember.memberId, endDate: membershipXMember.endDate })
      .from(membershipXMember)
      .where(
        and(
          eq(membershipXMember.membershipId, membershipId),
          eq(membershipXMember.reasonToEnd, 'SUSPENSION'),
          sql`${membershipXMember.endDate} = (
            SELECT MAX(m2.end_date)
            FROM membership_x_member m2
            WHERE m2.membership_id = ${membershipId} 
              AND m2.member_id = ${membershipXMember.memberId}
          )`, // mayor fecha de suspensión para un miembro en una membresía
          sql`NOT EXISTS (
            SELECT 1 FROM membership_x_member m3
            WHERE m3.membership_id = ${membershipId}
              AND m3.member_id = ${membershipXMember.memberId}
              AND m3.end_date > ${membershipXMember.endDate}
          )`
        )
      );


    // 4) Reinsertar enlaces para reactivación
    for (const row of suspendedRows) {
      if (!row.endDate) continue;
      await tx.insert(membershipXMember).values({
        membershipId,
        memberId: row.memberId,
        startDate: row.endDate,
        endDate: null,
        reasonToEnd: null,
      });
    }
  });
}

