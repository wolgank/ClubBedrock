// services/member_request_service.ts
import { db } from "../../../db";
import { membership, membershipInsertSchema } from "../../../db/schema/Membership";
import { memberRequest, memberRequestInsertSchema } from "../../../db/schema/MemberRequest";
import { memberInclusionRequest, memberInclusionRequestInsertSchema } from "../../../db/schema/MemberInclusionRequest";
import { memberExclusionRequest, memberExclusionRequestInsertSchema } from "../../../db/schema/MemberExclusionRequest";
import { memberType } from "../../../db/schema/MemberType";
import { requestState } from '../../../shared/enums/RequestState';

import { eq, like,and, type ExtractTablesWithRelations, desc, sql, inArray } from "drizzle-orm";
import { AuthService } from "../../auth/application/AuthService";
import { z } from "zod";
import { documentType } from "../../../shared/enums/DocumentType";
import { user, userInsertSchema } from "../../../db/schema/User";
import type { MySqlTransaction } from "drizzle-orm/mysql-core";
import type { MySql2PreparedQueryHKT, MySql2QueryResultHKT } from "drizzle-orm/mysql2";
import { member } from "../../../db/schema/Member";
import { getMemberByAuthId } from "./member_service";
import { membershipXMember } from "../../../db/schema/MembershipXMember";
import { auth } from "../../../db/schema/Auth";
import { reasonToEndMembership } from "../../../shared/enums/ReasonToEndMembership";
import { addNewMemberFeeToMembership } from "./membership_fee_ticket_service";
import { billDetail } from "../../../db/schema/BillDetail";
import { bill } from "../../../db/schema/Bill";
import { debtStatus } from "../../../shared/enums/DebtStatus";
import { formatMemberSubCode } from "../../../shared/utils/formatMembershipCode";
import { addOneMonth } from "../../../shared/utils/dayUtils";
import { role } from "../../../shared/enums/Role";

//esto de aquí debería llevarlo a un paquetito de puros dtos, a nivel de módulo probablemente, de paso valido con z tmb.
export interface CreateNewMemberRequestInput {
    // Campos de member_request
    reason: string;
    // submissionDate?: Date;
    // requestState?: string;        // p. ej. "PENDING"
    // Campos de member_inclusion_request (sin el `id`)
    newMemberDocumentType: string;
    newMemberDocumentId: string;
    newMemberName:      string;
    newMemberLastName:  string;
    memberTypeName:     string;   // será usado en el LIKE para buscar “TITULAR”
  }

  //roto
export const createNewMemberRequest = async (raw: CreateNewMemberRequestInput) => {
  // 1. Validar los datos de member_request
  const baseData = memberRequestInsertSchema.parse({
    reason: raw.reason,
    submissionDate: Date(),
    requestState: requestState[0],
  });

  // 2. Validar los datos de member_inclusion_request (sin el id)
  const inclusionData = memberInclusionRequestInsertSchema.parse({
    // id lo añadiremos nosotros
    id: 0,  // temporal, lo sobrescribiremos más abajo
    newMemberDocumentType: raw.newMemberDocumentType,
    newMemberDocumentId:   raw.newMemberDocumentId,
    newMemberName:         raw.newMemberName,
    newMemberLastName:     raw.newMemberLastName,
    newMemberType:         0, // temporal, lo sobrescribiremos con el lookup
  });

  // 3. Ejecutar todo en una transacción
  return await db.transaction(async (tx) => {
    // 3.1. Insertar el registro padre
    const [ newRequestId ] = await tx
      .insert(memberRequest)
      .values(baseData)
      .$returningId();

    if (!newRequestId) {
      throw new Error("No se pudo obtener el ID de member_request");
    }

    // 3.2. Buscar el MemberType por name LIKE raw.memberTypeName
    const [ foundType ] = await tx
      .select()
      .from(memberType)
      .where(like(memberType.name, `%${raw.memberTypeName}%`));

    if (!foundType) {
      throw new Error(
        `No existe ningún MemberType con name LIKE "%${raw.memberTypeName}%"`
      );
    }
    // 3.3. Construir el payload de inclusión con los IDs correctos
    const inclusionPayload = {
      ...inclusionData,
      id: newRequestId.id,           // FK al padre
      newMemberType: foundType.id, // FK al member_type encontrado
      // newMemberBirthDate: new Date(newMemberBirthDate), // Eliminar o ajustar si es necesario
    };

    // 3.4. Insertar el hijo
    await tx.insert(memberInclusionRequest).values(inclusionPayload);

    // 4. (Opcional) Recuperar y devolver los objetos completos
    const [ createdRequest ] = await tx
      .select()
      .from(memberRequest)
      .where(eq(memberRequest.id, newRequestId.id));

    const [ createdInclusion ] = await tx
      .select()
      .from(memberInclusionRequest)
      .where(eq(memberInclusionRequest.id, newRequestId.id));

      return {
        request: createdRequest,
        inclusion: createdInclusion,
        memberType: foundType,
      };
  });
};

