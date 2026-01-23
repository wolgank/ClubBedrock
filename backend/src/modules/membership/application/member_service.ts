// application/member_service.ts
import { db } from "../../../db";
import { member, memberInsertSchema, memberSelectSchema, memberUpdateSchema } from "../../../db/schema/Member";
import { eq,or, desc,like,and, sql, inArray } from "drizzle-orm";
import type { SearchMembersDto } from "../dto/SearchMembersDto";
import type { MemberSummary, OtherMemberSummary } from "../dto/MemberSumaryForOp";
import { memberType } from "../../../db/schema/MemberType";
import { user } from "../../../db/schema/User";
import { auth } from "../../../db/schema/Auth";
import { membership } from "../../../db/schema/Membership";
import { membershipXMember } from "../../../db/schema/MembershipXMember";
import { bill } from "../../../db/schema/Bill";
import { billDetail } from "../../../db/schema/BillDetail";
import { membershipFeeTicket } from "../../../db/schema/MembershipFeeTicket";
import type { OtherMemberInfo } from "../dto/OtherMemberInfo";
import { debtStatus } from "../../../shared/enums/DebtStatus";
import { reasonToEndMembership } from "../../../shared/enums/ReasonToEndMembership";

/** Devuelve todos los miembros */
export const getAllMembers = () => {
  return db.select().from(member);
};

/** Devuelve un miembro por su ID (usuario.id), o null si no existe */
export const getMemberById = async (id: number) => {
  const [row] = await db
    .select()
    .from(member)
    .where(eq(member.id, id));
  return row || null;
};

export const getMemberByAuthId = async (id: number) => {
  const [row] = await db
    .select()
    .from(member)
    .innerJoin(user, eq(member.id,user.id))
    .where(eq(user.accountID, id))
    .limit(1)
    ;
    if(row==null || row==undefined){
      throw Error("miembro no encontrado con id auth: "+ id)
    }

  return row ;
};

/** Crea un nuevo miembro */
export const createMember = async (data: typeof memberInsertSchema._input) => {
  // 1) Validar y filtrar
  const parsed = memberInsertSchema.parse(data);

    // 2) Normalizar el campo isActive para que nunca sea undefined
  const { isActive,id, ...rest } = parsed;
  const insertPayload = {
     id,
    ...rest,
    // si no viene, asumimos 'true' o 'false' según tu lógica de negocio
    isActive: isActive ?? false,
  };

  // 3) Insertar; no necesitamos returningId porque 'id' ya lo conocemos
  await db.insert(member).values(insertPayload);

  // 3) Recuperar y devolver
  const [created] = await db
    .select()
    .from(member)
    .where(eq(member.id, id));
  return created;
};

/** Actualiza un miembro existente */
export const updateMember = async (
  id: number,
  data: Partial<typeof memberUpdateSchema._input>
) => {
  // 1) Validar cambios
  const parsed = memberUpdateSchema.parse(data);

  // 2) Ejecutar update
  await db
    .update(member)
    .set(parsed)
    .where(eq(member.id, id));
};

/** Elimina un miembro por su ID */
export const deleteMember = async (id: number) => {
  await db
    .delete(member)
    .where(eq(member.id, id));
};


/**
 * Busca miembros de tipo "TITULAR" según criterios opcionales.
 * Cada campo se usa con LIKE '%valor%' si se provee.
 * Además devuelve el ID de la membresía activa (endDate IS NULL).
 */