/**
 * DTO de entrada para una nueva solicitud de inclusión familiar.
 */
export const newFamiliarInclusionRequestSchema = z.object({
  documentType:    z.enum((documentType)), // Ajustar según enum `documentType`
  documentId:      z.string().min(1).max(50),
  birthDate:       z.coerce.date(),
  names:           z.string().min(1).max(50),
  lastnames:       z.string().min(1).max(50),
  memberTypeId:    z.number().int(),
  email:           z.string().email(),
  username:        z.string().min(1).max(100),
  password:        z.string().min(8).max(100),
  phone:           z.string().max(20).optional(),
  reason:          z.string().min(1).max(50),
});
export type NewFamiliarInclusionRequestDto = z.infer<typeof newFamiliarInclusionRequestSchema>;

/**
 * Crea una nueva solicitud de inclusión de familiar:
 * 1. Registra una cuenta (Auth + User) vía AuthService.register().
 * 2. Inserta un member_request con estado PENDING.
 * 3. Inserta un member_inclusion_request apuntando a ese member_request.id y al user.id recién creado.
 *
 * @param dto  Datos validados por Zod (véase arriba)
 * @returns    El ID del `memberRequest` recién creado.
 */
export async function newFamiliarInclusionRequest(
  dto: NewFamiliarInclusionRequestDto,
  sub: number,
): Promise<{ memberRequestId: number }> {
  // 1) Validamos el DTO
  const parsedDto = newFamiliarInclusionRequestSchema.parse(dto);
  
  // 2) Registramos la cuenta en Auth + User (fuera de la tx para aprovechar repositorios de AuthService)
  const authSvc = new AuthService();
  const { account, user } = await authSvc.register({
    auth: {
      email:    parsedDto.email,
      password: parsedDto.password,
      role:     "GUEST",
      username: parsedDto.username,
    },
    user: {
      name:              parsedDto.names,
      lastname:          parsedDto.lastnames,
      documentType:      parsedDto.documentType,
      documentID:        parsedDto.documentId,
      phoneNumber:       parsedDto.phone ?? "",
      birthDate:         parsedDto.birthDate,
      gender:            undefined,
      address:           "",
      profilePictureURL: undefined,
      //accountID:         account.id,
    },
  });

  // 3) Iniciamos la transacción para crear las solicitudes
  return await db.transaction(
    async (
      tx: MySqlTransaction<
        MySql2QueryResultHKT,
        MySql2PreparedQueryHKT,
        Record<string, never>,
        ExtractTablesWithRelations<Record<string, never>>
      >
    ) => {
      const solicitante = await getMemberByAuthId(sub);
      //console.log("id usu memb: ", solicitante);
      // 3a) Insertar member_request
      const mrDto = {
        reason:         parsedDto.reason,
        submissionDate: new Date(),
        requestState:   requestState[0], // PENDING
        idRequestingMember:  solicitante.member.id,
      };
      const parsedMr = memberRequestInsertSchema.parse(mrDto);
      const [mrRec] = await tx.insert(memberRequest).values(parsedMr).$returningId();
      if (!mrRec) throw new Error("No se pudo crear MemberRequest");
      const memberRequestId = mrRec.id;

      // 3b) Verificar que el memberType existe
      const [existingMt] = await tx
        .select()
        .from(memberType)
        .where(eq(memberType.id, parsedDto.memberTypeId));
      if (!existingMt) {
        throw new Error("MemberType no encontrado");
      }

      // 3c) Insertar member_inclusion_request referenciando user.id
      const mirDto = {
        id:               memberRequestId,
        newMemberType:    parsedDto.memberTypeId,
        idUserReferenced: user.id,
      };
      const parsedMir = memberInclusionRequestInsertSchema.parse(mirDto);
      await tx.insert(memberInclusionRequest).values(parsedMir);

      return { memberRequestId };
    }
  );
}

// DTO para la nueva solicitud de exclusión
export const ExclusionDto = z.object({
  memberToExclude: z.number().int(), //id member/user de quien se quiere excluir
  reasonToExclude: z.string().min(1).max(250),
});
export type ExclusionRequestDto = z.infer<typeof ExclusionDto>;

/**
 * Crea una nueva solicitud de exclusión de familiar:
 * 1) Inserta un member_request con estado PENDING y razón genérica.
 * 2) Inserta la fila en member_exclusion_request asociada a ese request.
 */