export const searchTitularMembers = async (
  criteria: SearchMembersDto
): Promise<MemberSummary[]> => {
  
  // `Parameters<typeof and>` es un tuple type [cond1, cond2, ...]
  const conds: Parameters<typeof and> = [
    eq(memberType.name, "TITULAR"),
    sql`membership_x_member.end_date IS NULL`,
  ];

  if (criteria.lastName) {
    conds.push(like(user.lastname, `%${criteria.lastName}%`));
  }
  if (criteria.name) {
    conds.push(like(user.name, `%${criteria.name}%`));
  }
  if (criteria.subCode) {
    conds.push(like(member.subCode, `%${criteria.subCode}%`));
  }
  if (criteria.email) {
    conds.push(like(auth.email, `%${criteria.email}%`));
  }
  if (criteria.documentType) {
    conds.push(like(user.documentType, `%${criteria.documentType}%`));
  }
  if (criteria.documentId) {
    conds.push(like(user.documentID, `%${criteria.documentId}%`));
  }

  return await db
    .select({
      membershipId: membership.id,
      subCode:      member.subCode,
      fullName:     sql<string>`CONCAT(${user.name}, ' ', ${user.lastname})`,
      documentType: user.documentType,
      documentId:   user.documentID,
      email:        auth.email,
    })
    .from(member)
    .innerJoin(memberType,   eq(memberType.id, member.memberTypeId))
    .innerJoin(user,         eq(user.id, member.id))
    .innerJoin(auth,         eq(auth.id, user.accountID))
    .innerJoin(
      membershipXMember,
      eq(membershipXMember.memberId, member.id)
    )
    .innerJoin(
      membership,
      eq(membership.id, membershipXMember.membershipId)
    )
    // Pasamos un solo argumento and(...conds)
    .where(and(...conds));
};

/**
 * Dado el accountID (Auth.sub del JWT), verifica si el miembro
 * asociado ya pagó la cuota de ingreso.
 *
 * - Si la membresía está en PRE_ADMITTED, retorna false (no pagó).
 * - En cualquier otro estado (ACTIVE, ON_REVISION, ENDED), retorna true.
 */
export const checkFirstPaymentPending = async (
  accountID: number
): Promise<boolean> => {
  // console.log("accountID ", accountID);
  // 1) Leer el usuario por accountID
  const [usrRow] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.accountID, accountID));
  // console.log("usrRow ", usrRow);
  // Si no existe user o el id no es un número válido → no pagó
  const userId = usrRow?.id;
  if (typeof userId !== "number") {
    return false;
  }

  // 2) Leer el membershipXMember activo (endDate IS NULL)
  const [mxmRow] = await db
    .select({ membershipId: membershipXMember.membershipId })
    .from(membershipXMember)
    .where(
      sql`${membershipXMember.memberId} = ${userId}`  //AND ${membershipXMember.endDate} IS NULL`
    );
// console.log("mxmRow ", mxmRow);
  const membershipId = mxmRow?.membershipId;
  if (typeof membershipId !== "number") {
    return false;
  }
  // console.log("id membership ", membershipId);
  // 3) Leer el estado de esa membresía
  const [membRow] = await db
    .select({ state: membership.state })
    .from(membership)
    .where(eq(membership.id, membershipId));

  // console.log("membRow ", membRow);
  const state = membRow?.state;
  if (typeof state !== "string") {
    return false;
  }
  // console.log("state ", state);
  // 4) Si está PRE_ADMITTED → todavía no pagó; en otro caso sí
  return state !== "PRE_ADMITTED";
};

export type MembershipOverview = {
  idMembership: number;
  codeMembership: string;
  subCodeMember: string;
  startDate: Date;
  state: string;
  pendingDebt: number;
  feeDebt: number;
  moratoriumDebt: number;
  othersDebt: number;
  profilePictureURL:string|null;
};

/**
 * Recupera un resumen de la membresía y deudas para el usuario autenticado.
 */