export async function excludeFamiliarRequest(
  dto: ExclusionRequestDto, authId: number
): Promise<{ requestId: number }> {
  const parsed = ExclusionDto.parse(dto);
  const solicitante = await getMemberByAuthId(authId);

  return await db.transaction(async (tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>) => {
    
     // 0) Validación: no existir ya una solicitud PENDING o APPROVED
    const [existing] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(memberExclusionRequest)
      .innerJoin(
        memberRequest,
        eq(memberRequest.id, memberExclusionRequest.id)
      )
      .where(
        and(
          eq(memberExclusionRequest.memberToExclude, parsed.memberToExclude),
           inArray(
        memberRequest.requestState,
        [requestState[0], requestState[2]]  // PENDING y APPROVED
      )
        )
      )
      .execute(); // ajusta método .execute() o .then() según tu versión de Drizzle
      if(existing===null || existing === undefined) throw new Error("QUÉ?!")
    if (Number(existing!.count) > 0) {
      throw new Error(
        `Ya existe una solicitud de exclusión para el miembro ${parsed.memberToExclude} en estado PENDIENTE o APROBADO.`
      );
    }
    
    // 1) Crear MemberRequest
    const [reqRow] = await tx
      .insert(memberRequest)
      .values({
        reason: "Solicitud de exclusión de familiar",
        submissionDate: new Date(),
        requestState: requestState[0], // PENDING
        idRequestingMember:solicitante.member.id,
      })
      .$returningId();
    if (!reqRow) throw new Error("No se creó MemberRequest");

    const requestId = reqRow.id;

    // 2) Crear MemberExclusionRequest
    const exclusionDto = {
      id: requestId,
      memberToExclude: parsed.memberToExclude,
      reasonToExclude: parsed.reasonToExclude,
    };
    // Validar con Zod
    const parsedExcl = memberExclusionRequestInsertSchema.parse(exclusionDto);

    await tx.insert(memberExclusionRequest).values(parsedExcl);

    return { requestId };
  });
}
/**
 * Devuelve todas las solicitudes de inclusión y exclusión familiar que haya generado
 * el miembro identificado por el auth ID. Cada objeto incluye:
 *  - requestId
 *  - isForInclusion (boolean): `true` si es inclusión, `false` si es exclusión
 *  - referencedFullName (string): nombre completo del usuario referenciado
 *      - Para inclusión: usuario nuevo referenciado en memberInclusionRequest.idUserReferenced
 *      - Para exclusión: miembro existente referenciado en memberExclusionRequest.memberToExclude
 *  - submissionDate (Date|null)
 *  - requestState (string|null)
 *  - memberTypeName (string|null): para inclusión, el nombre del tipo solicitado; para exclusión, el tipo del miembro a excluir
 */
export const listFamilyRequestsByMember = async (
  authId: number
): Promise<
  {
    requestId: number;
    isForInclusion: boolean;
    referencedFullName: string;
    submissionDate: Date | null;
    requestState: string | null;
    memberTypeName: string | null;
  }[]
> => {
  // 1) Obtengo el member.id del usuario autenticado
  const memberRow = await getMemberByAuthId(authId);
  const requestingMemberId = memberRow.member.id;

  // 2) Consulto solicitudes de INCLUSIÓN
  const inclusionRows = await db
    .select({
      requestId:           memberRequest.id,
      submissionDate:      memberRequest.submissionDate,
      requestState:        memberRequest.requestState,
      referencedName:      user.name,
      referencedLastName:  user.lastname,
      memberTypeName:      memberType.name,
    })
    .from(memberRequest)
    .innerJoin(
      memberInclusionRequest,
      eq(memberRequest.id, memberInclusionRequest.id)
    )
    .innerJoin(user, eq(memberInclusionRequest.idUserReferenced, user.id))
    .innerJoin(memberType, eq(memberInclusionRequest.newMemberType, memberType.id))
    .where(eq(memberRequest.idRequestingMember, requestingMemberId))
    .orderBy(desc(memberRequest.submissionDate));

  // 3) Consulto solicitudes de EXCLUSIÓN
  const exclusionRows = await db
    .select({
      requestId:           memberRequest.id,
      submissionDate:      memberRequest.submissionDate,
      requestState:        memberRequest.requestState,
      // Para exclusión, referenciamos el miembro a excluir y su usuario
      referencedName:      user.name,
      referencedLastName:  user.lastname,
      memberTypeName:      memberType.name,
    })
    .from(memberRequest)
    .innerJoin(
      memberExclusionRequest,
      eq(memberRequest.id, memberExclusionRequest.id)
    )
    .innerJoin(member, eq(memberExclusionRequest.memberToExclude, member.id))
    .innerJoin(user, eq(member.id, user.id))
    .innerJoin(memberType, eq(member.memberTypeId, memberType.id))
    .where(eq(memberRequest.idRequestingMember, requestingMemberId))
    .orderBy(desc(memberRequest.submissionDate));

  // 4) Combino y formateo ambas listas
  const formattedInclusions = inclusionRows.map((r) => ({
    requestId:          r.requestId,
    isForInclusion:     true,
    referencedFullName: `${r.referencedName} ${r.referencedLastName}`,
    submissionDate:     r.submissionDate,
    requestState:       r.requestState,
    memberTypeName:     r.memberTypeName,
  }));

  const formattedExclusions = exclusionRows.map((r) => ({
    requestId:          r.requestId,
    isForInclusion:     false,
    referencedFullName: `${r.referencedName} ${r.referencedLastName}`,
    submissionDate:     r.submissionDate,
    requestState:       r.requestState,
    memberTypeName:     r.memberTypeName,
  }));

  // 5) Unifico ambas listas, ya ordenadas individualmente por fecha descendente
  //    Para mantener la ordenación global por fecha, ordeno el arreglo final:
  const combined = [...formattedInclusions, ...formattedExclusions];
  combined.sort((a, b) => {
    const da = a.submissionDate ? a.submissionDate.getTime() : 0;
    const db = b.submissionDate ? b.submissionDate.getTime() : 0;
    return db - da;
  });

  return combined;
};

export type FamiliarRequestForManager = {
  requestId: number;
  isForInclusion: boolean;
  requestingMemberId: number; //SI NO TIENE ESTO NO SE IMPRIMIRÁ
  requestingMemberName: string;
  requestingMemberLastName: string;
  familiarName: string;
  familiarLastName: string;
  relationship: string;
  submissionDate: Date | null;
  requestState: string | null;
  reason: string;
};

/**
 * Obtiene todas las solicitudes de inclusión y exclusión familiar
 * para que un manager las revise.
 */
export const findFamiliarsRequestsForManager = async (): Promise<
  FamiliarRequestForManager[]
> => {
  //
  // 1) Consultar todas las solicitudes de INCLUSIÓN
  //
  const inclusionRows = await db
    .select({
      requestId:                 memberRequest.id,
      requestingMemberId:        user.id,
      requestingMemberName:      user.name,
      requestingMemberLastName:  user.lastname,
      // A continuación usaremos SELECT en crudo para leer u2.name / u2.lastname:
      familiarName:              sql<string>`u2.name`,
      familiarLastName:          sql<string>`u2.lastname`,
      relationship:              memberType.name,
      submissionDate:            memberRequest.submissionDate,
      requestState:              memberRequest.requestState,
      reason:                    memberRequest.reason,
    })
    .from(memberRequest)
    // JOIN para obtener el miembro que hizo la solicitud
    .innerJoin(member, eq(memberRequest.idRequestingMember, member.id))
    .innerJoin(user,   eq(member.id, user.id))
    // JOIN a memberInclusionRequest para saber a quién se refiere
    .innerJoin(memberInclusionRequest, eq(memberRequest.id, memberInclusionRequest.id))
    // JOIN en SQL crudo para obtener “user AS u2” (el familiar referenciado)
    .innerJoin(
      sql`user AS u2`,
      eq(sql`u2.id`, memberInclusionRequest.idUserReferenced)
    )
    // JOIN a memberType para extraer el parentezco (por ejemplo “HIJO”, “CÓNYUGUE”)
    .innerJoin(memberType, eq(memberInclusionRequest.newMemberType, memberType.id))
    .orderBy(desc(memberRequest.submissionDate));

  //
  // 2) Consultar todas las solicitudes de EXCLUSIÓN
  //
  const exclusionRows = await db
    .select({
      requestId:                 memberRequest.id,
      requestingMemberId:        user.id,
      requestingMemberName:      user.name,
      requestingMemberLastName:  user.lastname,
      // Para la exclusión, el “familiar” también lo traemos con SQL crudo:
      familiarName:              sql<string>`u3.name`,
      familiarLastName:          sql<string>`u3.lastname`,
      relationship:              memberType.name,
      submissionDate:            memberRequest.submissionDate,
      requestState:              memberRequest.requestState,
      reason:                    memberExclusionRequest.reasonToExclude,
    })
    .from(memberRequest)
    // JOIN para obtener el miembro que hizo la solicitud
    .innerJoin(member, eq(memberRequest.idRequestingMember, member.id))
    .innerJoin(user,   eq(member.id, user.id))
    // JOIN a memberExclusionRequest para saber a quién se refiere
    .innerJoin(memberExclusionRequest, eq(memberRequest.id, memberExclusionRequest.id))
    // JOIN en SQL crudo para obtener “member AS m2” y luego “user AS u3” para el familiar
    .innerJoin(
      sql`member AS m2`,
      eq(sql`m2.id`, memberExclusionRequest.memberToExclude)
    )
    .innerJoin(
      sql`user AS u3`,
      eq(sql`u3.id`, sql`m2.id`)
    )
    // JOIN a memberType para extraer el tipo de miembro actual del familiar
    .innerJoin(memberType, eq(sql`m2.member_type_id`, memberType.id))
    .orderBy(desc(memberRequest.submissionDate));

  //
  // 3) Dar formato a las filas de inclusión
  //
  const formattedInclusions: FamiliarRequestForManager[] = inclusionRows.map((r) => ({
    requestId:                r.requestId,
    isForInclusion:           true,
    requestingMemberId:       r.requestingMemberId,
    requestingMemberName:     r.requestingMemberName,
    requestingMemberLastName: r.requestingMemberLastName,
    familiarName:             r.familiarName,
    familiarLastName:         r.familiarLastName,
    relationship:             r.relationship,
    submissionDate:           r.submissionDate,
    requestState:             r.requestState,
    reason:                   r.reason,
  }));

  //
  // 4) Dar formato a las filas de exclusión
  //
  const formattedExclusions: FamiliarRequestForManager[] = exclusionRows.map((r) => ({
    requestId:                r.requestId,
    isForInclusion:           false,
    requestingMemberId:       r.requestingMemberId,
    requestingMemberName:     r.requestingMemberName,
    requestingMemberLastName: r.requestingMemberLastName,
    familiarName:             r.familiarName,
    familiarLastName:         r.familiarLastName,
    relationship:             r.relationship,
    submissionDate:           r.submissionDate,
    requestState:             r.requestState,
    reason:                   r.reason,
  }));

  //
  // 5) Unificar y ordenar por fecha de envío descendente
  //
  const combined = [...formattedInclusions, ...formattedExclusions];
  combined.sort((a, b) => {
    const da = a.submissionDate ? a.submissionDate.getTime() : 0;
    const db = b.submissionDate ? b.submissionDate.getTime() : 0;
    return db - da;
  });

  return combined;
};