export const getMembershipOverview = async (
  accountID: number
): Promise<MembershipOverview> => {
  // 1) Obtener user.id
  
  const [usr] = await db
    .select({ id: user.id , url: user.profilePictureURL})
    .from(user)
    .where(eq(user.accountID, accountID));
  if (!usr) throw new Error("Usuario no encontrado");

  const userId = usr.id;

  // 2) Obtener el registro activo en membership_x_member
  const [mxm] = await db
    .select({
      membershipId: membershipXMember.membershipId,
      startDate:    membershipXMember.startDate,
      memberId:     membershipXMember.memberId,
    })
    .from(membershipXMember)
     .where( //         sql`${membershipXMember.memberId} = ${userId} AND ${membershipXMember.endDate} IS NULL`
        sql`${membershipXMember.memberId} = ${userId}`
     )
    .orderBy(desc(membershipXMember.endDate))
    ;
  if (!mxm) throw new Error("No tiene membresía activa");

  // 3) Datos de la membresía y del member
  const [memb] = await db
    .select({
      code:  membership.code,
      state: membership.state,
    })
    .from(membership)
    .where(eq(membership.id, mxm.membershipId));
  if (!memb) throw new Error("Membresía no encontrada");

  const [memRec] = await db
    .select({ subCode: member.subCode })
    .from(member)
    .where(eq(member.id, mxm.memberId));
  if (!memRec) throw new Error("Registro de Member no encontrado");

  // 4) Traer facturas PENDING u OVERDUE
  const statuses = ["PENDING", "OVERDUE"] as const;
  const bills = await db
    .select({ id: bill.id, amount: bill.finalAmount })
    .from(bill)
    .where(
      and(
        eq(bill.userId, userId),
        inArray(bill.status, statuses)
      )
    );

  const billIds = bills.map((b) => b.id);

  // 5) Detalles de factura
  const details = billIds.length
    ? await db
        .select({
          id:          billDetail.id,
          billId:      billDetail.billId,
          finalPrice:  billDetail.finalPrice,
          description: billDetail.description,
        })
        .from(billDetail)
        .where(inArray(billDetail.billId, billIds))
    : [];

  // 6) IDs de billDetail que son tickets de cuota
  const ticketDetails = await db
    .select({ id: membershipFeeTicket.id })
    .from(membershipFeeTicket)
    .where(eq(membershipFeeTicket.membershipId, mxm.membershipId));
  const ticketDetailIds = new Set(ticketDetails.map((t) => t.id));

  // 7) Sumar montos
  let pendingDebt     = 0;
  let feeDebt         = 0;
  let moratoriumDebt  = 0;
  let othersDebt      = 0;

  // Pendiente total de facturas
  pendingDebt = bills.reduce((sum, b) => sum + Number(b.amount), 0);

  // Distribuir por detalle, busca moras en los DETALLES BILL en general, no solo los memeershipfeetticket, lo que me conviene para mi evento mysql
  for (const d of details) {
    const amt = Number(d.finalPrice);
    const desc = d.description?.toUpperCase() ?? "";

    if (ticketDetailIds.has(d.id)) {
      feeDebt += amt;
    } else if (desc.includes("MORA")) {
      moratoriumDebt += amt;
    } else {
      othersDebt += amt;
    }
  }

  return {
    idMembership:     mxm.membershipId,
    codeMembership:   memb.code,
    subCodeMember:    memRec.subCode,
    startDate:        mxm.startDate,
    state:            memb.state,
    pendingDebt,
    feeDebt,
    moratoriumDebt,
    othersDebt,
    profilePictureURL: usr.url,
  };
};

/**
 * Recupera los miembros (TITULAR o CÓNYUGUE) que pertenecen a la misma membresía
 * activa que el usuario asociado a `accountID`, excluyendo al propio solicitante.
 *
 * Pasos:
 * 1) Obtener el registro de `user` vinculado a `accountID`.
 * 2) Obtener el `member.id` que coincide con `user.id`.
 * 3) Buscar la membresía “activa” (membresía con `endDate IS NULL`) para ese `member.id`.
 * 4) Con ese `membershipId`, consultar todos los `membershipXMember` con `endDate IS NULL`
 *    y `membershipId` igual, excluyendo al `member.id` propio.
 * 5) Por cada miembro encontrado, unirse a `member → user → auth → memberType → membership`
 *    para armar los campos solicitados.
 */