export type MemberRequestDetail = {
  requestId: number;
  isForInclusion: boolean;
  // Datos del solicitante
  requestingMemberId: number; //SI NO TIENE ESTO NO SE IMPRIMIRÁ
  requestingMemberSubCode: string;
  requestingMemberName: string;
  requestingMemberLastName: string;
  requestingMemberMembershipId: number | null;
  requestingMemberMembershipState: string | null;
  // Datos del familiar
  familiarUserId: number | null; //del user
  familiarDocumentType: string | null;
  familiarDocumentId: string | null;
  familiarBirthDate: Date | null;
  familiarName: string | null;
  familiarLastName: string | null;
  // MemberType del familiar (si inclusión: newMemberType; si exclusión: memberToExclude.memberTypeId)
  memberTypeId: number | null;
  memberTypeName: string | null;
  // Razón de la solicitud (para ambos)
  reason: string;
  // Contacto del familiar
  familiarEmail: string | null;
  familiarPhone: string | null;
  // Info de la solicitud
  submissionDate: Date | null;
  requestState: string | null;
};

export const getMemberRequestDetail = async (
  requestId: number
): Promise<MemberRequestDetail> => {
  // 1) Verificar si existe un registro de inclusión para este requestId
  const [incRow] = await db
    .select({
      id: memberInclusionRequest.id,
      newMemberType: memberInclusionRequest.newMemberType,
      idUserReferenced: memberInclusionRequest.idUserReferenced,
    })
    .from(memberInclusionRequest)
    .where(eq(memberInclusionRequest.id, requestId));

  // 2) Leer datos genéricos de memberRequest
  const [reqRow] = await db
    .select({
      id: memberRequest.id,
      submissionDate: memberRequest.submissionDate,
      requestState: memberRequest.requestState,
      reason: memberRequest.reason,
      requestingMemberId: memberRequest.idRequestingMember,
    })
    .from(memberRequest)
    .where(eq(memberRequest.id, requestId));

  if (!reqRow) {
    throw new Error("MemberRequest no encontrada");
  }

  const {
    id: _,
    submissionDate,
    requestState,
    reason,
    requestingMemberId,
  } = reqRow;

  // 3) Obtener datos del “solicitante” (miembro que generó la solicitud)
  //    3a) Traer subCode, nombre/apellido
  const [requestingMemberUser] = await db
    .select({
      id: member.id,
      subCode: member.subCode,
      name: user.name,
      lastname: user.lastname,
    })
    .from(member)
    .innerJoin(user, eq(user.id, member.id))
    .where(eq(member.id, requestingMemberId!));
  if (!requestingMemberUser) {
    throw new Error("Miembro solicitante no encontrado");
  }

  //    3b) Encontrar la membresía “actual” o más reciente de ese miembro (sin endDate o, si no hay, la última)
  const [mxmRow] = await db
    .select({
      membershipId: membershipXMember.membershipId,
    })
    .from(membershipXMember)
    .where(
      and(
        eq(membershipXMember.memberId, requestingMemberId!),
        sql`${membershipXMember.endDate} IS NULL`
      )
    )
    .limit(1);

  let requestingMemberMembershipId: number | null = null;
  let requestingMemberMembershipState: string | null = null;
  if (mxmRow) {
    requestingMemberMembershipId = mxmRow.membershipId;
    // Leer estado desde membership
    const [mRow] = await db
      .select({ state: membership.state })
      .from(membership)
      .where(eq(membership.id, mxmRow.membershipId));
    requestingMemberMembershipState = mRow?.state ?? null;
  }

  // 4) Branch según inclusión o exclusión
  if (incRow) {
    // === CASO INCLUSIÓN ===
    const { newMemberType, idUserReferenced } = incRow;

    if (!idUserReferenced) {
      throw new Error("Inclusión sin usuario referenciado");
    }

    // 4a) Leer info del usuario referenciado (familiar)
    const [famUser] = await db
      .select({
        id: user.id,
        documentType: user.documentType,
        documentID: user.documentID,
        birthDate: user.birthDate,
        name: user.name,
        lastname: user.lastname,
        phoneNumber: user.phoneNumber,
        accountID: user.accountID,
      })
      .from(user)
      .where(eq(user.id, idUserReferenced));
    if (!famUser) {
      throw new Error("Usuario referenciado (familiar) no encontrado");
    }

    // 4b) El “email” del familiar viene del registro en auth
    const [famAuth] = await db
      .select({ email: auth.email })
      .from(auth)
      .where(eq(auth.id, famUser.accountID));
    const familiarEmail = famAuth?.email ?? null;

    // 4c) Traer nombre de MemberType
    const [mtRow] = await db
      .select({ name: memberType.name })
      .from(memberType)
      .where(eq(memberType.id, newMemberType));
    const memberTypeName = mtRow?.name ?? null;

    return {
      requestId,
      isForInclusion: true,
      // Solicitante
      requestingMemberId: requestingMemberUser.id,
      requestingMemberSubCode: requestingMemberUser.subCode,
      requestingMemberName: requestingMemberUser.name,
      requestingMemberLastName: requestingMemberUser.lastname,
      requestingMemberMembershipId,
      requestingMemberMembershipState,
      // Familiar (inclusión)
      familiarUserId: famUser.id,
      familiarDocumentType: famUser.documentType,
      familiarDocumentId: famUser.documentID,
      familiarBirthDate: famUser.birthDate,
      familiarName: famUser.name,
      familiarLastName: famUser.lastname,
      memberTypeId: newMemberType,
      memberTypeName,
      // Razón e info general
      reason,
      familiarEmail,
      familiarPhone: famUser.phoneNumber,
      submissionDate,
      requestState,
    };
  } else {
    // === CASO EXCLUSIÓN ===
    // 5a) Leer registro en memberExclusionRequest
    const [exRow] = await db
      .select({
        memberToExclude: memberExclusionRequest.memberToExclude,
        reasonToExclude: memberExclusionRequest.reasonToExclude,
      })
      .from(memberExclusionRequest)
      .where(eq(memberExclusionRequest.id, requestId));

    if (!exRow) {
      throw new Error("Ni inclusión ni exclusión encontrada para ese requestId");
    }

    const { memberToExclude, reasonToExclude } = exRow;

    // 5b) Leer info del “familiar a excluir” (ese familiar ya es miembro: member → user)
    const [famMember] = await db
      .select({
        memberTypeId: member.memberTypeId,
        subCode: member.subCode,
      })
      .from(member)
      .where(eq(member.id, memberToExclude));

    if (!famMember) {
      throw new Error("Miembro (familiar) a excluir no encontrado");
    }

    const { memberTypeId, subCode: famSubCode } = famMember;

    // 5c) Leer datos de usuario del familiar
    const [famUser] = await db
      .select({
        id: user.id,
        documentType: user.documentType,
        documentID: user.documentID,
        birthDate: user.birthDate,
        name: user.name,
        lastname: user.lastname,
        phoneNumber: user.phoneNumber,
        accountID: user.accountID,
      })
      .from(user)
      .where(eq(user.id, memberToExclude));
    if (!famUser) {
      throw new Error("Usuario (familiar) a excluir no encontrado");
    }

    // 5d) El “email” para exclusión lo tomamos de `auth` asociado a ese user:
    const [famAuth] = await db
      .select({ email: auth.email })
      .from(auth)
      .where(eq(auth.id, famUser.accountID));
    const familiarEmail = famAuth?.email ?? null;

    // 5e) Leer nombre de MemberType del familiar
    const [mtRow] = await db
      .select({ name: memberType.name })
      .from(memberType)
      .where(eq(memberType.id, memberTypeId));
    const memberTypeName = mtRow?.name ?? null;

    return {
      requestId,
      isForInclusion: false,
      // Solicitante
      requestingMemberId: requestingMemberUser.id, //????????
      requestingMemberSubCode: requestingMemberUser.subCode,
      requestingMemberName: requestingMemberUser.name,
      requestingMemberLastName: requestingMemberUser.lastname,
      requestingMemberMembershipId,
      requestingMemberMembershipState,
      // Familiar (exclusión)
      familiarUserId: famUser.id,
      familiarDocumentType: famUser.documentType,
      familiarDocumentId: famUser.documentID,
      familiarBirthDate: famUser.birthDate,
      familiarName: famUser.name,
      familiarLastName: famUser.lastname,
      memberTypeId,
      memberTypeName,
      // Razón e info general
      reason: reasonToExclude,
      familiarEmail,
      familiarPhone: famUser.phoneNumber,
      submissionDate,
      requestState,
    };
  }
};