export async function getOtherMembersInMembership(
  accountID: number
): Promise<OtherMemberInfo[]> {
  // 1) Leer user.id a partir de accountID
  const [u] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.accountID, accountID));
  if (!u) {
    throw new Error("Usuario no encontrado para este accountID");
  }
  const userId = u.id;

  // 2) Leer member.id a partir de user.id
  const [m] = await db
    .select({ id: member.id })
    .from(member)
    .where(eq(member.id, userId));
  if (!m) {
    throw new Error("Este usuario no es un miembro registrado");
  }
  const ownMemberId = m.id;

  // 3) Encontrar la membresía activa (endDate IS NULL) de este miembro
  const [ownMxM] = await db
    .select({ membershipId: membershipXMember.membershipId })
    .from(membershipXMember)
    .where(
      and(
        eq(membershipXMember.memberId, ownMemberId),
        or(
          sql`${membershipXMember.endDate} IS NULL`,
          and(
            sql`${membershipXMember.endDate} IS NOT NULL`,
            sql`${membershipXMember.reasonToEnd} = ${reasonToEndMembership[0]}`,
          )
        )
      )
    );
  if (!ownMxM) {
    throw new Error("No se encontró membresía activa para este miembro");
  }
  const membershipId = ownMxM.membershipId;

  // 4) Obtener todos los otros miembros en la misma membresía activa
  const rows = await db
    .select({
      idAuth:             auth.id,
      idUser:             user.id,
      idMember:           member.id,
      subCode:            member.subCode,
      membershipCode:     membership.code,
      name:               user.name,
      lastname:           user.lastname,
      profilePictureURL:  user.profilePictureURL,
      memberTypeName:     memberType.name,
      memberTypeId:       memberType.id,
    })
    .from(membershipXMember)
    .innerJoin(member,       eq(member.id,       membershipXMember.memberId))
    .innerJoin(user,         eq(user.id,         member.id))
    .innerJoin(auth,         eq(auth.id,         user.accountID))
    .innerJoin(memberType,   eq(memberType.id,   member.memberTypeId))
    .innerJoin(membership,   eq(membership.id,   membershipXMember.membershipId))
    .where(
      and(
        eq(membershipXMember.membershipId, membershipId),
        sql`${membershipXMember.endDate} IS NULL`,
        // Excluir al propio miembro
        sql`${member.id} != ${ownMemberId}`,
        sql`${memberType.name} NOT LIKE "TITULAR"`
      )
    );

  return rows.map((r) => ({
    idAuth:            r.idAuth,
    idUser:            r.idUser,
    idMember:          r.idMember,
    subCode:           r.subCode,
    membershipCode:    r.membershipCode,
    name:              r.name,
    lastname:          r.lastname,
    profilePictureURL: r.profilePictureURL,
    memberTypeName:    r.memberTypeName,
    memberTypeId:    r.memberTypeId,

  }));
}


export const getType = (id: number) => {
  return db.select({
    name: memberType.name,
  }).from(member)
  .innerJoin(memberType, eq(member.memberTypeId, memberType.id))
  .where(and(eq(member.isActive, true), eq(member.id, id)));
};


/**
 * Busca todos los miembros de un cierto tipo (memberTypeId)
 * y devuelve información relevante de cada uno.
 *
 * @param idMemberType  ID del MemberType por el que filtrar.
 */