export const approveMemberRequest = async (
  requestId: number
): Promise<{ requestId: number }> => {
  return await db.transaction(async (tx) => {
    // 1) Leer la memberRequest
    const [req] = await tx
      .select()
      .from(memberRequest)
      .where(eq(memberRequest.id, requestId));
    if (!req) {
      throw new Error("MemberRequest no encontrada");
    }

    // 2) Marcar como APPROVED
    await tx
      .update(memberRequest)
      .set({ requestState: requestState[2] }) // APPROVED
      .where(eq(memberRequest.id, requestId));

    // 3) Verificar si es INCLUSIÓN
    const [inc] = await tx
      .select()
      .from(memberInclusionRequest)
      .where(eq(memberInclusionRequest.id, requestId));

    if (inc) {
      // --- RUTA DE INCLUSIÓN ---
      const newUserId = inc.idUserReferenced;
      const newMemberTypeId = inc.newMemberType;
      //console.log("inclusion ", newUserId,newMemberTypeId );
      const [usr] = await tx
      .select().from(user).where(eq(user.id, newUserId!)).limit(1); //asumiendo que ta bien
      // 3.1) Obtener el miembro solicitante (titular) y su membershipId activo
      //console.log("usr ", usr );
      await tx.update(auth).set({role:role[1]}).where(eq(auth.id,usr!.accountID)); //ponemos como MEMBER

      const [reqMemberRow] = await tx
        .select({ id: member.id })
        .from(member)
        .where(eq(member.id, req.idRequestingMember!));
      if (!reqMemberRow) {
        //console.log("Miembro solicitante no encontrado");
        throw new Error("Miembro solicitante no encontrado");
      }
      const requestingMemberId = reqMemberRow.id;

      const [activeLink] = await tx
        .select({ membershipId: membershipXMember.membershipId })
        .from(membershipXMember)
        .where(
          and(
            eq(membershipXMember.memberId, requestingMemberId),
            sql`${membershipXMember.endDate} IS NULL`
          )
        )
        .limit(1);
      if (!activeLink) {
        //console.log("Membresía activa del solicitante no encontrada");
        throw new Error("Membresía activa del solicitante no encontrada");
      }
      //console.log("activeLink ", activeLink );
      const membershipId = activeLink.membershipId;

      // 3.2) Generar subCode para el nuevo miembro
      //  - obtener el código de la membresía
      const [membRow] = await tx
        .select({ code: membership.code })
        .from(membership)
        .where(eq(membership.id, membershipId));
      if (!membRow) {
        throw new Error("Membresía no encontrada");
      }
      const membershipCode = membRow.code;
      //console.log("membRow ", membRow );
      //  - contar cuántos miembros ya tiene la membresía
      const countRes = await tx
        .select({ cnt: sql<number>`COUNT(*)` })
        .from(membershipXMember)
        .where(eq(membershipXMember.membershipId, membershipId));

      const existingCount = Number(countRes[0]?.cnt || 0);
      const newIndex = existingCount + 1;
      const subCode = formatMemberSubCode(membershipCode, usr?.id ?? Math.random() ); // en el peor de los casos xd

      // 3.3) Insertar nuevo registro en member
      const memberDto = {
        id: newUserId!, //asumimos que tiene el valor
        subCode,
        isActive: true,
        memberTypeId: newMemberTypeId,
      };
      await tx.insert(member).values(memberDto);
      //console.log("member ", memberDto );
      // 3.4) Vincular el nuevo member a la membresía en membershipXMember
      const now = new Date();
      const mxmDto = {
        memberId: newUserId!, //asumimos que tiene el valor
        membershipId,
        startDate: now,
        endDate: null,
        reasonToEnd: null,
      };
      await tx.insert(membershipXMember).values(mxmDto);
      //console.log("membershipXMember insertao ", mxmDto );
      // 3.5) Crear factura "CUOTA DE INGRESO" para el solicitante (titular)
      //  - obtener inclusionCost del memberType
      const [mtRow] = await tx
        .select({ cost: memberType.inclusionCost, typeName: memberType.name })
        .from(memberType)
        .where(eq(memberType.id, newMemberTypeId));
      if (!mtRow) {
        throw new Error("MemberType de inclusión no encontrado");
      }
      const cost = mtRow.cost.toFixed(2);
      //console.log("mtRow ", mtRow );
      //  - billDto
      const billDto = {
        finalAmount: cost,
        status: debtStatus[0], // PENDING
        description: "CUOTA DE INGRESO DEL MIEMBRO " + usr?.name + " " + usr?.lastname,
        createdAt: now,
        dueDate: addOneMonth(now),
        userId: requestingMemberId,
      };
      const [billRec] = await tx.insert(bill).values(billDto).$returningId();
      if (!billRec) {
        //console.log("No se creó la factura de ingreso" );

        throw new Error("No se creó la factura de ingreso");
      }
      const billId = billRec.id;
    //console.log("billRec ", billRec );
      //  - billDetailDto
      const bdDto = {
        billId,
        price: cost,
        discount: "0.00",
        finalPrice: cost,
        description: "CUOTA DE INGRESO DE TIPO " + mtRow.typeName ,
      };
      const [bdRec] = await tx.insert(billDetail).values(bdDto).$returningId();
      if (!bdRec) {
        //console.log("No se creó el detalle de factura de ingreso" );

        throw new Error("No se creó el detalle de factura de ingreso");
      }
      const billDetailId = bdRec.id;
//console.log("bdDto ", bdDto );
      
      // 3.6) Llamar a addNewMemberFeeToMembership con el nuevo miembro
      await addNewMemberFeeToMembership(tx,newUserId!); //asumiendo vaina

      return { requestId };
    }

    // 4) Si no es inclusión, verificar si es EXCLUSIÓN
    const [excl] = await tx
      .select()
      .from(memberExclusionRequest)
      .where(eq(memberExclusionRequest.id, requestId));
    if (excl) {
      // --- RUTA DE EXCLUSIÓN ---
      const toExcludeMemberId = excl.memberToExclude;
      const now = new Date();

      // 4.1) Encontrar la fila activa en membershipXMember y actualizar endDate + reasonToEnd
      await tx
        .update(membershipXMember)
        .set({
          endDate: now,
          reasonToEnd: reasonToEndMembership[2], // DISAFFILIATION, o debería ser TERMINATION? nah
        })
        .where(
          and(
            eq(membershipXMember.memberId, toExcludeMemberId),
            sql`${membershipXMember.endDate} IS NULL`
          )
        );

      return { requestId };
    }

    throw new Error("La solicitud no es ni de inclusión ni de exclusión");
  });
};

/**
 * Rechaza una MemberRequest (ya sea de inclusión o exclusión),
 * marcando su estado como REJECTED (índice 1).
 *
 * @param requestId  ID de la MemberRequest a rechazar.
 * @returns          Un objeto con el mismo requestId.
 * @throws           Error si no existe la MemberRequest con ese ID.
 */
export const rejectMemberRequest = async (
  requestId: number
): Promise<{ requestId: number }> => {
  // Intentamos leer la fila para asegurarnos de que exista
  const [existing] = await db
    .select()
    .from(memberRequest)
    .where(eq(memberRequest.id, requestId));

  if (!existing) {
    throw new Error("MemberRequest no encontrada");
  }

  // Actualizamos su estado a REJECTED (índice 1)
  await db
    .update(memberRequest)
    .set({ requestState: requestState[1] }) // REJECTED
    .where(eq(memberRequest.id, requestId));

  return { requestId };
};