export const findByType = async (
  idMemberType: number
): Promise<OtherMemberSummary[]> => {
  // Validación básica
  if (typeof idMemberType !== "number" || isNaN(idMemberType)) {
    throw new Error("El ID de tipo de miembro debe ser un número válido");
  }

  return await db
    .select({
      membershipId: membership.id,
      code:         membership.code,
      subCode:      member.subCode,
      name: user.name,
      lastname: user.lastname,
      documentType: user.documentType,
      documentId:   user.documentID,
      email:        auth.email,
    })
    .from(member)
    // Solo miembros de ese tipo
    .innerJoin(memberType,   eq(memberType.id, member.memberTypeId))
    .innerJoin(user,         eq(user.id,        member.id))
    .innerJoin(auth,         eq(auth.id,        user.accountID))
    .innerJoin(
      membershipXMember,
      eq(membershipXMember.memberId, member.id)
    )
    .innerJoin(
      membership,
      eq(membership.id, membershipXMember.membershipId)
    )
    .where(eq(memberType.id, idMemberType));
};

export type MemberWithMoras = {
  name: string;
  lastname: string;
  membershipCode: string;
  subCode: string;
  daysDelayed: number;
  rawAmount: number;
  moraAmount: number;
  totalAmount: number;
  billCreatedAt: Date | undefined | null;
  billDueDate: Date | undefined | null;
};

export const getMembersWithMoras = async (): Promise<MemberWithMoras[]> => {
  // 1) Agregamos los bills que estén PENDING u OVERDUE...
  const rows = await db
    .select({
      billId:           bill.id,
      name:             user.name,
      lastname:         user.lastname,
      membershipCode:   membership.code,
      subCode:          member.subCode,
      billCreatedAt:    bill.createdAt,
      billDueDate:      bill.dueDate,
      rawAmount:        sql<number>`
        COALESCE(SUM(
          CASE WHEN ${billDetail.description} NOT LIKE '%MORA%' THEN ${billDetail.finalPrice} ELSE 0 END
        ), 0)
      `,
      moraAmount:       sql<number>`
        COALESCE(SUM(
          CASE WHEN ${billDetail.description} LIKE '%MORA%' THEN ${billDetail.finalPrice} ELSE 0 END
        ), 0)
      `,
    })
    .from(bill)
    .innerJoin(billDetail, eq(billDetail.billId, bill.id))
    .innerJoin(user,       eq(user.id, bill.userId))
    .innerJoin(member,     eq(member.id, user.id))
    // Solo TITULAR
    .innerJoin(memberType, eq(memberType.id, member.memberTypeId))
    .where( and ( eq(memberType.name, 'TITULAR'),
    // Estados relevantes

      or(
        eq(bill.status, debtStatus[0]),  // PENDING
        eq(bill.status, debtStatus[2])   // OVERDUE
      )
    ))
    // Miembro-–> miembro activo en esa membresía
    .innerJoin(
      membershipXMember,
      and(
        eq(membershipXMember.memberId, member.id),
        sql`${membershipXMember.endDate} IS NULL`
      )
    )
    .innerJoin(membership, eq(membership.id, membershipXMember.membershipId))
    // Agrupamos por factura + datos que no son agregados
    .groupBy(
      bill.id,
      user.name,
      user.lastname,
      membership.code,
      member.subCode,
      bill.createdAt,
      bill.dueDate
    )
    // Exigir que haya al menos un detalle de MORA
    .having(
      sql`SUM(CASE WHEN ${billDetail.description} LIKE '%MORA%' THEN 1 ELSE 0 END) > 0`
    )
    .orderBy(desc(bill.dueDate));

  const today = new Date();

  return rows.map((r) => {
    const daysDelayed = Math.max(
      0,
      Math.floor(
        (today.getTime() - new Date(r.billDueDate!).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const raw  = Number(r.rawAmount);
    const mora = Number(r.moraAmount);
    return {
      name:           r.name,
      lastname:       r.lastname,
      membershipCode: r.membershipCode,
      subCode:        r.subCode,
      daysDelayed,
      rawAmount:      raw,
      moraAmount:     mora,
      totalAmount:    raw + mora,
      billCreatedAt:  r.billCreatedAt,
      billDueDate:    r.billDueDate,
    };
  });
};

